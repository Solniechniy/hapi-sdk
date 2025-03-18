/**
 * Type definitions for HAPI SDK
 */

import { TonApiClient } from "@ton-api/client";

declare module "hapi-ton-sdk" {
  /**
   * Configuration for the HAPI SDK
   */
  export interface SDKConfig {
    /** Referral ID for attribution */
    referralId: number;
    /** Public TON API endpoint */
    publicClient: string;
    /** API key for TON API */
    tonApiKey: string;
    /** HAPI API endpoint */
    endpoint: string;
    /** Contract address for attestations */
    contractAddress: string;
  }

  /**
   * Trust score response from the API
   */
  export interface TrustScoreResponse {
    /** Status code of the response */
    status: number;
    /** Result data */
    result: {
      /** TON address */
      address: string;
      /** Trust score value */
      score: number;
      /** Signature to verify authenticity */
      signature: string;
      /** Optional token for future requests */
      token?: string;
    };
  }

  /**
   * Transaction fee calculation result
   */
  export interface FeeData {
    /** Base fee for creating an attestation */
    createFee: string;
    /** Gas fee for transaction */
    gasFee: string;
    /** Commission fee */
    commission: string;
    /** Storage fee */
    storage: string;
    /** Total fee amount */
    total: string;
  }

  /**
   * Options for preparing an attestation transaction
   */
  export interface AttestationOptions {
    /** Query ID for the transaction */
    queryId: number;
    /** Trust score value to attest */
    trustScore: number;
    /** Expiration date in UNIX timestamp */
    expirationDate: number;
    /** Signature to verify authenticity */
    signature: Uint8Array;
    /** Value/fee to attach to the transaction */
    value: string;
  }

  /**
   * Attestation data from the blockchain
   */
  export interface AttestationData {
    /** TON address */
    address: string;
    /** Trust score value */
    trustScore: number;
    /** Expiration date in UNIX timestamp */
    expirationDate: number;
    /** Timestamp when attestation was created */
    timestamp: number;
  }

  /**
   * React hook for handling HAPI backend authentication
   */
  export function useBackendAuth(): void;

  /**
   * HAPI SDK Main Class
   */
  export default class HapiSDK {
    /**
     * Creates a new instance of the HAPI SDK
     * @param config SDK configuration
     */
    constructor(args: {
      referralId: number;
      publicClient?: string | TonApiClient;
      tonApiKey?: string;
    });

    /**
     * Gets the trust score for a user with provided JWT token
     * @param jwt JWT token for authentication
     * @returns Promise with trust score response
     */
    getTrustScore(jwt: string): Promise<TrustScoreResponse>;

    /**
     * Calculates the transaction fee for creating or updating an attestation
     * @param isUpdate Whether this is an update of an existing attestation
     * @returns Promise with fee data
     */
    calculateTransactionFee(isUpdate?: boolean): Promise<FeeData>;

    /**
     * Prepares an attestation transaction for sending
     * @param opts Attestation options
     * @param isUpdate Whether this is an update of an existing attestation
     * @returns Transaction data
     */
    prepareAttestation(opts: AttestationOptions, isUpdate?: boolean): any;

    /**
     * Gets user attestation data from the blockchain
     * @param address TON address to query
     * @returns Promise with attestation data
     */
    getUserAttestationData(address: string): Promise<AttestationData>;

    /**
     * Tracks the result of an attestation transaction
     * @param address TON address to track
     * @param trustScore Expected trust score value
     * @param timeInterval Time interval between checks in milliseconds
     * @param maxRetries Maximum number of retry attempts
     * @returns Promise with tracking result
     */
    trackAttestationResult(
      address: string,
      trustScore: number,
      timeInterval?: number,
      maxRetries?: number
    ): Promise<any>;
  }
}
