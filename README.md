# HAPI TON SDK Documentation

A TypeScript SDK for managing address attestations on the TON blockchain. This SDK simplifies the process of retrieving trust scores, creating and managing attestations, and tracking attestation status.

## Features

- 🔒 Secure JWT-based authentication
- 🔄 Create and update attestations on TON
- 📊 Get user trust scores from HAPI Protocol
- ⚡ Optimized for TON Connect integration
- 📱 Simple interface for retrieving on-chain data
- 💸 Accurate fee calculation
- 📘 Full TypeScript support with type definitions

## Installation

```bash
npm install @hapi/ton-sdk
```

## Quick Start

```typescript
import { HapiSDK } from "@hapi/ton-sdk";
import { TonConnectUI } from "@tonconnect/ui-react";

// Initialize SDK
const sdk = new HapiSDK({
  referralId: 123,
  publicClient: "https://tonapi.io/v2",
  tonApiKey: "<YOUR_TON_API_KEY>",
  endpoint: "https://api.hapi.one", // Optional - defaults to staging
  contractAddress: "EQAvUDmCAM9Zl_i3rXeYA2n-s_uhM4rTBhzAQUeJIxEOB62i", // Optional - defaults to mainnet
});

// Get and use JWT
const jwt = localStorage.getItem("hapi-app-auth-token");
const trustScore = await sdk.getTrustScore(jwt);

// Prepare attestation
const createOpts = {
  queryId: Date.now(),
  trustScore: trustScore.trust,
  expirationDate: trustScore.expiration,
  signature: Buffer.from(trustScore.signature, "hex"),
  value: await calculateFees(),
};

// Send attestation
const wallet = tonConnectUI.wallet;
if (wallet) {
  const result = await sdk.sendCreateAttestation(provider, wallet, createOpts);

  // Track result
  const status = await sdk.trackAttestationResult(
    wallet.account.address,
    trustScore.trust
  );
}
```

## TypeScript Support

The SDK comes with full TypeScript support including comprehensive type definitions for all features.

### Types for SDK Configuration

```typescript
// SDK initialization with full type checking
const sdk = new HapiSDK({
  referralId: 123,
  publicClient: "https://tonapi.io/v2",
  tonApiKey: "your-api-key",
  endpoint: "https://api.hapi.one",
  contractAddress: "EQAvUDmCAM9Zl_i3rXeYA2n-s_uhM4rTBhzAQUeJIxEOB62i",
});
```

### Authentication Hook with TypeScript

```typescript
import { useBackendAuth } from "hapi-ton-sdk";

function AuthComponent() {
  const { isAuthenticated, token, authenticate, logout, loading, error } =
    useBackendAuth({
      storageKey: "custom-token-key", // Optional
      authEndpoint: "https://custom-auth.example.com", // Optional
      onAuthStateChange: (isAuth) => console.log(`Auth state: ${isAuth}`), // Optional
    });

  return (
    <div>
      {!isAuthenticated ? (
        <button onClick={authenticate} disabled={loading}>
          Authenticate
        </button>
      ) : (
        <button onClick={logout}>Logout</button>
      )}
      {error && <p>Error: {error}</p>}
    </div>
  );
}
```

### Typed API Responses

All API responses are fully typed, providing better developer experience with autocompletion and type checking:

```typescript
async function getTrustScoreInfo(jwt: string) {
  try {
    const response: TrustScoreResponse = await sdk.getTrustScore(jwt);

    // TypeScript knows the shape of the response
    console.log(`Address: ${response.result.address}`);
    console.log(`Score: ${response.result.score}`);
    console.log(`Signature: ${response.result.signature}`);

    return response;
  } catch (error) {
    console.error("Error:", error);
  }
}
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

### 2. Obtaining JWT Token

Import the authentication hook from the SDK:

```tsx
import { useBackendAuth } from "@hapi/ton-sdk";

function YourComponent() {
  const { isAuthenticated, token } = useBackendAuth(); // This will handle the authentication flow

  // Use the token for API calls
  useEffect(() => {
    if (isAuthenticated && token) {
      // Now you can use the token for SDK calls
      sdk.getTrustScore(token).then((score) => {
        console.log("Trust score:", score);
      });
    }
  }, [isAuthenticated, token]);

  // ... rest of your component
}
```

### 3. Getting Trust Scores

Once you have the JWT token, get the trust score:

```typescript
try {
  const trustScoreResponse = await sdk.getTrustScore(jwt);
  console.log("Trust Score:", trustScoreResponse);
  // Example response:
  // {
  //     errorCode: 0,
  //     wallet: "EQAvUDmCAM9Zl_i3rXeYA2n-s_uhM4rTBhzAQUeJIxEOB62i",
  //     signature: "48656c6c6f20576f726c6421",
  //     trust: 85,
  //     expiration: 1718557123,
  //     isMinted: false
  // }
} catch (error) {
  console.error("Failed to get trust score:", error);
}
```

### 4. Calculate Transaction Fee

Before sending the transaction, calculate the required fee:

```typescript
// Calculate fees for new attestation (false) or update (true)
const fees = await sdk.calculateTransactionFee(false);

console.log("Transaction Fees:", {
  createFee: fees.createFee.toString(), // Base attestation fee from contract
  gasFee: fees.gasFee.toString(), // Gas fee (0.05 TON)
  commission: fees.commission.toString(), // Min commission (0.01 TON)
  storage: fees.storage.toString(), // Jetton storage fee (0.001 TON)
  total: fees.total.toString(), // Total fee required
});

// Update the transaction options with the calculated fee
createAttestationOpts.value = fees.total;
```

### 5. Prepare Attestation Transaction

Create an attestation transaction using the trust score data:

```typescript
const createAttestationOpts = {
  queryId: Date.now(), // Unique query ID
  trustScore: trustScoreResponse.trust, // Trust score from API
  expirationDate: trustScoreResponse.expiration, // Expiration timestamp
  signature: Buffer.from(trustScoreResponse.signature, "hex"),
  value: fees.total, // Total fee calculated earlier
};

// For new attestation
const transaction = sdk.prepareCreateAttestation(createAttestationOpts);

// Or for updating existing attestation
const updateTransaction = sdk.prepareUpdateAttestation(createAttestationOpts);
```

### 6. Send Transaction

Send the prepared transaction using a wallet provider:

```typescript
// Example using TON Connect
const provider = sdk
  .getContractAdapter()
  .open(Address.parse(sdk.config.contractAddress));
await sdk.sendCreateAttestation(
  provider,
  wallet, // Your TON Connect wallet instance
  createAttestationOpts
);
```

### 7. Track Attestation Result

After sending the transaction, track its status:

```typescript
const userAddress = wallet.account.address;
const result = await sdk.trackAttestationResult(
  userAddress,
  trustScoreResponse.trust
);

console.log("Attestation status:", result.status);
console.log("Attestation data:", result.data);
```

## Advanced Usage

### Checking Existing Attestations

```typescript
const attestationData = await sdk.getUserAttestationData(userAddress);
console.log("Jetton Address:", attestationData.jettonAddress.toString());
console.log(
  "Trust Score:",
  attestationData.attestationData.trustScore.toString()
);
console.log(
  "Expiration:",
  attestationData.attestationData.expirationDate.toString()
);
```

### Custom Contract Addresses

You can specify custom contract addresses for testnet or different deployments:

```typescript
const testnetSdk = new HapiSDK({
  referralId: 0,
  publicClient: "https://testnet.tonapi.io/v2",
  tonApiKey: "YOUR_API_KEY",
  endpoint: "https://testnet-api.hapi.one",
  contractAddress: "EQBiXrm6sM4V2SxDPDDuEr-qALlRl-utFx0g2gzaGIcS827a",
});
```

## Contract Addresses

- Testnet: `EQBiXrm6sM4V2SxDPDDuEr-qALlRl-utFx0g2gzaGIcS827a`
- Mainnet: `EQAvUDmCAM9Zl_i3rXeYA2n-s_uhM4rTBhzAQUeJIxEOB62i`

## Best Practices

1. **Error Handling**: Always implement proper error handling for all SDK operations.
2. **Transaction Values**: Ensure sufficient TON balance for transaction fees.
3. **JWT Management**: Securely store and manage JWT tokens.
4. **Polling Intervals**: The SDK implements automatic polling with reasonable intervals.
5. **TypeScript Usage**: Leverage TypeScript's type system for safer code.

## Support

For additional support and detailed integration guidance, please refer to:

- [HAPI Protocol Documentation](https://docs.hapi.one)
- [TON Documentation](https://ton.org/docs)
- [GitHub Repository](https://github.com/Solniechniy/hapi-sdk)
