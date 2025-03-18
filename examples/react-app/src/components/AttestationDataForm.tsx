import React, { useState, FormEvent } from "react";
import { AttestationData } from "../types";

interface AttestationDataFormProps {
  getUserAttestationData: (address?: string) => Promise<AttestationData | null>;
  userAddress: string | undefined;
  loading: boolean;
  error: string | null;
}

const AttestationDataForm: React.FC<AttestationDataFormProps> = ({
  getUserAttestationData,
  userAddress,
  loading,
  error,
}) => {
  const [address, setAddress] = useState<string>(userAddress || "");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!address) {
      alert("Please enter an address");
      return;
    }

    await getUserAttestationData(address);
  };

  return (
    <div className="card">
      <h2>Get Attestation Data</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="address">TON Address:</label>
          <input
            type="text"
            id="address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Enter TON address"
            disabled={loading}
          />
        </div>
        <p className="info-text">
          {userAddress
            ? "Your connected wallet address is pre-filled."
            : "Connect your wallet to automatically fill your address."}
        </p>
        {error && <div className="error-message">{error}</div>}
        <button type="submit" disabled={loading || !address}>
          {loading ? "Loading..." : "Get Attestation Data"}
        </button>
      </form>
    </div>
  );
};

export default AttestationDataForm;
