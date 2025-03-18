// Trust score response from the API
export interface TrustScoreResponse {
  status: number;
  result: {
    address: string;
    score: number;
    signature: string;
    token?: string;
  };
}

// Attestation fee data
export interface FeeData {
  createFee: string;
  gasFee: string;
  commission: string;
  storage: string;
  total: string;
}

// Attestation options for preparing transactions
export interface AttestationOptions {
  queryId: number;
  trustScore: number;
  expirationDate: number;
  signature: Uint8Array;
  value: string;
}

// Attestation data from the blockchain
export interface AttestationData {
  address: string;
  trustScore: number;
  expirationDate: number;
  timestamp: number;
}

// SDK configuration
export interface SDKConfig {
  referralId?: number;
  endpoint?: string;
  contractAddress?: string;
}

// Result of the SDK operations
export type SDKResult =
  | TrustScoreResponse
  | FeeData
  | AttestationData
  | { message: string; transaction: any }
  | null;
