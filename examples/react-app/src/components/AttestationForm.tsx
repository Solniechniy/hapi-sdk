import React, { useState, FormEvent } from "react";
import { FeeData, AttestationOptions } from "../types";

interface AttestationFormProps {
  calculateFee: (isUpdate?: boolean) => Promise<FeeData | null>;
  prepareAttestation: (opts: AttestationOptions, isUpdate?: boolean) => any;
  loading: boolean;
  error: string | null;
}

const AttestationForm: React.FC<AttestationFormProps> = ({
  calculateFee,
  prepareAttestation,
  loading,
  error,
}) => {
  const [trustScore, setTrustScore] = useState<number>(85);
  const [expirationHours, setExpirationHours] = useState<number>(24);
  const [signatureText, setSignatureText] = useState<string>("");
  const [fees, setFees] = useState<FeeData | null>(null);

  const handleCalculateFee = async () => {
    const feeData = await calculateFee(false);
    setFees(feeData);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!fees) {
      alert("Please calculate fees first");
      return;
    }

    if (!signatureText) {
      alert("Please enter a signature");
      return;
    }

    const opts: AttestationOptions = {
      queryId: Date.now(),
      trustScore: parseInt(trustScore.toString()),
      expirationDate:
        Math.floor(Date.now() / 1000) +
        parseInt(expirationHours.toString()) * 3600,
      signature: Buffer.from(signatureText, "utf-8"),
      value: fees.total,
    };

    prepareAttestation(opts, false);
  };

  return (
    <div className="card">
      <h2>Create Attestation</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="trustScore">Trust Score:</label>
          <input
            type="number"
            id="trustScore"
            value={trustScore}
            onChange={(e) => setTrustScore(Number(e.target.value))}
            min="0"
            max="100"
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="expirationHours">Expiration (hours from now):</label>
          <input
            type="number"
            id="expirationHours"
            value={expirationHours}
            onChange={(e) => setExpirationHours(Number(e.target.value))}
            min="1"
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="signature">Signature:</label>
          <input
            type="text"
            id="signature"
            value={signatureText}
            onChange={(e) => setSignatureText(e.target.value)}
            placeholder="Enter signature from trust score response"
            disabled={loading}
          />
        </div>

        {fees && (
          <div className="fee-info">
            <h3>Fee Information:</h3>
            <p>Base Fee: {fees.createFee.toString()}</p>
            <p>Gas Fee: {fees.gasFee.toString()}</p>
            <p>Commission: {fees.commission.toString()}</p>
            <p>Storage: {fees.storage.toString()}</p>
            <p>
              <strong>Total: {fees.total.toString()}</strong>
            </p>
          </div>
        )}

        {error && <div className="error-message">{error}</div>}

        <div className="button-group">
          <button type="button" onClick={handleCalculateFee} disabled={loading}>
            Calculate Fee
          </button>
          <button type="submit" disabled={loading || !fees || !signatureText}>
            {loading ? "Loading..." : "Prepare Attestation"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AttestationForm;
