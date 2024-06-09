import { SupabaseClient } from "@supabase/supabase-js";
import { Super } from "./supabase";
import { Context } from "../../../types/context";

type Wallet = {
  address: string;
};

export class User extends Super {
  user_id: string | undefined;
  comment_id: string | undefined;
  issue_id: string | undefined;
  repository_id: string | undefined;
  node_id: string | undefined;
  node_type: string | undefined;

  constructor(supabase: SupabaseClient, context: Context) {
    super(supabase, context);
  }

  async getUserById(userId: number, issueNumber: number) {
    const { data, error } = await this.supabase.from("users").select("*").eq("id", userId).single();
    if (error) {
      console.error(FAILED_TO_GET_USER, { userId, error, issueNumber });
      return null;
    }

    console.info(SUCCESSFULLY_FETCHED_USER, { userId, issueNumber, ...data });
    return data;
  }

  async getWalletByUserId(userId: number, issueNumber: number) {
    const { data, error }: { data: { wallets: Wallet } | null; error: unknown } = await this.supabase
      .from("users")
      .select("wallets(*)")
      .eq("id", userId)
      .single();
    if ((error && !data) || !data?.wallets?.address) {
      console.error("No wallet address found", { userId, issueNumber }, true);
      throw new Error("No wallet address found");
    }

    console.info("Successfully fetched wallet", { userId, address: data.wallets?.address });
    return data.wallets?.address;
  }

  public async getMultiplier(userId: number, repositoryId: number) {
    const locationData = await this.getLocationsFromRepo(repositoryId);
    if (locationData && locationData.length > 0) {
      const accessData = await this._getAccessData(locationData, userId);
      if (accessData) {
        return {
          value: accessData.multiplier || null,
          reason: accessData.multiplier_reason || null,
        };
      }
    }
    return null;
  }

  private async _getAccessData(locationData: { id: number }[], userId: number) {
    const locationIdsInCurrentRepository = locationData.map((location) => location.id);

    const { data: accessData, error: accessError } = await this.supabase
      .from("access")
      .select("multiplier, multiplier_reason")
      .in("location_id", locationIdsInCurrentRepository)
      .eq("user_id", userId)
      .order("id", { ascending: false }) // get the latest one
      .maybeSingle();
    if (accessError) throw console.error("Error getting access data", accessError);
    return accessData;
  }

  public async getLocationsFromRepo(repositoryId: number) {
    const { data: locationData, error } = await this.supabase.from("locations").select("id").eq("repository_id", repositoryId);

    if (error) throw console.error("Error getting location data", new Error(error.message));
    return locationData;
  }
}

const FAILED_TO_GET_USER = "Failed to get user";
const SUCCESSFULLY_FETCHED_USER = "Successfully fetched user";
