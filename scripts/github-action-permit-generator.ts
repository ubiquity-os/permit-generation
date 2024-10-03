import * as github from "@actions/github";
import { Octokit } from "@octokit/rest";
import { createClient } from "@supabase/supabase-js";
import { createAdapters } from "../src/adapters";
import { Database } from "../src/adapters/supabase/types/database";
import { generatePayoutPermit } from "../src/handlers";
import { Context } from "../src/types/context";
import { PermitGenerationSettings, PermitRequest } from "../src/types/plugin-input";
import { Value } from "@sinclair/typebox/value";
import { envGithubActionSchema } from "../src/types/env";

/**
 * Generates all the permits based on the current github workflow dispatch.
 */
export async function generatePermitsFromGithubWorkflowDispatch() {
  const runId = github.context.runId;
  const env = Value.Decode(envGithubActionSchema, process.env);

  const _userAmounts = env.USERS_AMOUNTS;
  console.log(`Recieved: ${_userAmounts}`);
  const userAmounts = JSON.parse(_userAmounts);

  // Populate the permitRequests from the user_amounts payload

  const permitRequests: PermitRequest[] = userAmounts.flatMap((userObj: { [key: string]: number }) =>
    Object.entries(userObj).map(([user, amount]) => ({
      type: "ERC20",
      username: user,
      amount: amount,
      contributionType: "custom",
      tokenAddress: env.EVM_TOKEN_ADDRESS,
    }))
  );

  const config: PermitGenerationSettings = {
    evmNetworkId: Number(env.EVM_NETWORK_ID),
    evmPrivateEncrypted: env.EVM_PRIVATE_KEY,
    permitRequests: permitRequests,
    runId: `${runId}`,
  };

  const octokit = new Octokit({ auth: env.GITHUB_TOKEN });
  const supabaseClient = createClient<Database>(env.SUPABASE_URL, env.SUPABASE_KEY);

  const context: Context = {
    eventName: "workflow_dispatch",
    config: config,
    octokit,
    payload: userAmounts,
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

  const permits = await generatePayoutPermit(context, config.permitRequests);
  await returnDataToKernel(env.GITHUB_TOKEN, "todo_state", permits);
  return JSON.stringify(permits);
}

async function returnDataToKernel(repoToken: string, stateId: string, output: object) {
  const octokit = new Octokit({ auth: repoToken });
  await octokit.repos.createDispatchEvent({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    event_type: "return_data_to_ubiquibot_kernel",
    client_payload: {
      state_id: stateId,
      output: JSON.stringify(output),
    },
  });
}
generatePermitsFromGithubWorkflowDispatch()
  .then((result) => console.log(`result: ${result}`))
  .catch((error) => {
    console.error(error);
  });
