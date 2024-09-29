import { Type as T } from "@sinclair/typebox";
import { StaticDecode } from "@sinclair/typebox";
import "dotenv/config";

export const envSchema = T.Object({
  GITHUB_TOKEN: T.String(),
  SUPABASE_URL: T.String(),
  SUPABASE_KEY: T.String(),
  NFT_MINTER_PRIVATE_KEY: T.String(),
  NFT_CONTRACT_ADDRESS: T.String(),
});

export const envGithubActionSchema = T.Object({
  GITHUB_TOKEN: T.String(),
  SUPABASE_URL: T.String(),
  SUPABASE_KEY: T.String(),
  EVM_NETWORK_ID: T.String(),
  EVM_PRIVATE_KEY: T.String(),
  EVM_TOKEN_ADDRESS: T.String(),
});

export type Env = StaticDecode<typeof envSchema>;
export type EnvGA = StaticDecode<typeof envGithubActionSchema>;
