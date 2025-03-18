import { Address, ContractProvider, Sender, toNano } from "@ton/core";
import axios, { AxiosError } from "axios";
import { TonApiClient } from "@ton-api/client";
import { ContractAdapter } from "@ton-api/ton-adapter";
import { SDKConfig, TrustScoreResponse, AttestationOptions } from "../types";
import { HapiTonAttestation } from "../contracts/HapiAttestation";
import { UserTonJetton } from "../contracts/UserJetton";
import {
  delay,
  TON_DEFAULT_GAS,
  TON_MIN_COMMISSION,
  TON_MIN_JETTON_STORAGE,
} from "../utils";
import { config } from "../../config";

/**
 * HapiSDK - Core SDK for managing TON attestations
 */
export class HapiSDK {
  private config: SDKConfig;
  private publicClient: TonApiClient;
  private contractAdapter: ContractAdapter;
  private contractAddress: Address;

  /**
   * Initialize the SDK
   * @param args Configuration parameters
   */
  constructor(args: {
    referralId: number;
    publicClient?: string | TonApiClient;
    tonApiKey?: string;
    endpoint?: string;
    contractAddress?: string;
  }) {
    this.config = {
      hapiEndpoint: args.endpoint || config.apiStaging,
      contractAddress: args.contractAddress || config.ton.score,
      nodeUrl: config.ton.nodeUrl,
      referralId: args.referralId,
      tonApiKey: args.tonApiKey,
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
    this.contractAddress = Address.parse(this.config.contractAddress);
  }

  /**
   * Get HAPI contract instance
   * @returns HapiTonAttestation contract instance
   */
  private getHapiContract(): HapiTonAttestation {
    return HapiTonAttestation.createFromAddress(
      this.contractAddress,
      this.contractAdapter
    );
  }

  /**
   * Retrieve user's trust score using JWT
   * @param jwt Authentication token
   * @returns Trust score data
   */
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
      const axiosError = error as AxiosError;
      if (axiosError.response) {
        throw new Error(
          `Failed to get trust score: ${axiosError.response.status} - ${axiosError.response.statusText}`
        );
      }
      throw new Error(`Failed to get trust score: ${error}`);
    }
  }

  /**
   * Get on-chain attestation data for a user
   * @param userAddress User's TON address
   * @returns Attestation data and jetton address
   */
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

  /**
   * Track attestation result after transaction
   * @param userAddress User's TON address
   * @param trustScore Expected trust score
   * @param timeInterval Polling interval in milliseconds
   * @param maxRetries Maximum number of retry attempts
   * @returns Status and attestation data
   */
  async trackAttestationResult(
    userAddress: string,
    trustScore: number,
    timeInterval = 7000,
    maxRetries = 9
  ): Promise<{
    status: boolean | null;
    data?: any;
  }> {
    let attempt = 0;
    let status: boolean | null = null;
    let data;

    const userJettonAddress =
      HapiTonAttestation.getStaticUserJettonAddress(userAddress);
    const jettonContract = UserTonJetton.createFromAddress(
      userJettonAddress,
      this.contractAdapter
    );

    while (attempt < maxRetries) {
      try {
        await delay(timeInterval);
        const localData = await jettonContract.getAttestationData();

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
          `Error while getting attestation data for jetton=${userJettonAddress}:`,
          error
        );
      }

      attempt++;
    }

    return { status, data };
  }

  /**
   * Prepare create attestation transaction
   * @param opts Attestation options
   * @returns Transaction cell
   */
  prepareCreateAttestation(opts: AttestationOptions) {
    const hapiContract = this.getHapiContract();
    return hapiContract.prepareCreateAttestation({
      queryId: opts.queryId,
      trustScore: opts.trustScore,
      expirationDate: opts.expirationDate,
      signature: opts.signature,
      value: opts.value,
      referralId: BigInt(this.config.referralId),
    });
  }

  /**
   * Prepare update attestation transaction
   * @param opts Attestation options
   * @returns Transaction cell
   */
  prepareUpdateAttestation(opts: AttestationOptions) {
    const hapiContract = this.getHapiContract();
    return hapiContract.prepareUpdateAttestation({
      queryId: opts.queryId,
      trustScore: opts.trustScore,
      expirationDate: opts.expirationDate,
      signature: opts.signature,
      value: opts.value,
    });
  }

  /**
   * Prepare attestation transaction (create or update)
   * @param opts Attestation options
   * @param isUpdate Whether to update existing attestation
   * @returns Transaction cell
   */
  prepareAttestation(opts: AttestationOptions, isUpdate: boolean) {
    return isUpdate
      ? this.prepareUpdateAttestation(opts)
      : this.prepareCreateAttestation(opts);
  }

  /**
   * Send create attestation transaction
   * @param provider Contract provider
   * @param via Sender
   * @param opts Attestation options
   */
  async sendCreateAttestation(
    provider: ContractProvider,
    via: Sender,
    opts: AttestationOptions
  ) {
    const hapiContract = this.getHapiContract();
    return hapiContract.sendCreateAttestation(provider, via, {
      queryId: opts.queryId,
      trustScore: opts.trustScore,
      expirationDate: opts.expirationDate,
      signature: opts.signature,
      value: opts.value,
      referralId: BigInt(this.config.referralId),
    });
  }

  /**
   * Send update attestation transaction
   * @param provider Contract provider
   * @param via Sender
   * @param opts Attestation options
   */
  async sendUpdateAttestation(
    provider: ContractProvider,
    via: Sender,
    opts: AttestationOptions
  ) {
    const hapiContract = this.getHapiContract();
    return hapiContract.sendUpdateAttestation(provider, via, {
      queryId: opts.queryId,
      trustScore: opts.trustScore,
      expirationDate: opts.expirationDate,
      signature: opts.signature,
      value: opts.value,
    });
  }

  /**
   * Calculate transaction fee
   * @param isUpdate Whether to update existing attestation
   * @returns Fee breakdown
   */
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

  /**
   * Get attestation fee from contract
   * @param isUpdate Whether to update existing attestation
   * @returns Fee amount
   */
  async getCreateAttestationFee(isUpdate: boolean): Promise<bigint> {
    const hapiContract = this.getHapiContract();
    return isUpdate
      ? hapiContract.getUpdateAttestationFee()
      : hapiContract.getCreateAttestationFee();
  }

  /**
   * Get contract adapter instance
   * @returns Contract adapter
   */
  getContractAdapter(): ContractAdapter {
    return this.contractAdapter;
  }
}
