import * as github from "@actions/github";
import { Octokit } from "@octokit/rest";
import { Value } from "@sinclair/typebox/value";
import { createClient } from "@supabase/supabase-js";
import { createAdapters } from "./adapters";
import { Database } from "./adapters/supabase/types/database";
import { generatePayoutPermit } from "./handlers";
import { registerWallet } from "./handlers/register-wallet";
import { Context } from "./types/context";
import { envSchema } from "./types/env";
import { permitGenerationSettingsSchema, PluginInputs } from "./types/plugin-input";

/**
 * Generates all the permits based on the currently populated context.
 */
export async function generatePermitsFromContext() {
  const webhookPayload = github.context.payload.inputs;

  const env = Value.Decode(envSchema, process.env);
  const settings = Value.Decode(permitGenerationSettingsSchema, JSON.parse(webhookPayload.settings));

  const inputs: PluginInputs = {
    stateId: webhookPayload.stateId,
    eventName: webhookPayload.eventName,
    eventPayload: JSON.parse(webhookPayload.eventPayload),
    settings: settings,
    authToken: webhookPayload.authToken,
    ref: webhookPayload.ref,
  };
  const octokit = new Octokit({ auth: inputs.authToken });
  const supabaseClient = createClient<Database>(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);

  const context: Context = {
    eventName: inputs.eventName,
    payload: inputs.eventPayload,
    config: inputs.settings,
    octokit,
    env,
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

  if (context.eventName === "issue_comment.created") {
    await handleSlashCommands(context, octokit);
  } else {
    // TODO: return permits to kernel
    return await generatePayoutPermit(context, settings.permitRequests);
  }

  return null;
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
  }
}
