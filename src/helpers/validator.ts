import { Octokit } from "@octokit/rest";
import { TransformDecodeCheckError, TransformDecodeError, Value, ValueError } from "@sinclair/typebox/value";
import { Context, Env, envSchema, envValidator, PermitGenerationSettings, permitGenerationSettingsSchema, permitRequestValidator } from "../types";

export async function returnDataToKernel(
  context: Context,
  repoToken: string,
  stateId: string,
  output: object,
  eventType = "return-data-to-ubiquity-os-kernel"
) {
  const octokit = new Octokit({ auth: repoToken });
  const {
    payload: {
      repository: {
        name: repo,
        owner: { login: owner },
      },
    },
  } = context;
  return octokit.repos.createDispatchEvent({
    owner,
    repo,
    event_type: eventType,
    client_payload: {
      state_id: stateId,
      output: JSON.stringify(output),
    },
  });
}

export function validateAndDecodeSchemas(rawEnv: object, rawSettings: object) {
  const errors: ValueError[] = [];

  const env = Value.Default(envSchema, rawEnv) as Env;

  if (!envValidator.test(env)) {
    for (const error of envValidator.errors(env)) {
      console.error(error);
      errors.push(error);
    }
  }

  const settings = Value.Default(permitGenerationSettingsSchema, rawSettings) as PermitGenerationSettings;

  if (!settings.evmPrivateEncrypted) {
    errors.push({
      message: "evmPrivateEncrypted is required",
      path: "/evmPrivateEncrypted",
      schema: permitGenerationSettingsSchema,
      type: 0,
      value: settings.evmPrivateEncrypted,
    });
  }

  const permits = settings.permitRequests;

  console.log("permits", permits);

  for (const permit of permits) {
    if (!permitRequestValidator.test(permit)) {
      for (const error of permitRequestValidator.errors(permit)) {
        console.error(error);
        errors.push(error);
      }
    }
  }

  if (errors.length) {
    throw { errors };
  }

  try {
    const decodedSettings = Value.Decode(permitGenerationSettingsSchema, settings);
    const decodedEnv = Value.Decode(envSchema, rawEnv || {});
    return { decodedEnv, decodedSettings };
  } catch (e) {
    console.error("validateAndDecodeSchemas", e);
    if (e instanceof TransformDecodeCheckError || e instanceof TransformDecodeError) {
      throw { errors: [e.error] };
    }
    throw e;
  }
}
