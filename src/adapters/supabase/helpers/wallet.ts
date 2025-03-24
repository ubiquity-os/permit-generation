import { Database } from "../types/database";
import { SupabaseClient } from "@supabase/supabase-js";
import { Super } from "./supabase";
import { logger } from "../../../helpers/logger";

export class Wallet extends Super {
  constructor(supabase: SupabaseClient<Database>) {
    super(supabase);
  }

  async getWalletByUserId(userId: number) {
    const { data, error } = await this.supabase.from("users").select("wallets(*)").eq("id", userId).single();
    if (error) {
      throw logger.error("Failed to get wallet", { userId, er: error });
    }

    logger.ok("Successfully fetched wallet", { userId, address: data.wallets?.address });
    return data.wallets?.address;
  }

  async upsertWallet(userId: number, address: string) {
    const { error: walletError, data } = await this.supabase.from("wallets").upsert([{ address }]).select().single();

    if (walletError) {
      throw logger.error("Failed to upsert wallet", { userId, address, walletError });
    }

    const { error: userError } = await this.supabase.from("users").upsert([{ id: userId, wallet_id: data.id }]);

    if (userError) {
      throw logger.error("Failed to upsert user with new wallet", { userId, address, userError });
    }

    logger.ok("Successfully upsert wallet", { userId, address });
  }
}
