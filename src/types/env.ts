import { Type as T } from "@sinclair/typebox";
import { StaticDecode } from "@sinclair/typebox";
import "dotenv/config";

// Define the environment schema with optional fields
export const envSchema = T.Object({
  GITHUB_TOKEN: T.String(),                       // Required
  SUPABASE_URL: T.String(),                       // Required
  SUPABASE_KEY: T.String(),                       // Required
  NFT_MINTER_PRIVATE_KEY: T.Optional(T.String()), // Optional field
  NFT_CONTRACT_ADDRESS: T.Optional(T.String()),    // Optional field
});

// Create a type for static decoding of the schema
export type Env = StaticDecode<typeof envSchema>;
