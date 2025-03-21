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
  trust: number;
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
  createAttestation: 0x8c839e3e, // CRC32 of 'create_attestation'
  updateAttestation: 0x96f9f442, // CRC32 of 'update_attestation'
} as const;
