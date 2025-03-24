import { crc32 } from "../utils/crc32";

export interface UserResponse {
  errorCode: number;
  scores: [
    {
      address: string;
      expirationDate: number | null;
      isMinted: boolean;
      network: string;
      score: number | null;
    }
  ];
}

export interface TrustResponseData {
  errorCode: number;
  wallet: string;
  score: number;
  expiration: number;
  signature: string;
  validation?: string;
  attestationId?: string | null;
  recovery_id?: string;
  isRemint?: boolean;
}

export interface AttestationParams {
  signature: string;
  trust: number;
  expiration: number;
  ref_id: number;
}

export interface CreateAttestationOptions {
  queryId: number;
  trustScore: number;
  expirationDate: number;
  signature: Buffer;
  value: bigint;
  referralId?: bigint;
}

export interface UpdateAttestationOptions {
  queryId: number;
  trustScore: number;
  expirationDate: number;
  signature: Buffer;
  value: bigint;
}

export interface SDKConfig {
  hapiEndpoint: string;
  contractAddress: string;
  nodeUrl: string;
  referralId: number;
}

export interface AttestationChangeEvent {
  userAddress: string;
  refId: number;
}

export const OpCode = {
  createAttestation: crc32("create_attestation"),
  updateAttestation: crc32("update_attestation"),
} as const;
