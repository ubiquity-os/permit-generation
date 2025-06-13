import type { KnipConfig } from "knip";

const config: KnipConfig = {
  entry: ["build/index.ts", "src/worker.ts"],
  project: ["src/**/*.ts"],
  ignore: ["src/types/config.ts", "**/__mocks__/**", "**/__fixtures__/**", "src/plugin.ts"],
  ignoreExportsUsedInFile: true,
  // eslint can also be safely ignored as per the docs: https://knip.dev/guides/handling-issues#eslint--jest
  ignoreDependencies: ["@mswjs/data", "@typescript-eslint/eslint-plugin", "@typescript-eslint/parser", "ts-node", "node"],
  eslint: true,
  ignoreBinaries: ["publish", "tsx"],
};

export default config;
