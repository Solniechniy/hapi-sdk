interface Config {
  apiURL: string;
  apiStaging: string;
  ton: Readonly<{
    score: string;
    nodeUrl: string;
  }>;
}

export const config: Readonly<Config> = {
  apiURL: "https://score-be.hapi.mobi",
  apiStaging: "https://hapi-one.stage.hapi.farm",
  ton: {
    score: "EQAvUDmCAM9Zl_i3rXeYA2n-s_uhM4rTBhzAQUeJIxEOB62i",
    nodeUrl: "https://tonapi.io",
  },
};
