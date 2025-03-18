import React, { useState, FormEvent } from "react";
import { TrustScoreResponse } from "../types";

interface TrustScoreFormProps {
  getTrustScore: (jwt: string) => Promise<TrustScoreResponse | null>;
  loading: boolean;
  error: string | null;
}

const TrustScoreForm: React.FC<TrustScoreFormProps> = ({
  getTrustScore,
  loading,
  error,
}) => {
  const [jwt, setJwt] = useState<string>("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!jwt) {
      alert("Please enter a JWT token");
      return;
    }

    await getTrustScore(jwt);
  };

  return (
    <div className="card">
      <h2>Get Trust Score</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="jwt">JWT Token:</label>
          <input
            type="text"
            id="jwt"
            value={jwt}
            onChange={(e) => setJwt(e.target.value)}
            placeholder="Enter your JWT token"
            disabled={loading}
          />
        </div>
        {error && <div className="error-message">{error}</div>}
        <button type="submit" disabled={loading || !jwt}>
          {loading ? "Loading..." : "Get Trust Score"}
        </button>
      </form>
    </div>
  );
};

export default TrustScoreForm;
