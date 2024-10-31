import { Database } from "../types/database";
import { SupabaseClient } from "@supabase/supabase-js";
import { Super } from "./supabase";
import { logger } from "../../../helpers/logger";

const FAILED_TO_GET_USER = "Failed to get user";
const SUCCESSFULLY_FETCHED_USER = "Successfully fetched user";

export class User extends Super {
  constructor(supabase: SupabaseClient<Database>) {
    super(supabase);
  }

  async getUserById(userId: number) {
    const { data, error } = await this.supabase.from("users").select("*").eq("id", userId).single();
    if (error) {
      logger.error(FAILED_TO_GET_USER, { userId, er: error });
      throw error;
    }

    logger.ok(SUCCESSFULLY_FETCHED_USER, { userId, ...data });
    return data;
  }

  async getUserIdByWallet(wallet: string) {
    const { data, error } = await this.supabase.from("wallets").select("id").eq("address", wallet).single();
    if (error) {
      logger.error(FAILED_TO_GET_USER, { wallet, er: error });
      throw error;
    }

    logger.ok(SUCCESSFULLY_FETCHED_USER, { wallet, userId: data?.id });
    return data?.id.toString();
  }

  async upsertUser(userId: number, username: string) {
    const { error } = await this.supabase.from("users").upsert({ id: userId, username }).select();
    if (error) {
      logger.error("Failed to upsert user", { userId, username, er: error });
      throw error;
    }

    logger.ok("Successfully upserted user", { userId, username });
  }

  async deleteUser(userId: number) {
    const { error } = await this.supabase.from("users").delete().eq("user_id", userId);
    if (error) {
      logger.error("Failed to delete user", { userId, er: error });
      throw error;
    }

    logger.ok("Successfully deleted user", { userId });
  }
}
