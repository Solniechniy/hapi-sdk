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
