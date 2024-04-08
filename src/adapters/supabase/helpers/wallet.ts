import { Database } from "../types/database";
import { SupabaseClient } from "@supabase/supabase-js";
import { Super } from "./supabase";
import { Context } from "../../../types/context";

export class Wallet extends Super {
  constructor(supabase: SupabaseClient<Database>, context: Context) {
    super(supabase, context);
  }

  async getWalletByUserId(userId: number) {
    const { data, error } = await this.supabase.from("users").select("wallets(*)").eq("id", userId).single();
    if (error) {
      console.error("Failed to get wallet", { userId, error });
      throw error;
    }

    console.info("Successfully fetched wallet", { userId, address: data.wallets?.address });
    return data.wallets?.address;
  }

  async upsertWallet(userId: number, address: string) {
    // TODO: fix to link to user
    const { error } = await this.supabase.from("wallets").upsert([{ user_id: userId.toString(), address }]);
    if (error) {
      console.error("Failed to upsert wallet", { userId, address, error });
      throw error;
    }

    console.info("Successfully upsert wallet", { userId, address });
  }
}
