import { SupabaseClient } from "@supabase/supabase-js";
import { User } from "./supabase/helpers/user";
import { Super } from "./supabase/helpers/supabase";
import { Database } from "./supabase/types/database";
import { Wallet } from "./supabase/helpers/wallet";

export function createAdapters(supabaseClient: SupabaseClient<Database>) {
  return {
    supabase: {
      wallet: new Wallet(supabaseClient),
      user: new User(supabaseClient),
      super: new Super(supabaseClient),
    },
  };
}

export * from "./supabase/types/database";
