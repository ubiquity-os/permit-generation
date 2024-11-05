import { Octokit } from "@octokit/rest";
import { Context, Env, validateAndDecodeEnv } from "./types";
import { PluginInputs } from "./types/plugin-input";
import { createClient } from "@supabase/supabase-js";
import { Database, createAdapters } from "./adapters";
import { generatePayoutPermit } from "./handlers";
import { verifySignature } from "./helpers/signature";
import { validateAndDecodeWebhookPayload } from "./types/webhook-payload";

export default {
  async fetch(request: Request, env: Env) {
    try {
      const url = new URL(request.url);
      if (request.method !== "POST") {
        return new Response(JSON.stringify({ error: "Only 'POST' is allowed" }), {
          status: 400,
          headers: { "content-type": "application/json", Allow: "POST" },
        });
      }

      const contentType = request.headers.get("content-type");

      if (contentType !== "application/json") {
        return new Response(JSON.stringify({ error: "Unsupported content type" }), { status: 405, headers: { "content-type": "application/json" } });
      }

      if (url.pathname === "/generatePermit") {
        const webhookPayload = await request.json();
        const { isSuccessful, decodedWHPayload } = validateAndDecodeWebhookPayload(webhookPayload);
        const { decodedEnv } = validateAndDecodeEnv(env);

        if (!isSuccessful) {
          return new Response(JSON.stringify({ error: "Invalid request body" }), {
            status: 400,
            headers: { "content-type": "application/json" },
          });
        }

        const decodedInputs = atob(decodedWHPayload.inputs);
        const inputs: PluginInputs = JSON.parse(decodedInputs);

        const isAllowedRequest = await verifySignature(decodedEnv.KERNEL_PUBLIC_KEY, inputs, decodedWHPayload.signature);

        if (!isAllowedRequest) {
          return new Response(JSON.stringify({ error: "This request did not originate from a known source" }), {
            status: 401,
            headers: { "content-type": "application/json" },
          });
        }

        inputs.authToken = decodedEnv.GITHUB_TOKEN;
        const octokit = new Octokit({ auth: inputs.authToken });

        const supabaseClient = createClient<Database>(decodedEnv.SUPABASE_URL, decodedEnv.SUPABASE_KEY);
        const context: Context = {
          eventName: inputs.eventName,
          payload: inputs.eventPayload,
          config: inputs.settings,
          octokit,
          env: decodedEnv,
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
        const permits = await generatePayoutPermit(context, inputs.settings.permitRequests);
        return new Response(JSON.stringify(permits), { status: 200, headers: { "content-type": "application/json" } });
      }
    } catch (error) {
      return handleUncaughtError(error);
    }
  },
};

function handleUncaughtError(error: unknown) {
  console.error(error);
  const status = 500;
  return new Response(JSON.stringify({ error }), { status: status, headers: { "content-type": "application/json" } });
}
