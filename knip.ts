import type { KnipConfig } from "knip";

const config: KnipConfig = {
  entry: ["build/index.ts"],
  project: ["src/**/*.ts"],
  ignore: [],
  ignoreExportsUsedInFile: true,
  ignoreDependencies: ["ts-node"],
  jest: {
    config: ["jest.config.ts"],
    entry: ["tests/*.ts"],
  },
};

export default config;
