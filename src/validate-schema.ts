import * as core from "@actions/core";
import * as github from "@actions/github";
import { returnDataToKernel, validateAndDecodeSchemas } from "./helpers/validator";

async function main() {
  const payload = github.context.payload.inputs;

  payload.env = { ...(payload.env || {}), workflowName: github.context.workflow };
  validateAndDecodeSchemas(payload.env, JSON.parse(payload.settings));
  return { errors: [], payload };
}

main()
  .then((payload) => {
    console.log("Configuration validated.");
    return payload;
  })
  .catch((errors) => {
    console.error("Failed to validate configuration", errors);
    core.setFailed(errors);
    return errors;
  })
  .then(async (errors) => {
    const payload = github.context.payload.inputs;
    await returnDataToKernel(process.env.GITHUB_TOKEN, payload.stateId, errors, "configuration_validation");
  })
  .catch((e) => {
    console.error("Failed to return the data to the kernel.", e);
  });
