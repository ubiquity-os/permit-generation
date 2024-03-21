import { PermitTransactionData } from "../types/permits";
import { Context } from "../types/context";
import { generateErc20PermitSignature } from "./generate-erc20-permit";
import { generateErc721PermitSignature } from "./generate-erc721-permit";
import { getLabelsFromLinkedIssue, getPriceFromLabels, getWalletRecord, handleNoWalletFound, unpackInputs } from "../utils/helpers";

/**
 * Generates a payout permit based on the provided context.
 * @param context - The context object containing the configuration and payload.
 * @returns A Promise that resolves to the generated permit transaction data or an error message.
 */
export async function generatePayoutPermit(context: Context): Promise<PermitTransactionData | string> {
  const { isNftRewardEnabled } = context.config;
  const logger = context.logger;
  const eventName = context.eventName;

  if (eventName == "pull_request.closed") {
    const payload = context.payload as Context<"pull_request.closed">["payload"];
    return await generatePayoutForPullRequest(context, payload, isNftRewardEnabled);
  } else if (eventName == "workflow_dispatch") {
    return await generatePayoutForWorkflowDispatch(context, isNftRewardEnabled);
  } else {
    logger.error("Invalid payload");
    return "Permit not generated: invalid payload";
  }
}

/**
 * Generates a payout permit from a workflow dispatch.
 * @notice All inputs must be passed in from the previous plugin/kernel.
 */
async function generatePayoutForWorkflowDispatch(context: Context, isNftRewardEnabled: boolean): Promise<PermitTransactionData | string> {
  const inputs = unpackInputs(context);
  const logger = context.logger;

  let permit: PermitTransactionData | string;

  if (inputs.erc20) {
    if (!inputs.erc20.token || !inputs.erc20.amount || !inputs.erc20.spender || !inputs.erc20.networkId) {
      logger.error("No token, amount, spender, or networkId found for ERC20 permit");
      return "Permit not generated: no token, amount, spender, or networkId found for ERC20 permit";
    }

    permit = await generateErc20PermitSignature(context, inputs.erc20.spender, inputs.erc20.amount);
  } else if (inputs.erc721 && isNftRewardEnabled) {
    if (!inputs.erc721.username || !inputs.erc721.issueID || !inputs.erc721.contribution_type) {
      logger.error("No username or issueID found for ERC721 permit");
      return "Permit not generated: no username or issueID found for ERC721 permit";
    }

    permit = await generateErc721PermitSignature(context, inputs.erc721.issueID, inputs.erc721.contribution_type, inputs.erc721.username);
  } else {
    logger.error("No config found for permit generation");
    return "Permit not generated: no config found for permit generation";
  }

  if (typeof permit === "string") {
    logger.error(permit);
    return CHECK_LOGS_MESSAGE;
  } else {
    return permit;
  }
}

async function generatePayoutForPullRequest(
  context: Context,
  payload: Context<"pull_request.closed">["payload"],
  isNftRewardEnabled: boolean
): Promise<PermitTransactionData | string> {
  const issue = payload.pull_request;
  if (!issue.merged) {
    return "Permit not generated: PR not merged\n\n ###### If this was an error tag your reviewer to process a manual permit via /permit <wallet> <amount>)";
  }

  const spenderId = issue.user.id;
  const walletRecord = await getWalletRecord(context, spenderId, issue.user.login);

  if (!walletRecord) {
    await handleNoWalletFound(context, issue.number, issue.user.login);
    return "Permit not generated: no wallet found";
  } else {
    await generatePermit(context, walletRecord, isNftRewardEnabled, payload);
  }
  return CHECK_LOGS_MESSAGE;
}

async function generatePermit(
  context: Context,
  walletRecord: `0x${string}`,
  isNftRewardEnabled: boolean,
  payload: Context<"pull_request.closed">["payload"]
): Promise<PermitTransactionData | string> {
  const logger = context.logger;
  logger.info("Wallet found for user", { walletRecord });
  let permit: PermitTransactionData | string = "";

  const labels = await getLabelsFromLinkedIssue(context, payload.pull_request.number);
  const payoutAmount = getPriceFromLabels(labels);

  if (!payoutAmount) {
    logger.error("No payout amount found on issue");
    return "Permit not generated: no payout amount found on issue";
  }

  if (isNftRewardEnabled) {
    if (payoutAmount.toNumber() > 1) {
      permit = await generateErc20PermitSignature(context, walletRecord, payoutAmount.toNumber());
    } else {
      //   permit = await generateErc721PermitSignature(context, walletRecord, "pull_request", payload.pull_request.number);
    }
  } else {
    permit = await generateErc20PermitSignature(context, walletRecord, payoutAmount.toNumber());
  }

  if (typeof permit === "string") {
    logger.error(permit);
    return CHECK_LOGS_MESSAGE;
  }

  return permit;
}

const CHECK_LOGS_MESSAGE = "Permit not generated: check logs for more information";
