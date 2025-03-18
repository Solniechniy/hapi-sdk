/**
 * Type definitions for HAPI SDK
 */

import { Address } from "@ton/core";
import { TonApiClient } from "@ton-api/client";

/**
 * SDK Configuration for HAPI
 */
export interface SDKConfig {
  /** HAPI API endpoint */
  hapiEndpoint: string;
  /** Contract address for attestations */
  contractAddress: string;
  /** TON Node URL */
  nodeUrl: string;
  /** Referral ID for attribution */
  referralId: number;
}

/**
 * Trust score response from the API
 */
export interface TrustScoreResponse {
  /** Error code (0 if no error) */
  errorCode: number;
  /** TON wallet address */
  wallet: string;
  /** Signature to verify authenticity */
  signature: string;
  /** Trust score value */
  trust: number;
  /** Expiration date in UNIX timestamp */
  expiration: number;
  /** Indicates if the attestation is already minted on-chain */
  isMinted: boolean;
}

/**
 * Parameters for attestation
 */
export interface AttestationParams {
  /** Signature to verify authenticity */
  signature: string;
  /** Trust score value */
  trust: number;
  /** Expiration date in UNIX timestamp */
  expiration: number;
  /** Referral ID */
  ref_id: number;
}

/**
 * Options for creating an attestation
 */
export interface CreateAttestationOptions {
  /** Query ID for the transaction */
  queryId: number;
  /** Trust score value to attest */
  trustScore: number;
  /** Expiration date in UNIX timestamp */
  expirationDate: number;
  /** Signature to verify authenticity */
  signature: Buffer;
  /** Value/fee to attach to the transaction */
  value: bigint;
  /** Optional referral ID */
  referralId?: bigint;
}

/**
 * Options for updating an attestation
 */
export interface UpdateAttestationOptions {
  /** Query ID for the transaction */
  queryId: number;
  /** Trust score value to attest */
  trustScore: number;
  /** Expiration date in UNIX timestamp */
  expirationDate: number;
  /** Signature to verify authenticity */
  signature: Buffer;
  /** Value/fee to attach to the transaction */
  value: bigint;
}

/**
 * Attestation change event structure
 */
export interface AttestationChangeEvent {
  /** User TON address */
  userAddress: string;
  /** Referral ID */
  refId: number;
}

/**
 * Operation codes for smart contract interactions
 */
export const OpCode: {
  /** Operation code for creating attestation */
  readonly createAttestation: number;
  /** Operation code for updating attestation */
  readonly updateAttestation: number;
};

/**
 * React hook for handling HAPI backend authentication with TON Connect
 * Manages JWT tokens and authentication payloads
 */
export function useBackendAuth(): void;

/**
 * HAPI SDK Main Class
 */
export default class HapiSDK {
  /**
   * Creates a new instance of the HAPI SDK
   * @param args Configuration parameters for the SDK
   */
  constructor(args: {
    /** Referral ID for attribution */
    referralId: number;
    /** Public TON API client or URL */
    publicClient?: string | TonApiClient;
    /** API key for TON API (required if publicClient is a string) */
    tonApiKey?: string;
  });

  /**
   * Gets the trust score for a user with provided JWT token
   * @param jwt JWT token for authentication
   * @returns Promise with trust score response
   */
  getTrustScore(jwt: string): Promise<TrustScoreResponse>;

  /**
   * Gets user attestation data from the blockchain
   * @param userAddress TON address to query
   * @returns Promise with attestation data and jetton address
   */
  getUserAttestationOnchain(userAddress: string): Promise<{
    jettonAddress: Address;
    attestationData: {
      commissionOwner: Address;
      trustScore: bigint;
      expirationDate: bigint;
      attestationAddress: Address;
    };
  }>;

  /**
   * Tracks the result of an attestation transaction
   * @param userAddress TON address to track
   * @param trustScore Expected trust score value
   * @param timeInterval Time interval between checks in milliseconds (default: 7000)
   * @param maxRetries Maximum number of retry attempts (default: 9)
   * @returns Promise with tracking result
   */
  trackAttestationResult(
    userAddress: string,
    trustScore: number,
    timeInterval?: number,
    maxRetries?: number
  ): Promise<{
    status: boolean | null;
    data?: {
      commissionOwner: Address;
      trustScore: bigint;
      expirationDate: bigint;
      attestationAddress: Address;
    };
  }>;

  /**
   * Prepares an attestation transaction for sending
   * @param opts Attestation options
   * @param isUpdate Whether this is an update of an existing attestation
   * @returns Transaction data
   */
  prepareAttestation(
    opts: {
      trustScore: number;
      expirationDate: number;
      signature: Buffer;
      value?: bigint;
      referralId?: bigint;
    },
    isUpdate: boolean
  ): any;

  /**
   * Calculates the transaction fee for creating or updating an attestation
   * @param isUpdate Whether this is an update of an existing attestation
   * @returns Promise with fee as bigint
   */
  calculateTransactionFee(isUpdate: boolean): Promise<bigint>;
}
