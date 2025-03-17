# HAPI TON SDK Documentation

## Installation

```bash
npm install @hapi/ton-sdk
```

## Basic Setup

```typescript
import { HapiSDK } from "@hapi/ton-sdk";

const sdk = new HapiSDK({
  endpoint: "https://api.hapi.one", // HAPI API endpoint
  contractAddress: "EQAvUDmC...", // HAPI TON contract address
  tonApiKey: "<YOUR_TON_API_KEY>", // TON API key for blockchain interactions
  nodeUrl: "https://tonapi.io", // TON node URL
  referralId: "0", // Optional referral ID
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

### 2. Obtaining JWT Token

Create a hook to handle authentication and JWT token retrieval:

```tsx
import {
  useIsConnectionRestored,
  useTonAddress,
  useTonConnectUI,
  useTonWallet,
} from "@tonconnect/ui-react";
import { useEffect, useRef } from "react";

const localStorageKey = "hapi-app-auth-token";
const payloadTTLMS = 1000 * 60 * 20; // 20 minutes

export function useBackendAuth() {
  const isConnectionRestored = useIsConnectionRestored();
  const wallet = useTonWallet();
  const address = useTonAddress();
  const [tonConnectUI] = useTonConnectUI();
  const interval = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!isConnectionRestored) return;

    if (interval.current) {
      clearInterval(interval.current);
    }

    if (!wallet) {
      localStorage.removeItem(localStorageKey);

      // Get TON Proof payload from HAPI backend
      const refreshPayload = async () => {
        tonConnectUI.setConnectRequestParameters({ state: "loading" });
        const response = await fetch(
          "https://hapi-one.stage.hapi.farm/ref/v2/ton-payload",
          {
            method: "GET",
            headers: { "Content-Type": "application/json" },
          }
        );

        const data = await response.json();
        const value = { tonProof: data.payload };

        tonConnectUI.setConnectRequestParameters(
          value ? { state: "ready", value } : null
        );
      };

      refreshPayload();
      interval.current = setInterval(refreshPayload, payloadTTLMS);
      return;
    }

    // Check existing token
    const token = localStorage.getItem(localStorageKey);
    if (token) {
      try {
        const parsedToken = JSON.parse(atob(token.split(".")[1]));
        if (parsedToken.iat < Date.now() / 1000) {
          tonConnectUI.disconnect();
          return;
        }
        return;
      } catch (e) {
        return;
      }
    }

    // Get new JWT token
    if (
      wallet.connectItems?.tonProof &&
      !("error" in wallet.connectItems.tonProof)
    ) {
      try {
        fetch("https://hapi-one.stage.hapi.farm/ref/v2/ton-login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            proof: {
              ...wallet.connectItems.tonProof.proof,
              state_init: wallet.account.walletStateInit,
            },
            address: wallet.account.address,
            network: -239, // -239 for mainnet, -3 for testnet
          }),
        }).then(async (result) => {
          if (result) {
            const data = await result.json();
            localStorage.setItem(localStorageKey, data.jwt);
          } else {
            tonConnectUI.disconnect();
          }
        });
      } catch (e) {
        console.warn(e, "error with backend Auth");
      }
    } else {
      tonConnectUI.disconnect();
    }
  }, [wallet, tonConnectUI, isConnectionRestored, address]);
}
```

Use this hook in your component:

```tsx
import { useBackendAuth } from "hapi-sdk";

function YourComponent() {
  useBackendAuth(); // This will handle the authentication flow
  const jwt = localStorage.getItem("hapi-app-auth-token");
  // ... rest of your component
}
```

### 3. Get Trust Score Information

Once you have the JWT token, you can get the trust score:

```typescript
import { sdk } from "hapi-sdk";

try {
  const trustScoreResponse = await sdk.getTrustScore(jwt);
  console.log("Trust Score:", trustScoreResponse);
  // Example response:
  // {
  //     trustScore: 85,
  //     expirationDate: 1234567890,
  //     signature: Buffer.from('...'),
  // }
} catch (error) {
  console.error("Failed to get trust score:", error);
}
```

### 4. Calculate Transaction Fee

Before sending the transaction, calculate the total required fee:

```typescript
// Calculate fees for new attestation
const fee = await sdk.calculateTransactionFee(isUpdate); // false for new attestation, true for update

console.log("Transaction Fees:", {
  createFee: fees.createFee.toString(), // Base attestation fee from contract
  gasFee: fees.gasFee.toString(), // Gas fee (0.05 TON)
  commission: fees.commission.toString(), // Min commission (0.01 TON)
  storage: fees.storage.toString(), // Jetton storage fee (0.001 TON)
  total: fees.total.toString(), // Total fee required
});
```

The total transaction fee includes:

- Base attestation fee (retrieved from contract)
  - For new attestation: `getCreateAttestationFee`
  - For update: `getUpdateAttestationFee`
- Gas fee (0.05 TON)
- Minimum commission (0.01 TON)
- Jetton storage fee (0.001 TON)

Fee Constants:

```typescript
TON_DEFAULT_GAS = toNano("0.05"); // 0.05 TON
TON_MIN_COMMISSION = toNano("0.01"); // 0.01 TON
TON_MIN_JETTON_STORAGE = toNano("0.001"); // 0.001 TON
```

Make sure your wallet has sufficient balance to cover the total fee.

### 5. Prepare Attestation Transaction

Create an attestation transaction using the trust score data:

```typescript
const createAttestationOpts = {
  queryId: Date.now(), // Unique query ID
  trustScore: trustScoreResponse.trustScore,
  expirationDate: trustScoreResponse.expirationDate,
  signature: trustScoreResponse.signature,
  value: fee,
  referralId: BigInt("YOUR_REFERRAL_CODE"), // Referral ID
};

const transaction = sdk.prepareCreateAttestation(createAttestationOpts);
```

### 6. Send Transaction

Send the prepared transaction using a wallet provider:

```typescript
// Example using TON Wallet
const provider = sdk.contractAdapter.open(
  Address.parse(sdk.config.contractAddress)
);
await sdk.sendCreateAttestation(
  provider,
  walletContract, // Your wallet contract instance
  createAttestationOpts
);
```

### 7. Track Attestation Result

After sending the transaction, track its status:

```typescript
const userAddress = "EQAvUDmC..."; // User's TON address
const result = await sdk.trackAttestationResult(
  userAddress,
  trustScoreResponse.trustScore
);

// Example response:
// {
//     status: true/false,
//     data: {
//         trustScore: BigInt,
//         expirationDate: BigInt,
//         attestationAddress: Address,
//         commissionOwner: Address
//     }
// }
```

The `trackAttestationResult` method automatically handles waiting for the transaction. It:

- Polls every 7 seconds
- Makes up to 9 retry attempts
- Returns the attestation status and data
- Updates attestation count if successful

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

## Best Practices

1. **Error Handling**: Always implement proper error handling for all SDK operations.
2. **Transaction Values**: Ensure sufficient TON balance for transaction fees.
3. **JWT Management**: Securely store and manage JWT tokens.
4. **Polling Intervals**: The SDK implements automatic polling with reasonable intervals.

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
