import * as core from "@actions/core";
import * as github from "@actions/github";
import { Octokit } from "@octokit/rest";
import { PluginInputs } from "./types/plugin-input";
import { Context } from "./types/context";
import { generateErc20PermitSignature } from "./handlers/generate-erc20-permit";
import { createClient } from "@supabase/supabase-js";
import { createAdapters } from "./adapters";
import { Database } from "./adapters/supabase/types/database";
import { registerWallet } from "./handlers/register-wallet";
import { generatePayoutPermit } from "./handlers/generate-payout-permit";
import { generateErc721PermitSignature } from "./handlers/generate-erc721-permit";
import { PermitTransactionData } from "./types/permits";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

async function run() {
  const webhookPayload = github.context.payload.inputs;
  const inputs: PluginInputs = {
    stateId: webhookPayload.stateId,
    eventName: webhookPayload.eventName,
    eventPayload: JSON.parse(webhookPayload.eventPayload),
    settings: JSON.parse(webhookPayload.settings),
    authToken: webhookPayload.authToken,
    ref: webhookPayload.ref,
  };
  const octokit = new Octokit({ auth: inputs.authToken });

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error("SUPABASE_URL and SUPABASE_KEY must be provided");
  }

  const supabaseClient = createClient<Database>(SUPABASE_URL, SUPABASE_KEY);

  const context: Context = {
    eventName: inputs.eventName,
    payload: inputs.eventPayload,
    config: inputs.settings,
    octokit,
    logger: {
      debug(message: unknown, ...optionalParams: unknown[]) {
        console.debug(message, ...optionalParams);
      },
      info(message: unknown, ...optionalParams: unknown[]) {
        console.log(message, ...optionalParams);
      },
      warn(message: unknown, ...optionalParams: unknown[]) {
        console.warn(message, ...optionalParams);
      },
      error(message: unknown, ...optionalParams: unknown[]) {
        console.error(message, ...optionalParams);
      },
      fatal(message: unknown, ...optionalParams: unknown[]) {
        console.error(message, ...optionalParams);
      },
    },
    adapters: {} as ReturnType<typeof createAdapters>,
  };

  context.adapters = createAdapters(supabaseClient, context);

  if (context.eventName === "workflow_dispatch" || context.eventName === "pull_request.closed") {
    const permit = await generatePayoutPermit(context);

    if (permit) {
      return JSON.stringify(permit);
    } else {
      return "No permit generated";
    }
  } else if (context.eventName === "issue_comment.created") {
    await handleSlashCommands(context, octokit);
  } else {
    context.logger.error(`Unsupported event: ${context.eventName}`);
  }

  return "No permit generated";
}

async function handleSlashCommands(context: Context, octokit: Octokit) {
  const payload = context.payload as Context<"issue_comment.created">["payload"];
  const body = payload.comment.body;

  const registrationRegex = /\/wallet (0x[a-fA-F0-9]{40})/g;
  const matches = body.match(registrationRegex);

  if (matches) {
    const address = matches[0];
    // try registering wallet, if it fails, notify the user
    if (!(await registerWallet(context, address))) {
      await octokit.issues.createComment({
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        issue_number: payload.issue.number,
        body: `Failed to register wallet: ${address}`,
      });
    }
  } else {
    await handlePermitSlashCommand(context, payload);
  }
}

async function handlePermitSlashCommand(context: Context, payload: Context<"issue_comment.created">["payload"]) {
  const body = payload.comment.body;

  // `/permit <wallet addr> <amount>` || `/permit <nft address> <username>`
  const permitSlashCommand = /^\/permit\\s+((0x[a-fA-F0-9]{40})|([a-zA-Z0-9]{4,})|([a-zA-Z0-9]{3,}\\.eth))\\s+([a-zA-Z0-9]+|\\d+)$/g;

  const permitMatches = [...body.matchAll(permitSlashCommand)];
  let permit: PermitTransactionData | string | null = null;

  if (permitMatches.length > 0) {
    const walletOrNftAddress = permitMatches[0][1] as `0x${string}`;
    const tokenAmountOrUsername = permitMatches[0][5];

    if (tokenAmountOrUsername === undefined || tokenAmountOrUsername === "") {
      context.logger.error("tokenOrAmount is undefined or empty");
    } else {
      const parsedNumber = parseFloat(tokenAmountOrUsername);
      if (!isNaN(parsedNumber) && parsedNumber.toString() === tokenAmountOrUsername) {
        permit = await generateErc20PermitSignature(context, walletOrNftAddress, parsedNumber);
      } else {
        const contributionType = "pull_request"; // TODO: must be a better way to determine this, probably with inputs
        permit = await generateErc721PermitSignature(context, payload.issue.number, contributionType, tokenAmountOrUsername);
      }
    }
  } else {
    context.logger.error("No matches found for permit command");
  }

  if (typeof permit === "string" || permit === null) {
    throw new Error(permit || "Permit not generated");
  }

  return permit;
}

run()
  .then((result) => {
    core.setOutput("result", result);
  })
  .catch((error) => {
    console.error(error);
    core.setFailed(error);
  });
