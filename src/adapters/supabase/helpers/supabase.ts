import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "../types/database";

export class Super {
  protected supabase: SupabaseClient<Database>;

  constructor(supabase: SupabaseClient<Database>) {
    this.supabase = supabase;
  }
}
