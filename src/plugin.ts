import { Octokit } from "@octokit/rest";
import { Context, Env } from "./types";
import { PluginInputs } from "./types/plugin-input";
import { createClient } from "@supabase/supabase-js";
import { Database, createAdapters } from "./adapters";
import { generatePayoutPermit } from "./handlers";

export async function plugin(inputs: PluginInputs, env: Env) {
  const octokit = new Octokit({ auth: inputs.authToken });

  const supabaseClient = createClient<Database>(env.SUPABASE_URL, env.SUPABASE_KEY);
  const logger = {
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
  };

  const context: Context = {
    eventName: inputs.eventName,
    payload: inputs.eventPayload,
    config: inputs.settings,
    octokit,
    env,
    logger,
    adapters: {} as ReturnType<typeof createAdapters>,
  };

  context.adapters = createAdapters(supabaseClient, context);
  return await generatePayoutPermit(context, inputs.settings.permitRequests);
}
