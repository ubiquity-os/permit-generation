import type { KnipConfig } from "knip";

const config: KnipConfig = {
  entry: ["build/index.ts"],
  project: ["src/**/*.ts"],
  ignore: ["src/utils/config.ts", "src/utils/helpers.ts", "src/types/github.ts", "src/types/webhook-events.ts"],
  ignoreExportsUsedInFile: true,
  ignoreDependencies: [],
};

export default config;
