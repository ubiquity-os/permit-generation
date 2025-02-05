import type { KnipConfig } from "knip";

const config: KnipConfig = {
  entry: ["build/index.ts"],
  project: ["src/**/*.ts"],
  ignore: ["src/types/config.ts", "**/__mocks__/**", "**/__fixtures__/**", "src/plugin.ts", "src/worker.ts", "src/helpers/validator.ts"],
  ignoreExportsUsedInFile: true,
  // eslint can also be safely ignored as per the docs: https://knip.dev/guides/handling-issues#eslint--jest
  ignoreDependencies: ["@mswjs/data", "@typescript-eslint/eslint-plugin", "@typescript-eslint/parser", "ts-node", "tsx", "node"],
  eslint: true,
  ignoreBinaries: ["publish"],
};

export default config;
