import React from "react";
import { SDKResult } from "../types";

interface ResultDisplayProps {
  result: SDKResult;
}

const ResultDisplay: React.FC<ResultDisplayProps> = ({ result }) => {
  if (!result) {
    return null;
  }

  return (
    <div className="result-container">
      <h3>Result:</h3>
      <pre>{JSON.stringify(result, null, 2)}</pre>
    </div>
  );
};

export default ResultDisplay;
