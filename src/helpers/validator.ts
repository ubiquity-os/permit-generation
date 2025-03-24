import { TransformDecodeCheckError, TransformDecodeError, Value, ValueError } from "@sinclair/typebox/value";
import { Env, envSchema, envValidator, PermitGenerationSettings, permitGenerationSettingsSchema, permitRequestValidator } from "../types";

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

  for (const permit of permits) {
    if (!permitRequestValidator.test(permit)) {
      for (const error of permitRequestValidator.errors(permit)) {
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
    if (e instanceof TransformDecodeCheckError || e instanceof TransformDecodeError) {
      throw { errors: [e.error] };
    }
    throw e;
  }
}
