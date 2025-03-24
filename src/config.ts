interface Config {
  apiStaging: string;
  apiProduction: string;
  ton: Readonly<{
    score: string;
    nodeUrl: string;
  }>;
  tonTestnet: Readonly<{
    score: string;
    nodeUrl: string;
  }>;
}

export const config: Readonly<Config> = {
  apiStaging: "https://hapi-one.stage.hapi.farm",
  apiProduction: "https://score-be.hapi.mobi",
  ton: {
    score: "kQC60vGFCtYeQi-S0p6Lhfghd0vYS1YcTiHDWhEmuQ39QpCh",
    nodeUrl: "https://tonapi.io",
  },
  tonTestnet: {
    score: "kQC60vGFCtYeQi-S0p6Lhfghd0vYS1YcTiHDWhEmuQ39QpCh",
    nodeUrl: "https://testnet.tonapi.io",
  },
};
