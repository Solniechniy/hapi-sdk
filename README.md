# HAPI TON SDK Documentation

## Installation

```bash
npm install hapi-ton-sdk
```

## Basic Setup

```typescript
import { HapiSDK } from "hapi-ton-sdk";

const sdk = new HapiSDK({
  referralId: 0, // Optional referral ID
  staging: false, // Use staging environment
  testnet: true, // Use testnet (true) or mainnet (false)
});
```

## Integration Flow

### 1. Setting Up TON Connect

First, install the TON Connect UI package:

```bash
npm install @tonconnect/ui-react
```

Initialize TON Connect UI in your React application:

```tsx
import { TonConnectUIProvider } from "@tonconnect/ui-react";

export function App() {
  return (
    <TonConnectUIProvider manifestUrl="https://<YOUR_APP_URL>/tonconnect-manifest.json">
      {/* Your app */}
    </TonConnectUIProvider>
  );
}
```

### 2. Authentication Hook

Create a hook to handle authentication and JWT token retrieval:

```tsx
import { useBackendAuth } from "./hooks/useBackAuth";

function YourComponent() {
  const [jwt, setJwt] = useState<string | null>(
    localStorage.getItem("hapi-app-auth-token")
  );

  useBackendAuth(sdk, setJwt); // This will handle the authentication flow

  // ... rest of your component
}
```

The authentication hook will:

- Handle wallet connection/disconnection
- Manage JWT token storage and refresh
- Handle TON Connect proof verification
- Automatically refresh the connection payload every 20 minutes

### 3. Get Trust Score Information

Once you have the JWT token, you can get the trust score:

```typescript
try {
  const trustScoreResponse = await sdk.getTrustScore(
    walletAddress,
    network, // -3 for testnet, -239 for mainnet
    jwt
  );
  console.log("Trust Score:", trustScoreResponse);
  // Example response:
  // {
  //     score: 85,
  //     expiration: 1234567890,
  //     signature: "hex string",
  //     isRemint: false
  // }
} catch (error) {
  console.error("Failed to get trust score:", error);
}
```

### 4. Calculate Transaction Fee

Before sending the transaction, calculate the total required fee:

```typescript
const fee = await sdk.calculateTransactionFee(
  isRemint, // true for update, false for new attestation
  contractAdapter
);

console.log("Transaction Fees:", {
  createFee: fee.createFee.toString(),
  gasFee: fee.gasFee.toString(),
  commission: fee.commission.toString(),
  storage: fee.storage.toString(),
  total: fee.total.toString(),
});
```

### 5. Create Attestation

Create and send an attestation transaction:

```typescript
const hapiContract = HapiTonAttestation.createFromAddress(
  config.tonTestnet.score,
  contractAdapter
);

const signatureBuffer = Buffer.from(localTrustScore.signature, "hex");

await hapiContract.sendCreateAttestation(sender, {
  queryId: 0,
  value: fee,
  trustScore: localTrustScore.score,
  expirationDate: localTrustScore.expiration,
  signature: signatureBuffer,
  referralId: 0n,
});

// Track the attestation result
const result = await sdk.trackAttestationResult(messageHash);
```

### 6. Get On-chain Trust Score

To retrieve the trust score from the blockchain:

```typescript
const userJettonAddress =
  HapiTonAttestation.getStaticUserJettonAddress(walletAddress);

const jettonContract = UserTonJetton.createFromAddress(
  userJettonAddress,
  contractAdapter
);

const onchainUserScore = await jettonContract.getAttestationData();
```

## Example Implementation

A complete example implementation can be found in the `example` directory. The example demonstrates:

- TON Connect integration
- Authentication flow
- Trust score retrieval
- Attestation creation
- On-chain data reading

To run the example:

1. Navigate to the example directory
2. Install dependencies: `npm install`
3. Start the development server: `npm run dev`

## Configuration

The SDK supports the following configuration options:

```typescript
interface HapiSDKConfig {
  referralId?: number | bigint;
  staging?: boolean;
  testnet?: boolean;
}
```

- `referralId`: Optional referral ID for tracking
- `staging`: Use staging environment (default: false)
- `testnet`: Use testnet instead of mainnet (default: false)

### SDK works with TON API clients and use TON API method for getting the transaction hash based on transaction message hash, be sure to provide the TON API key and create public client like it demonstrated in example folder.

## Dependencies

The SDK requires the following dependencies:

- @ton-api/client
- @ton-api/ton-adapter
- @ton/core
- @tonconnect/ui-react
- buffer

Make sure to install these dependencies in your project.

## Error Handling

```typescript
try {
  // Your SDK operations
} catch (error) {
  if (error.message.includes("Failed to get trust score")) {
    // Handle trust score retrieval errors
  } else if (error.message.includes("Failed to get user attestation data")) {
    // Handle attestation data errors
  } else {
    // Handle other errors
  }
}
```

## Additional Features

### Get User Attestation Data

Retrieve on-chain attestation data for a specific user:

```typescript
const attestationData = await sdk.getUserAttestationData(userAddress);
console.log("Jetton Address:", attestationData.jettonAddress.toString());
console.log(
  "Trust Score:",
  attestationData.attestationData.trustScore.toString()
);
console.log(
  "Expiration Date:",
  attestationData.attestationData.expirationDate.toString()
);
```

### Get Attestation by Address

Query attestation information for a specific address:

```typescript
const attestation = await sdk.getAttestationByAddress(userAddress);
console.log("Attestation:", attestation);
```

## Type Definitions

```typescript
interface SDKConfig {
  endpoint: string;
  contractAddress: string;
  tonApiKey: string;
  nodeUrl: string;
  referralId?: string;
}

interface TrustScoreResponse {
  trustScore: number;
  expirationDate: number;
  signature: Buffer;
}

interface CreateAttestationOptions {
  queryId: number;
  trustScore: number;
  expirationDate: number;
  signature: Buffer;
  value: bigint;
  referralId?: bigint;
}
```

## Contract Addresses

- Testnet: `EQBiXrm6sM4V2SxDPDDuEr-qALlRl-utFx0g2gzaGIcS827a`
- Mainnet: `EQAvUDmCAM9Zl_i3rXeYA2n-s_uhM4rTBhzAQUeJIxEOB62i`

## Token Management

The JWT token is stored in localStorage for session management:

```typescript
// Store token
localStorage.setItem("hapi-app-auth-token", jwt);

// Retrieve token
const jwt = localStorage.getItem("hapi-app-auth-token");

// Remove token (logout)
localStorage.removeItem("hapi-app-auth-token");
```

Errors:

Error: Unknown error occurred - check your ton api url + token;
