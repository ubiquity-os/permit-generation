import { StaticDecode, Type as T } from "@sinclair/typebox";
import "dotenv/config";

import { StandardValidator } from "typebox-validators";

export const envSchema = T.Object({
  GITHUB_TOKEN: T.String(),
  SUPABASE_URL: T.String(),
  SUPABASE_KEY: T.String(),
  NFT_MINTER_PRIVATE_KEY: T.String(),
  NFT_CONTRACT_ADDRESS: T.String(),
  KERNEL_PUBLIC_KEY: T.String(),
});

export type Env = StaticDecode<typeof envSchema>;
export const envValidator = new StandardValidator(envSchema);
