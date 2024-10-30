import { Octokit } from "@octokit/rest";
import { Env, PluginInputs } from "./types";
import { Context } from "./types";
import { generatePayoutPermit } from "./handlers";
import { returnDataToKernel } from "./helpers/validator";
import { Logs } from "@ubiquity-os/ubiquity-os-logger";
import { createAdapters } from "./adapters";
import { createClient } from "@supabase/supabase-js";

export async function runPlugin(context: Context) {
  return await generatePayoutPermit(context, context.config.permitRequests);
}

export async function plugin(inputs: PluginInputs, env: Env) {
  const octokit = new Octokit({ auth: inputs.authToken });
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_KEY);

  const context: Context = {
    eventName: inputs.eventName,
    payload: inputs.eventPayload,
    config: inputs.settings,
    octokit,
    env,
    logger: new Logs("debug"),
    adapters: {} as ReturnType<typeof createAdapters>,
  };

  context.adapters = createAdapters(supabase, context);

  return returnDataToKernel(context, inputs.authToken, inputs.stateId, await runPlugin(context));
}
