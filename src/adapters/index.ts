import { SupabaseClient } from "@supabase/supabase-js";
import { Context } from "../types/context";
import { Access } from "./supabase/helpers/access";
import { User } from "./supabase/helpers/user";
import { Label } from "./supabase/helpers/label";
import { Super } from "./supabase/helpers/supabase";

export function createAdapters(supabaseClient: SupabaseClient, context: Context) {
  return {
    supabase: {
      access: new Access(supabaseClient, context),
      user: new User(supabaseClient, context),
      label: new Label(supabaseClient, context),
      super: new Super(supabaseClient, context),
    },
  };
}
