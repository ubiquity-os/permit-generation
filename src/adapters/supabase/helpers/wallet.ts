import { Database } from "../types/database";
import { SupabaseClient } from "@supabase/supabase-js";
import { Super } from "./supabase";
import { Context } from "../../../types/context";

export class Wallet extends Super {
  constructor(supabase: SupabaseClient<Database>, context: Context) {
    super(supabase, context);
  }

  async getWalletByUserId(userId: number) {
    const { data, error } = await this.supabase.from("wallets").select("address").eq("user_id", userId).single();
    if (error) {
      console.error("Failed to get wallet", { userId, error });
      throw error;
    }

    console.info("Successfully fetched wallet", { userId, address: data?.address });
    return data?.address as `0x${string}` | undefined;
  }

  async getWalletByUsername(username: string) {
    const { data, error } = await this.supabase.from("users").select("id").eq("username", username).single();
    if (error) {
      console.error("Failed to get user", { username, error });
      throw error;
    }

    const userId = data?.id;

    if (!userId) {
      console.error("Failed to get user", { username });
      throw new Error("User not found");
    }

    const { data: walletData, error: walletError } = await this.supabase.from("wallets").select("address").eq("user_id", userId).single();

    if (walletError) {
      console.error("Failed to get wallet", { userId, error });
      throw walletError;
    }

    console.info("Successfully fetched wallet", { userId, address: walletData?.address });

    return walletData?.address as `0x${string}` | undefined;
  }

  async upsertWallet(userId: number, address: string) {
    const { error } = await this.supabase.from("wallets").upsert([{ user_id: userId.toString(), address }]);
    if (error) {
      console.error("Failed to upsert wallet", { userId, address, error });
      throw error;
    }

    console.info("Successfully upserted wallet", { userId, address });
  }
}
