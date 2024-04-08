import type { KnipConfig } from "knip";

const config: KnipConfig = {
  entry: ["build/index.ts"],
  project: ["src/**/*.ts"],
  ignore: ["src/types/config.ts", "src/adapters/supabase/types/database.ts"],
  ignoreExportsUsedInFile: true,
  ignoreDependencies: [],
};

export default config;
