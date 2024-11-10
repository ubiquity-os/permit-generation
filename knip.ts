import type { KnipConfig } from "knip";

const config: KnipConfig = {
  entry: ["src/main.ts"],
  project: ["src/**/*.ts"],
  ignore: ["src/plugin.ts", "src/worker.ts", "src/helpers/signature.ts", "src/types/webhook-payload.ts"],
  ignoreBinaries: ["publish"],
  ignoreExportsUsedInFile: true,
  ignoreDependencies: ["ts-node", "supabase"],
  jest: {
    config: ["jest.config.ts"],
    entry: ["tests/*.ts"],
  },
};

export default config;
