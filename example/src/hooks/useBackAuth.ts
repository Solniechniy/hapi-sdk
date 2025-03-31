import {
  useIsConnectionRestored,
  useTonAddress,
  useTonConnectUI,
  useTonWallet,
} from "@tonconnect/ui-react";
import { HapiSDK } from "hapi-ton-sdk";
import { Dispatch, SetStateAction, useEffect, useRef } from "react";

export const localStorageKey = "hapi-app-auth-token";
const payloadTTLMS = 1000 * 60 * 20;

export function useBackendAuth(
  sdk: HapiSDK | null,
  setJwt: Dispatch<SetStateAction<string | null>>
) {
  const isConnectionRestored = useIsConnectionRestored();
  const wallet = useTonWallet();
  const address = useTonAddress();
  const [tonConnectUI] = useTonConnectUI();
  const interval = useRef<ReturnType<typeof setInterval> | undefined>(
    undefined
  );

  useEffect(() => {
    if (!isConnectionRestored || !sdk) {
      return;
    }
    clearInterval(interval.current);
    if (!wallet) {
      localStorage.removeItem(localStorageKey);
      setJwt(null);
      const refreshPayload = async () => {
        tonConnectUI.setConnectRequestParameters({ state: "loading" });
        const { payload } = await sdk.getMessage();
        const value = {
          tonProof: payload,
        };
        if (!value) {
          tonConnectUI.setConnectRequestParameters(null);
        } else {
          tonConnectUI.setConnectRequestParameters({ state: "ready", value });
        }
      };
      refreshPayload();
      setInterval(refreshPayload, payloadTTLMS);
      return;
    }
    const token = localStorage.getItem(localStorageKey);
    if (token) {
      try {
        const parsedToken = JSON.parse(atob(token.split(".")[1]));
        if (parsedToken.iat < Date.now() / 1000) {
          tonConnectUI.disconnect();
          return;
        } else {
          return;
        }
      } catch (e) {
        return;
      }
    }
    if (
      wallet.connectItems?.tonProof &&
      !("error" in wallet.connectItems.tonProof)
    ) {
      try {
        sdk
          .checkProof({
            proof: {
              ...wallet.connectItems.tonProof.proof,
              state_init: wallet.account.walletStateInit,
            },
            address: wallet.account.address,
            network: -3,
          })
          .then((result) => {
            if (result) {
              localStorage.setItem(localStorageKey, result.data.jwt);
              setJwt(result.data.jwt);
              console.log(result.data.jwt);
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
  }, [wallet, tonConnectUI, isConnectionRestored, address, sdk]);
}
