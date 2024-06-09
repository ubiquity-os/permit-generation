import { SupabaseClient } from "@supabase/supabase-js";
import { Super } from "./supabase";
import { Context } from "../../../types/context";

export class Access extends Super {
  constructor(supabase: SupabaseClient, context: Context) {
    super(supabase, context);
  }

  public async getAccess(userId: number, repositoryId: number) {
    const { data, error } = await this.supabase
      .from("access")
      .select("*")
      .filter("user_id", "eq", userId)
      .filter("repository_id", "eq", repositoryId)
      .limit(1)
      .maybeSingle();

    if (error) {
      this.context.logger.fatal(error.message, error);
      throw new Error(error.message);
    }
    return data;
  }

  public async setAccess(userId: number, repositoryId: number, labels: string[]) {
    if (!labels.length) {
      return this.clearAccess(userId, repositoryId);
    }
    const { data, error } = await this.supabase
      .from("access")
      .upsert({
        user_id: userId,
        repository_id: repositoryId,
        labels: labels,
      })
      .select()
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data;
  }

  public async clearAccess(userId: number, repositoryId: number): Promise<null> {
    const { data, error } = await this.supabase.from("access").delete().filter("user_id", "eq", userId).filter("repository_id", "eq", repositoryId);
    if (error) throw new Error(error.message);
    return data;
  }
}
