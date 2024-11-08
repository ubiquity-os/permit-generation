import { Type as T, StaticDecode } from "@sinclair/typebox";
import { Value } from "@sinclair/typebox/value";

const webhookPayloadSchema = T.Object({
  inputs: T.String({ contentEncoding: "base64" }),
  signature: T.String(),
  issueNodeId: T.Optional(T.String()),
  userId: T.Optional(T.String()),
});

export type WebhookPayload = StaticDecode<typeof webhookPayloadSchema>;

export function validateAndDecodeWebhookPayload(t: WebhookPayload) {
  const isSuccessful = Value.Check(webhookPayloadSchema, t);
  const decodedWHPayload = Value.Decode(webhookPayloadSchema, t);
  return { isSuccessful, decodedWHPayload };
}
