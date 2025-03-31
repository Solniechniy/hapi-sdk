import { useState } from "react";
import { TonApiClient } from "@ton-api/client";
import { ContractAdapter } from "@ton-api/ton-adapter";
import { Buffer } from "buffer";
import {
  config,
  HapiSDK,
  HapiTonAttestation,
  UserTonJetton,
} from "hapi-ton-sdk";
import "./App.css";
import {
  TonConnectButton,
  TonConnectUI,
  TonConnectUIProvider,
  useTonWallet,
  useTonConnectUI,
} from "@tonconnect/ui-react";
import { localStorageKey, useBackendAuth } from "./hooks/useBackAuth";
import { Sender, SenderArguments, Cell } from "@ton/core";

const createTonSender = (
  tonClient: TonConnectUI,
  getMessageHash: (hash: string) => void
): Sender => {
  return {
    send: async (args: SenderArguments) => {
      try {
        const result = await tonClient.sendTransaction({
          messages: [
            {
              address: args.to.toString(),
              amount: args.value.toString(),
              payload: args.body?.toBoc().toString("base64"),
            },
          ],
          validUntil: Date.now() + 5 * 60 * 1000,
        });

        const hash = Cell.fromBase64(result.boc).hash().toString("hex");
        getMessageHash(hash);
      } catch (e) {
        console.error(e);
      }
    },
  };
};

const API_KEY = "YOUR_TON_API_KEY";

function App() {
  const [trustScore, setTrustScore] = useState(0);
  const wallet = useTonWallet();
  const [jwt, setJwt] = useState<string | null>(
    localStorage.getItem(localStorageKey)
  );

  const publicClient = new TonApiClient({
    baseUrl: config.tonTestnet.nodeUrl,
    baseApiParams: {
      headers: {
        Authorization: `Bearer ${API_KEY}`,
      },
    },
  });

  const contractAdapter = new ContractAdapter(publicClient);

  const [tonConnectUI] = useTonConnectUI();

  const hapiSDK = new HapiSDK({
    referralId: 0, // "YOUR_REFERRAL_ID"
    staging: false,
    testnet: true,
    tonApiKey: API_KEY,
  });

  useBackendAuth(hapiSDK, setJwt); // This hook is used to get the JWT token from the backend

  const getOnchainTrustScore = async () => {
    if (!wallet?.account.address) return;

    const userJettonAddress = HapiTonAttestation.getStaticUserJettonAddress(
      wallet?.account.address
    );

    const jettonContract = UserTonJetton.createFromAddress(
      userJettonAddress,
      contractAdapter
    );

    const onchainUserScore = await jettonContract.getAttestationData();
    console.log("onchainUserScore", onchainUserScore);
  };

  const getOffchainTrustScore = async (jwt: string) => {
    const user = await hapiSDK.getUser(jwt);
    return user.scores;
  };

  const createAttestation = async (jwt: string) => {
    if (!wallet?.account.address) return;

    const hapiContract = HapiTonAttestation.createFromAddress(
      config.tonTestnet.score,
      contractAdapter
    );
    const localTrustScore = await hapiSDK.getTrustScore(
      wallet?.account.address,
      -3,
      jwt
    );

    console.log(localTrustScore);

    const fee = await hapiSDK.calculateTransactionFee(
      localTrustScore.isRemint ?? false,
      contractAdapter
    );
    let messageHash = "";

    const sender = createTonSender(tonConnectUI, (hash: string) => {
      messageHash = hash;
    });

    const signatureBuffer = Buffer.from(localTrustScore.signature, "hex");

    await hapiContract.sendCreateAttestation(sender, {
      queryId: 0,
      value: fee,
      trustScore: localTrustScore.score,
      expirationDate: localTrustScore.expiration,
      signature: signatureBuffer,
      referralId: 0n,
    });

    const result = await hapiSDK.trackAttestationResult(messageHash);
    return result;
  };

  return (
    <>
      <TonConnectButton />
      <div>
        <p>User attestation</p>
        <button onClick={() => createAttestation(jwt ?? "")}>
          Create attestation
        </button>
        <div>
          <p>Trust score: {trustScore}</p>
        </div>
      </div>
    </>
  );
}

const ProviderWrapper = () => {
  return (
    <TonConnectUIProvider manifestUrl="https://hapi-app.vercel.app/tonconnect-manifest.json">
      <App />
    </TonConnectUIProvider>
  );
};

export default ProviderWrapper;
