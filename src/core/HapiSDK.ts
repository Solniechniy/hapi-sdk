import { Address } from "@ton/core";
import { ContractAdapter } from "@ton-api/ton-adapter";
import { SDKConfig, TrustResponseData, UserResponse } from "../types";
import { HapiTonAttestation } from "../contracts/HapiAttestation";
import { UserTonJetton } from "../contracts/UserJetton";
import {
  delay,
  TON_DEFAULT_GAS,
  TON_MIN_COMMISSION,
  TON_MIN_JETTON_STORAGE,
} from "../utils";
import { config } from "../config";
import axios from "axios";

export class HapiSDK {
  private config: SDKConfig;

  constructor(args: {
    referralId: number;
    staging?: boolean;
    testnet?: boolean;
    tonApiKey?: string;
  }) {
    this.config = {
      hapiEndpoint: args.staging ? config.apiStaging : config.apiProduction,
      contractAddress: config.ton.score,
      nodeUrl: args.testnet ? config.tonTestnet.nodeUrl : config.ton.nodeUrl,
      network: args.testnet ? -3 : -239,
      referralId: args.referralId,
      tonApiKey: args.tonApiKey,
    };
  }

  async getUser(jwt: string): Promise<UserResponse> {
    try {
      const response = await axios.get(
        `${this.config.hapiEndpoint}/ref/v2/get-user`,
        {
          headers: {
            Authorization: `Bearer ${jwt}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get user: ${error}`);
    }
  }

  async getTrustScore(
    address: string,
    network: number,
    jwt: string
  ): Promise<TrustResponseData> {
    try {
      const response = await axios.post(
        `${this.config.hapiEndpoint}/ref/v2/score`,
        {
          address,
          network,
        },
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

  async getMessage() {
    try {
      const response = await axios.get(
        `${this.config.hapiEndpoint}/ref/v2/ton-payload`
      );
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get ton payload: ${error}`);
    }
  }

  async checkProof({
    proof,
    address,
    network,
  }: {
    proof: {
      state_init: string;
      timestamp: number;
      domain: { lengthBytes: number; value: string };
      payload: string;
      signature: string;
    };
    address: string;
    network: number;
  }) {
    return axios.post(`${this.config.hapiEndpoint}/ref/v2/ton-login`, {
      proof,
      address,
      network,
    });
  }

  static async getUserAttestationOnchain(
    userAddress: string,
    contractAdapter: ContractAdapter
  ): Promise<{
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
        contractAdapter
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
    transactionMessageHash: string,
    timeInterval = 7000,
    maxRetries = 9
  ) {
    let attempt = 0;
    let status: boolean | null = null;
    let data;

    while (attempt < maxRetries) {
      try {
        await delay(timeInterval);
        const transactionData = await axios.get(
          this.config.nodeUrl + config.tonApiPath(transactionMessageHash)
        );

        if (transactionData.status === 200 && transactionData.data.hash) {
          status = true;
          try {
            await axios.post(
              `${this.config.hapiEndpoint}/ref/v2/ref_transaction`,
              {
                hash: transactionData.data.hash,
                network: this.config.network,
              },
              {
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${this.config.tonApiKey}`,
                },
              }
            );
          } catch (error) {
            console.error("Error updating attestation count:", error);
          }
          break;
        } else {
          status = false;
        }
      } catch (error) {
        console.error(`Error: while get locating transaction`, error);
      }

      attempt++;
    }

    return { status, data };
  }

  async calculateTransactionFee(
    isUpdate: boolean,
    contractAdapter: ContractAdapter
  ): Promise<bigint> {
    try {
      const hapiContract = HapiTonAttestation.createFromAddress(
        this.config.contractAddress,
        contractAdapter
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
