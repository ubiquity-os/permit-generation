import { SupabaseClient } from "@supabase/supabase-js";
import { Context } from "../../../types/context";
import { Database } from "../types/database";

export class Super {
  protected supabase: SupabaseClient<Database>;
  protected context: Context;

  constructor(supabase: SupabaseClient<Database>, context: Context) {
    this.supabase = supabase;
    this.context = context;
  }
}
