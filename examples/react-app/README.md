# HAPI TON SDK React TypeScript Example

This is a React TypeScript example application that demonstrates how to use the HAPI TON SDK in a React application with TON Connect integration.

## Features

- 🔌 TON Connect integration for wallet connection
- 🔍 Get trust scores with JWT tokens
- 📝 Create and prepare attestations
- 💸 Calculate transaction fees
- 🔎 Retrieve on-chain attestation data
- 🔧 Full TypeScript support with type definitions

## Getting Started

### Prerequisites

- Node.js (v16+)
- npm (v7+)
- A TON API key (get one from [TON API](https://tonapi.io/))

### Installation

1. Clone the repository:

```bash
git clone https://github.com/Solniechniy/hapi-sdk.git
cd hapi-sdk
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file in the `examples/react-app` directory:

```bash
cp examples/react-app/.env.example examples/react-app/.env
```

4. Edit the `.env` file to add your TON API key:

```
REACT_APP_TON_API_KEY=your_ton_api_key_here
```

5. Build the SDK:

```bash
npm run build
```

6. Start the React example:

```bash
cd examples/react-app
npm start
```

7. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### 1. Connect Your TON Wallet

Click the "Connect Wallet" button to connect your TON wallet using TON Connect.

### 2. Get Trust Score

Enter your JWT token and click "Get Trust Score" to retrieve your trust score from the HAPI Protocol.

### 3. Create Attestation

Fill in the attestation details and click "Calculate Fee" to get the transaction fee. Then click "Prepare Attestation" to prepare the attestation transaction.

### 4. Get Attestation Data

Enter a TON address (or use your connected wallet address) and click "Get Attestation Data" to retrieve attestation data from the blockchain.

## Project Structure

- `src/hooks/useHapiSDK.ts` - Custom hook that wraps the HAPI SDK for React
- `src/components/` - React components for the different SDK functions
- `src/App.tsx` - Main application component
- `src/types/` - TypeScript type definitions

## Implementation Details

### Custom Hook for SDK Integration

The `useHapiSDK` hook provides a convenient way to use the HAPI SDK in React:

```typescript
const {
  sdk, // The SDK instance
  loading, // Loading state
  error, // Error state
  result, // Result data
  getTrustScore, // Function to get trust score
  getUserAttestationData, // Function to get attestation data
  calculateFee, // Function to calculate transaction fee
  prepareAttestation, // Function to prepare attestation
  trackAttestationResult, // Function to track attestation result
  tonConnectUI, // TON Connect UI instance
  userAddress, // Connected wallet address
} = useHapiSDK({
  referralId: 0,
  endpoint: "https://api.hapi.one",
  contractAddress: "EQAvUDmCAM9Zl_i3rXeYA2n-s_uhM4rTBhzAQUeJIxEOB62i",
});
```

### TypeScript Type Definitions

The example includes comprehensive TypeScript type definitions for the HAPI SDK:

```typescript
interface AttestationOptions {
  queryId: number;
  trustScore: number;
  expirationDate: number;
  signature: Uint8Array;
  value: string;
}

interface FeeData {
  createFee: string;
  gasFee: string;
  commission: string;
  storage: string;
  total: string;
}
```

### TON Connect Integration

The example uses `@tonconnect/ui-react` for wallet connection:

```typescript
function App(): React.ReactElement {
  return (
    <TonConnectUIProvider manifestUrl={manifestUrl}>
      <AppContent />
    </TonConnectUIProvider>
  );
}
```

## Contributing

Feel free to submit issues or pull requests for improvements to this example.
