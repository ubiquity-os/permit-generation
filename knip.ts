import type { KnipConfig } from "knip";

const config: KnipConfig = {
  entry: ["src/main.ts"],
  project: ["src/**/*.ts"],
  ignore: [],
  ignoreBinaries: ["publish", "src/adapters/supabase/types/database.ts"],
  ignoreExportsUsedInFile: true,
  ignoreDependencies: ["ts-node"],
  jest: {
    config: ["jest.config.ts"],
    entry: ["tests/*.ts"],
  },
};

export default config;
