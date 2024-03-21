import { SupabaseClient } from "@supabase/supabase-js";
import { Context } from "../types/context";
import { User } from "./supabase/helpers/user";
import { Super } from "./supabase/helpers/supabase";
import { Database } from "./supabase/types/database";
import { Wallet } from "./supabase/helpers/wallet";

export function createAdapters(supabaseClient: SupabaseClient<Database>, context: Context) {
  return {
    supabase: {
      wallet: new Wallet(supabaseClient, context),
      user: new User(supabaseClient, context),
      super: new Super(supabaseClient, context),
    },
  };
}
