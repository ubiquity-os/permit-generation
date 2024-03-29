import Decimal from "decimal.js";
import { Context } from "../types/context";

export async function getWalletRecord(context: Context, senderID?: number, username?: string) {
  const { wallet } = context.adapters.supabase;
  let walletRecord = null;

  if (senderID) {
    walletRecord = await wallet.getWalletByUserId(senderID);
  }

  if (username) {
    walletRecord = await wallet.getWalletByUsername(username);
  }

  if (!walletRecord) {
    context.logger.error("No wallet found for user");
    return null;
  }

  return walletRecord;
}

export async function handleNoWalletFound(context: Context, issueNumber: number, userLogin: string) {
  const { logger, octokit } = context;
  const repository = context.payload.repository;

  logger.info("No wallet found for user");

  await octokit.issues.createComment({
    owner: repository.owner.login,
    repo: repository.name,
    issue_number: issueNumber,
    body: `${userLogin} you must register a wallet to receive your payout. Please register your wallet with \`/wallet <address>\` then tag your reviewer so they can re-run the workflow.`,
  });
}

export function getPriceFromLabels(labels: string[] | null): Decimal | null {
  if (!labels) return null;

  const payoutLabel = labels.find((label) => label.includes("Price:"));

  if (!payoutLabel) return null;

  return new Decimal(payoutLabel.replace("Price:", "").trim());
}

export async function getLabelsFromLinkedIssue(context: Context, pullRequestNumber: number): Promise<string[] | null> {
  const { octokit, logger } = context;
  const { owner, name } = context.payload.repository;
  const { data } = await octokit.issues.get({
    owner: context.payload.repository.owner.login,
    repo: name,
    issue_number: pullRequestNumber,
  });

  const body = data.body;

  if (!body) {
    logger.error("No body found for pull request");
    return null;
  }

  const linkedIssues = body.match(/#(\d+)|https?:\/\/github.com\/([^/]+)\/([^/]+)\/issues\/(\d+)/g);

  if (!linkedIssues) {
    logger.error("No linked issues found for pull request");
    return null;
  }

  const linkedIssue = linkedIssues[0];

  if (linkedIssue.includes("pull")) {
    logger.error("Linked issue is a pull request");
    return null;
  }

  const issueNumber = linkedIssue.match(/(\d+)/g);
  if (!issueNumber) {
    logger.error("No issue number found in linked issue");
    return null;
  }

  const { data: issue } = await octokit.issues.get({
    owner: owner.login,
    repo: name,
    issue_number: Number(issueNumber[0]),
  });

  const labels = issue.labels.map((label) => {
    if (typeof label === "object" && typeof label.name === "string" && label.name.includes("Price:")) {
      return label.name;
    } else {
      return null;
    }
  });

  return labels.filter((label) => label !== null) as string[];
}
