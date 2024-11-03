import { Octokit } from "@octokit/rest";
import { Env, PluginInputs } from "./types";
import { Context } from "./types";
import { returnDataToKernel } from "./helpers/validator";
import { createAdapters } from "./adapters";
import { createClient } from "@supabase/supabase-js";
import { generatePayoutPermits } from "./handlers";
import { logger } from "./helpers/logger";

export async function plugin(inputs: PluginInputs, env: Env) {
  const octokit = new Octokit({ auth: inputs.authToken });
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_KEY);

  const context: Context = {
    eventName: inputs.eventName,
    payload: inputs.eventPayload,
    config: inputs.settings,
    octokit,
    env,
    logger: logger,
    adapters: createAdapters(supabase),
  };

  const permits = await generatePayoutPermits(context);

  try {
    await returnDataToKernel(context, inputs.authToken, inputs.stateId, permits);
  } catch (error) {
    logger.error("Error returning data to kernel", error);
  }

  return permits;
}
