export interface TrustScoreResponse {
  errorCode: number;
  wallet: string;
  signature: string;
  trust: number;
  expiration: number;
  isMinted: boolean;
}

export interface AttestationParams {
  signature: string;
  trust: number;
  expiration: number;
  ref_id: number;
}

/**
 * Common options for attestation operations
 */
export interface AttestationOptions {
  queryId: number;
  trustScore: number;
  expirationDate: number;
  signature: Buffer;
  value: bigint;
  referralId?: bigint;
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
  tonApiKey?: string;
}

export interface AttestationChangeEvent {
  userAddress: string;
  refId: number;
}

export const OpCode = {
  createAttestation: 0x8c839e3e, // CRC32 of 'create_attestation'
  updateAttestation: 0x96f9f442, // CRC32 of 'update_attestation'
} as const;
