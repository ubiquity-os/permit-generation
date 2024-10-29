import { Logs } from "@ubiquity-os/ubiquity-os-logger";
import { Context } from "../../types";
import { Payload } from "../generate-erc20-permit";

export async function getPayloadPermitDetails(contextOrPayload: Context | Payload, username: string) {
  let logger: Logs;
  let walletAddress: string | null | undefined;
  let issueNodeId: string;
  let evmNetworkId: number;
  let evmPrivateEncrypted: string;
  let userId: number;

  if ("issueNodeId" in contextOrPayload) {
    logger = contextOrPayload.logger;
    walletAddress = contextOrPayload.walletAddress;
    evmNetworkId = contextOrPayload.evmNetworkId;
    evmPrivateEncrypted = contextOrPayload.evmPrivateEncrypted;
    issueNodeId = contextOrPayload.issueNodeId;
    userId = contextOrPayload.userId;
  } else {
    const config = contextOrPayload.config;
    logger = contextOrPayload.logger;
    const { evmNetworkId: configEvmNetworkId, evmPrivateEncrypted: configEvmPrivateEncrypted } = config;
    const { data: userData } = await contextOrPayload.octokit.users.getByUsername({ username });
    if (!userData) {
      throw new Error(`GitHub user was not found for id ${username}`);
    }
    userId = userData.id;
    const { wallet } = contextOrPayload.adapters.supabase;
    walletAddress = await wallet.getWalletByUserId(userId);
    evmNetworkId = configEvmNetworkId;
    evmPrivateEncrypted = configEvmPrivateEncrypted;
    if ("issue" in contextOrPayload.payload) {
      issueNodeId = contextOrPayload.payload.issue.node_id;
    } else if ("pull_request" in contextOrPayload.payload) {
      issueNodeId = contextOrPayload.payload.pull_request.node_id;
    } else {
      throw new Error("Issue Id is missing");
    }
  }

  return { walletAddress, issueNodeId, evmNetworkId, evmPrivateEncrypted, userId, logger };
}
