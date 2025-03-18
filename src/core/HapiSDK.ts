import { Address } from "@ton/core";
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
import { config } from "../../config";

export class HapiSDK {
  private config: SDKConfig;
  private publicClient: TonApiClient;
  private contractAdapter: ContractAdapter;

  constructor(args: {
    referralId: number;
    publicClient?: string | TonApiClient;
    tonApiKey?: string;
  }) {
    this.config = {
      hapiEndpoint: config.apiStaging,
      contractAddress: config.ton.score,
      nodeUrl: config.ton.nodeUrl,
      referralId: args.referralId,
    };
    if (typeof args.publicClient === "string") {
      this.publicClient = new TonApiClient({
        baseUrl: args.publicClient,
        baseApiParams: {
          headers: {
            Authorization: `Bearer ${args.tonApiKey}`,
            "Content-type": "application/json",
          },
        },
      });
    } else if (args.publicClient) {
      this.publicClient = args.publicClient;
    } else {
      throw new Error("Public client is required");
    }
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

  async getUserAttestationOnchain(userAddress: string): Promise<{
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
    userAddress: string,
    trustScore: number,
    timeInterval = 7000,
    maxRetries = 9
  ) {
    let attempt = 0;
    let status: boolean | null = null;
    let data;

    const userJettonAddress =
      HapiTonAttestation.getStaticUserJettonAddress(userAddress);
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
              address: userAddress,
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

  private prepareCreateAttestation(opts: {
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

  private prepareUpdateAttestation(opts: {
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

  async prepareAttestation(
    opts: {
      trustScore: number;
      expirationDate: number;
      signature: Buffer;
      value?: bigint;
      referralId?: bigint;
    },
    isUpdate: boolean
  ) {
    const value = opts.value ?? (await this.calculateTransactionFee(isUpdate));
    if (isUpdate) {
      return this.prepareUpdateAttestation({
        ...opts,
        queryId: Number(isUpdate),
        value,
      });
    }
    return this.prepareCreateAttestation({
      ...opts,
      queryId: Number(isUpdate),
      value,
    });
  }

  async calculateTransactionFee(isUpdate: boolean): Promise<bigint> {
    try {
      const hapiContract = HapiTonAttestation.createFromAddress(
        this.config.contractAddress,
        this.contractAdapter
      );

      const fee = isUpdate
        ? await hapiContract.getUpdateAttestationFee()
        : await hapiContract.getCreateAttestationFee();

      return isUpdate
        ? fee + TON_DEFAULT_GAS + TON_MIN_COMMISSION
        : fee + TON_DEFAULT_GAS + TON_MIN_COMMISSION + TON_MIN_JETTON_STORAGE;
    } catch (error) {
      throw new Error(`Failed to calculate transaction fee: ${error}`);
    }
  }
}
