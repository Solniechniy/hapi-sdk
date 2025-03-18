import { useState, useEffect } from "react";
import { HapiSDK } from "hapi-ton-sdk";
import { useTonConnectUI, useTonAddress } from "@tonconnect/ui-react";
import {
  SDKConfig,
  SDKResult,
  AttestationOptions,
  TrustScoreResponse,
  FeeData,
  AttestationData,
} from "../types";

interface HapiSDKHookReturn {
  sdk: HapiSDK | null;
  loading: boolean;
  error: string | null;
  result: SDKResult;
  getTrustScore: (jwt: string) => Promise<TrustScoreResponse | null>;
  getUserAttestationData: (address?: string) => Promise<AttestationData | null>;
  calculateFee: (isUpdate?: boolean) => Promise<FeeData | null>;
  prepareAttestation: (opts: AttestationOptions, isUpdate?: boolean) => any;
  trackAttestationResult: (
    address: string | undefined,
    trustScore: number,
    timeInterval?: number,
    maxRetries?: number
  ) => Promise<any>;
  tonConnectUI: any;
  userAddress: string | undefined;
}

export const useHapiSDK = ({
  referralId = 0,
  endpoint,
  contractAddress,
}: SDKConfig): HapiSDKHookReturn => {
  const [sdk, setSdk] = useState<HapiSDK | null>(null);
  const [tonConnectUI] = useTonConnectUI();
  const userAddress = useTonAddress();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TrustScoreResponse | null>(null);

  // Initialize the SDK
  useEffect(() => {
    try {
      const sdkInstance = new HapiSDK({
        referralId,
        tonApiKey: "",
      });
      console.log("SDK initialized successfully");
      setSdk(sdkInstance);
      console.log("SDK initialized successfully");
    } catch (error: any) {
      console.error("Error initializing SDK:", error);
      setError("Error initializing SDK: " + error.message);
    }
  }, [referralId, endpoint, contractAddress]);

  // Get trust score with JWT
  const getTrustScore = async (jwt: string) => {
    if (!sdk) {
      setError("SDK not initialized");
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const trustScoreResponse = await sdk.getTrustScore(jwt);
      console.log(trustScoreResponse);
    } catch (error: any) {
      console.error("Error getting trust score:", error);
      setError("Error getting trust score: " + error.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Get attestation data for user address
  const getUserAttestationData = async (
    address?: string
  ): Promise<AttestationData | null> => {
    if (!sdk) {
      setError("SDK not initialized");
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const attestationData = await sdk.getUserAttestationData(
        address || userAddress
      );
      setResult(attestationData);
      return attestationData;
    } catch (error: any) {
      console.error("Error getting attestation data:", error);
      setError("Error getting attestation data: " + error.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Calculate transaction fee
  const calculateFee = async (
    isUpdate: boolean = false
  ): Promise<FeeData | null> => {
    if (!sdk) {
      setError("SDK not initialized");
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const feeData = await sdk.calculateTransactionFee(isUpdate);
      setResult(feeData);
      return feeData;
    } catch (error: any) {
      console.error("Error calculating fee:", error);
      setError("Error calculating fee: " + error.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Prepare attestation transaction
  const prepareAttestation = (
    opts: AttestationOptions,
    isUpdate: boolean = false
  ) => {
    if (!sdk) {
      setError("SDK not initialized");
      return null;
    }

    try {
      const transaction = sdk.prepareAttestation(opts, isUpdate);
      setResult({ message: "Transaction prepared successfully", transaction });
      return transaction;
    } catch (error: any) {
      console.error("Error preparing attestation:", error);
      setError("Error preparing attestation: " + error.message);
      return null;
    }
  };

  // Track attestation result
  const trackAttestationResult = async (
    address: string | undefined,
    trustScore: number,
    timeInterval: number = 7000,
    maxRetries: number = 9
  ) => {
    if (!sdk) {
      setError("SDK not initialized");
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await sdk.trackAttestationResult(
        address || userAddress,
        trustScore,
        timeInterval,
        maxRetries
      );
      setResult(result);
      return result;
    } catch (error: any) {
      console.error("Error tracking attestation:", error);
      setError("Error tracking attestation: " + error.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    sdk,
    loading,
    error,
    result,
    getTrustScore,
    getUserAttestationData,
    calculateFee,
    prepareAttestation,
    trackAttestationResult,
    tonConnectUI,
    userAddress,
  };
};
