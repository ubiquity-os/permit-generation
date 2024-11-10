import { StaticDecode, Type as T } from "@sinclair/typebox";
import { Value } from "@sinclair/typebox/value";
import "dotenv/config";

export const envSchema = T.Object({
  GITHUB_TOKEN: T.String(),
  SUPABASE_URL: T.String(),
  SUPABASE_KEY: T.String(),
  NFT_MINTER_PRIVATE_KEY: T.String(),
  NFT_CONTRACT_ADDRESS: T.String(),
  KERNEL_PUBLIC_KEY: T.String(),
  X25519_PRIVATE_KEY: T.String(),
  X25519_NONCE: T.String(),
});

export type Env = StaticDecode<typeof envSchema>;

export function validateAndDecodeEnv(t: Env) {
  const isSuccessful = Value.Check(envSchema, t);
  const decodedEnv = Value.Decode(envSchema, t);
  return { isSuccessful, decodedEnv };
}
