import { Env, validateAndDecodeEnv } from "./types";
import { PluginInputs } from "./types/plugin-input";
import { verifySignature } from "./helpers/signature";
import { validateAndDecodeWebhookPayload } from "./types/webhook-payload";
import { plugin } from "./plugin";

export default {
  async fetch(request: Request, env: Env) {
    try {
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

      const permits = await plugin(inputs, decodedEnv);

      return new Response(JSON.stringify(permits), { status: 200, headers: { "content-type": "application/json" } });
    } catch (error) {
      return handleUncaughtError(error);
    }
  },
};

function handleUncaughtError(error: unknown) {
  console.error(error);
  const err = error as Error;
  const status = 500;
  return new Response(JSON.stringify({ error: err.message }), { status: status, headers: { "content-type": "application/json" } });
}
