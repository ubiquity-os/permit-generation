import manifest from "../manifest.json";
import { validateAndDecodeSchemas } from "./helpers/validator";
import { plugin } from "./plugin";
import { Env } from "./types";

/**
 * Cloudflare workers run on edge servers so this is not supported in the worker runtime,
 * it is only available in the browser runtime and will throw an error if removed.
 *
 * Libsodium is problematic in workers. It is a fork of the nacl lib and abstracts
 * away the complexities of using it. To solve this, tweetnacl is used instead of libsodium
 * to do the heavy lifting of the nacl lib, while sodium is used for it's utilities.
 *
 * TweetNacl was written by the core authors of the original NaCl lib in C, and is a small lib
 * that fits inside 100 tweets. It is closer to the metal than libsodium, and is more
 * suitable for use in a worker environment.
 *
 * @ts-expect-error globalThis*/
globalThis.importScripts = undefined;

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

      const webhookPayload = await request.json();
      const { decodedSettings, decodedEnv } = validateAndDecodeSchemas(env, webhookPayload.settings);
      webhookPayload.env = decodedEnv;
      webhookPayload.settings = decodedSettings;
      const permits = await plugin(webhookPayload, decodedEnv);
      return new Response(JSON.stringify(permits), { status: 200, headers: { "content-type": "application/json" } });
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
