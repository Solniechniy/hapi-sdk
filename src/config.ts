interface Config {
  apiStaging: string;
  apiProduction: string;
  ton: Readonly<{
    score: string;
    nodeUrl: string;
    testnetNodeUrl: string;
  }>;
}

export const config: Readonly<Config> = {
  apiStaging: "https://hapi-one.stage.hapi.farm",
  apiProduction: "https://score-be.hapi.mobi",
  ton: {
    score: "EQBiXrm6sM4V2SxDPDDuEr-qALlRl-utFx0g2gzaGIcS827a",
    nodeUrl: "https://tonapi.io",
    testnetNodeUrl: "https://testnet.tonapi.io",
  },
};
