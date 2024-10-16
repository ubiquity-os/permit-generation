import * as github from "@actions/github";
import { Octokit } from "@octokit/rest";
import { createClient } from "@supabase/supabase-js";
import { createAdapters } from "../src/adapters";
import { Database } from "../src/adapters/supabase/types/database";
import { generatePayoutPermit } from "../src/handlers";
import { Context } from "../src/types/context";
import { PermitGenerationSettings, PermitRequest } from "../src/types/plugin-input";
import * as fs from "fs";

function getEnvVar(key: string) {
  return (
    process.env[key] ||
    (() => {
      throw new Error(`Environment variable ${key} is required`);
    })()
  );
}
/**
 * Generates all the permits based on the current github workflow dispatch.
 */
export async function generatePermitsFromGithubWorkflowDispatch() {
  const EVM_NETWORK_ID = getEnvVar("EVM_NETWORK_ID");
  const EVM_PRIVATE_KEY = getEnvVar("EVM_PRIVATE_KEY");
  const EVM_TOKEN_ADDRESS = getEnvVar("EVM_TOKEN_ADDRESS");
  const PAYMENT_REQUESTS = getEnvVar("PAYMENT_REQUESTS");
  const GITHUB_TOKEN = getEnvVar("GITHUB_TOKEN");
  const SUPABASE_URL = getEnvVar("SUPABASE_URL");
  const SUPABASE_KEY = getEnvVar("SUPABASE_KEY");

  console.log(`Received: ${PAYMENT_REQUESTS}`);
  const userAmounts = JSON.parse(PAYMENT_REQUESTS);

  // Populate the permitRequests from the user_amounts payload

  const permitRequests: PermitRequest[] = userAmounts.flatMap((userObj: { [key: string]: number }) =>
    Object.entries(userObj).map(([user, amount]) => ({
      type: "ERC20",
      username: user,
      amount: amount,
      tokenAddress: EVM_TOKEN_ADDRESS,
    }))
  );

  const config: PermitGenerationSettings = {
    evmNetworkId: Number(EVM_NETWORK_ID),
    evmPrivateEncrypted: EVM_PRIVATE_KEY,
    permitRequests: permitRequests,
  };

  const octokit = new Octokit({ auth: GITHUB_TOKEN });
  const supabaseClient = createClient<Database>(SUPABASE_URL, SUPABASE_KEY);

  const context: Context = {
    eventName: "workflow_dispatch",
    config: config,
    octokit,
    payload: userAmounts,
    env: undefined,
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
  await returnDataToKernel(GITHUB_TOKEN, "todo_state", permits);
  const out = Buffer.from(JSON.stringify(permits)).toString("base64");
  fs.writeFile(process.argv[2], out, (err) => {
    if (err) {
      throw err;
    }
  });
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
