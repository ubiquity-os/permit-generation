import manifest from "../manifest.json";
import { validateAndDecodeSchemas } from "./helpers/validator";
import { plugin } from "./plugin";
import { Env } from "./types";

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    try {
      const url = new URL(request.url);
      if (url.pathname === "/manifest") {
        if (request.method === "GET") {
          return new Response(JSON.stringify(manifest), {
            headers: { "content-type": "application/json" },
          });
        } else if (request.method === "POST") {
          const webhookPayload = await request.json();

          validateAndDecodeSchemas(env, webhookPayload.settings);
          return new Response(JSON.stringify({ message: "Schema is valid" }), { status: 200, headers: { "content-type": "application/json" } });
        }
      }
      if (request.method !== "POST") {
        return new Response(JSON.stringify({ error: `Only POST requests are supported.` }), {
          status: 405,
          headers: { "content-type": "application/json", Allow: "POST" },
        });
      }
      const contentType = request.headers.get("content-type");
      if (contentType !== "application/json") {
        return new Response(JSON.stringify({ error: `Error: ${contentType} is not a valid content type` }), {
          status: 400,
          headers: { "content-type": "application/json" },
        });
      }

      const webhookPayload = await request.json();
      const { decodedSettings, decodedEnv } = validateAndDecodeSchemas(env, webhookPayload.settings);

      webhookPayload.env = decodedEnv;
      webhookPayload.settings = decodedSettings;
      await plugin(webhookPayload, decodedEnv);
      return new Response(JSON.stringify("OK"), { status: 200, headers: { "content-type": "application/json" } });
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
