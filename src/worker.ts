import manifest from "../manifest.json";
import { validateAndDecodeSchemas } from "./helpers/validator";
import { plugin } from "./plugin";
import { Env } from "./types";

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    try {
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

      if (url.pathname === "/generate") {
        // TODO: Need a minimal interface compatible with anywhere that needs this.
      } else {
        // handle kernel payloads as normal
        // TODO: Build backwards and forwards compatibility for this.
        // i.e, any plugin can pass in the schema and have a permit generated
        // a nice approach would be to record the stateId in this worker' KV and then
        // tally the rewards through that chain of plugins. Either each call into an
        // endpoint or they pass the outputs back to the kernel and it either
        // forwards to the next plugin or sends straight to this.
        // every plugin outputting {[username]: {stateId, reward}} - includes negative, easy.
        const webhookPayload = await request.json();
        const { decodedSettings, decodedEnv } = validateAndDecodeSchemas(env, webhookPayload.settings);

        webhookPayload.env = decodedEnv;
        webhookPayload.settings = decodedSettings;
        await plugin(webhookPayload, decodedEnv);
        return new Response(JSON.stringify("OK"), { status: 200, headers: { "content-type": "application/json" } });
      }
    } catch (error) {
      return handleUncaughtError(error);
    }

    return new Response(JSON.stringify({ error: `Error: ${url.pathname} is not a valid path` }), {
      status: 404,
      headers: { "content-type": "application/json" },
    });
  },
};

function handleUncaughtError(error: unknown) {
  console.error(error);
  const status = 500;
  return new Response(JSON.stringify({ error }), { status: status, headers: { "content-type": "application/json" } });
}
