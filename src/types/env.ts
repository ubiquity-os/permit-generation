import { Type as T } from "@sinclair/typebox";
import { StaticDecode } from "@sinclair/typebox";
import { StandardValidator } from "typebox-validators";

export const envSchema = T.Object({
  GITHUB_TOKEN: T.String(),
  SUPABASE_URL: T.String(),
  SUPABASE_KEY: T.String(),
  NFT_MINTER_PRIVATE_KEY: T.Transform(T.Union([T.Undefined(), T.String()])).Decode((val) => {
    if (!val) {
      return "" // Being used correctly as a falsy value
    }
    return val
  }).Encode((val) => val),
  NFT_CONTRACT_ADDRESS: T.Transform(T.Union([T.Undefined(), T.String()])).Decode((val) => {
    if (!val) {
      return "" // Being used correctly as a falsy value
    }
    return val
  }).Encode((val) => val),
  X25519_PRIVATE_KEY: T.String(),
});

export const envValidator = new StandardValidator(envSchema);

export type Env = StaticDecode<typeof envSchema>;
