import "./buffer-polyfill";
import React, { useState, useEffect } from "react";
import { TonConnectUIProvider } from "@tonconnect/ui-react";
import "./App.css";

import { useHapiSDK } from "./hooks/useHapiSDK";
import TrustScoreForm from "./components/TrustScoreForm";
import AttestationForm from "./components/AttestationForm";
import AttestationDataForm from "./components/AttestationDataForm";
import ResultDisplay from "./components/ResultDisplay";

const manifestUrl = `${window.location.origin}/tonconnect-manifest.json`;

type TabType = "trustScore" | "attestation" | "data";

const AppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>("trustScore");
  const {
    loading,
    error,
    result,
    getTrustScore,
    getUserAttestationData,
    calculateFee,
    prepareAttestation,
    tonConnectUI,
    userAddress,
  } = useHapiSDK({ referralId: 0 });

  useEffect(() => {
    // Update the address field when user connects wallet
    if (userAddress) {
      console.log("Connected wallet address:", userAddress);
    }
  }, [userAddress]);

  const renderTabContent = () => {
    switch (activeTab) {
      case "trustScore":
        return (
          <TrustScoreForm
            getTrustScore={getTrustScore}
            loading={loading}
            error={error}
          />
        );
      case "attestation":
        return (
          <AttestationForm
            calculateFee={calculateFee}
            prepareAttestation={prepareAttestation}
            loading={loading}
            error={error}
          />
        );
      case "data":
        return (
          <AttestationDataForm
            getUserAttestationData={getUserAttestationData}
            userAddress={userAddress}
            loading={loading}
            error={error}
          />
        );
      default:
        return (
          <TrustScoreForm
            getTrustScore={getTrustScore}
            loading={loading}
            error={error}
          />
        );
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>HAPI TON SDK React Example</h1>
        <p>Interact with the HAPI Protocol on TON blockchain</p>
      </header>

      <div className="connection-container">
        {tonConnectUI && tonConnectUI.TonConnectButton && (
          <tonConnectUI.TonConnectButton />
        )}
      </div>

      <div className="tabs">
        <div
          className={`tab ${activeTab === "trustScore" ? "active" : ""}`}
          onClick={() => setActiveTab("trustScore")}
        >
          Trust Score
        </div>
        <div
          className={`tab ${activeTab === "attestation" ? "active" : ""}`}
          onClick={() => setActiveTab("attestation")}
        >
          Attestation
        </div>
        <div
          className={`tab ${activeTab === "data" ? "active" : ""}`}
          onClick={() => setActiveTab("data")}
        >
          Get Data
        </div>
      </div>

      {renderTabContent()}

      <ResultDisplay result={result} />

      <footer className="App-footer">
        <p>
          SDK Version: 0.0.2 |{" "}
          <a
            href="https://github.com/Solniechniy/hapi-sdk"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub Repository
          </a>
        </p>
      </footer>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <TonConnectUIProvider manifestUrl={manifestUrl}>
      <AppContent />
    </TonConnectUIProvider>
  );
};

export default App;
