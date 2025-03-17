import { Address, toNano } from "@ton/core";
import axios from "axios";
import { TonApiClient } from "@ton-api/client";
import { ContractAdapter } from "@ton-api/ton-adapter";
import { SDKConfig, TrustScoreResponse } from "../types";
import { HapiTonAttestation } from "../contracts/HapiAttestation";
import { UserTonJetton } from "../contracts/UserJetton";
import {
  delay,
  TON_DEFAULT_GAS,
  TON_MIN_COMMISSION,
  TON_MIN_JETTON_STORAGE,
} from "../utils";

export class HapiSDK {
  private config: SDKConfig;
  private publicClient: TonApiClient;
  private contractAdapter: ContractAdapter;

  constructor(config: SDKConfig) {
    this.config = config;
    this.publicClient = new TonApiClient({
      baseUrl: config.nodeUrl,
      baseApiParams: {
        headers: {
          Authorization: `Bearer ${config.tonApiKey}`,
          "Content-type": "application/json",
        },
      },
    });
    this.contractAdapter = new ContractAdapter(this.publicClient);
  }

  async getTrustScore(jwt: string): Promise<TrustScoreResponse> {
    try {
      const response = await axios.get(
        `${this.config.hapiEndpoint}/trust-score`,
        {
          headers: {
            Authorization: `Bearer ${jwt}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get trust score: ${error}`);
    }
  }

  async getUserAttestationData(userAddress: string): Promise<{
    jettonAddress: Address;
    attestationData: {
      commissionOwner: Address;
      trustScore: bigint;
      expirationDate: bigint;
      attestationAddress: Address;
    };
  }> {
    try {
      const jettonAddress =
        HapiTonAttestation.getStaticUserJettonAddress(userAddress);
      const jettonContract = UserTonJetton.createFromAddress(
        jettonAddress,
        this.contractAdapter
      );
      const attestationData = await jettonContract.getAttestationData();

      return {
        jettonAddress,
        attestationData,
      };
    } catch (error) {
      throw new Error(`Failed to get user attestation data: ${error}`);
    }
  }

  async trackAttestationResult(
    userFriendlyAddress: string,
    trustScore: number,
    timeInterval = 7000,
    maxRetries = 9
  ) {
    let attempt = 0;
    let status: boolean | null = null;
    let data;

    const userJettonAddress =
      HapiTonAttestation.getStaticUserJettonAddress(userFriendlyAddress);
    const jettonAddress = UserTonJetton.createFromAddress(
      userJettonAddress,
      this.contractAdapter
    );

    while (attempt < maxRetries) {
      try {
        await delay(timeInterval);
        const localData = await jettonAddress.getAttestationData();

        if (localData.trustScore >= trustScore) {
          status = true;
          data = localData;
          try {
            await axios.post(`${this.config.hapiEndpoint}/attestation/count`, {
              address: userFriendlyAddress,
              refId: this.config.referralId,
            });
          } catch (error) {
            console.error("Error updating attestation count:", error);
          }
          break;
        } else {
          status = false;
        }
      } catch (error) {
        console.error(
          `Error: while get jettonAddress=${jettonAddress} or getTrustScore\n\n`,
          error
        );
      }

      attempt++;
    }

    return { status, data };
  }

  prepareCreateAttestation(opts: {
    queryId: number;
    trustScore: number;
    expirationDate: number;
    signature: Buffer;
    value: bigint;
    referralId?: bigint;
  }) {
    const hapiContract = HapiTonAttestation.createFromAddress(
      this.config.contractAddress,
      this.contractAdapter
    );
    return hapiContract.prepareCreateAttestation({
      queryId: opts.queryId,
      trustScore: opts.trustScore,
      expirationDate: opts.expirationDate,
      signature: opts.signature,
      value: opts.value,
      referralId: BigInt(this.config.referralId),
    });
  }

  prepareUpdateAttestation(opts: {
    queryId: number;
    trustScore: number;
    expirationDate: number;
    signature: Buffer;
    value: bigint;
  }) {
    const hapiContract = HapiTonAttestation.createFromAddress(
      this.config.contractAddress,
      this.contractAdapter
    );
    return hapiContract.prepareUpdateAttestation({
      queryId: opts.queryId,
      trustScore: opts.trustScore,
      expirationDate: opts.expirationDate,
      signature: opts.signature,
      value: opts.value,
    });
  }

  prepareAttestation(
    opts: {
      queryId: number;
      trustScore: number;
      expirationDate: number;
      signature: Buffer;
      value: bigint;
      referralId?: bigint;
    },
    isUpdate: boolean
  ) {
    if (isUpdate) {
      return this.prepareUpdateAttestation(opts);
    }
    return this.prepareCreateAttestation(opts);
  }

  async calculateTransactionFee(isUpdate: boolean): Promise<{
    total: bigint;
    createFee: bigint;
    gasFee: bigint;
    commission: bigint;
    storage: bigint;
  }> {
    try {
      const createFee = await this.getCreateAttestationFee(isUpdate);

      return {
        createFee,
        gasFee: TON_DEFAULT_GAS,
        commission: TON_MIN_COMMISSION,
        storage: TON_MIN_JETTON_STORAGE,
        total:
          createFee +
          TON_DEFAULT_GAS +
          TON_MIN_COMMISSION +
          TON_MIN_JETTON_STORAGE,
      };
    } catch (error) {
      throw new Error(`Failed to calculate transaction fee: ${error}`);
    }
  }

  async getCreateAttestationFee(isUpdate: boolean): Promise<bigint> {
    const hapiContract = HapiTonAttestation.createFromAddress(
      this.config.contractAddress,
      this.contractAdapter
    );
    return isUpdate
      ? hapiContract.getUpdateAttestationFee()
      : hapiContract.getCreateAttestationFee();
  }
}
