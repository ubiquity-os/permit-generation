import { Octokit } from "@octokit/rest";
import { EmitterWebhookEvent as WebhookEvent, EmitterWebhookEventName as WebhookEventName } from "@octokit/webhooks";
import { Env } from "./env";
import { Logs } from "@ubiquity-os/ubiquity-os-logger";
import { PermitGenerationSettings } from "./plugin-inputs";
import { createAdapters } from "../adapters";

export type SupportedEventsU = "issue_comment.created" | "workflow_dispatch" | "pull_request.closed" | "issues.closed";

export type SupportedEvents = {
  [K in SupportedEventsU]: K extends WebhookEventName ? WebhookEvent<K> : never;
};

export interface Context<T extends SupportedEventsU = SupportedEventsU, TU extends SupportedEvents[T] = SupportedEvents[T]> {
  eventName: T;
  payload: TU["payload"];
  octokit: InstanceType<typeof Octokit>;
  config: PermitGenerationSettings;
  env: Env;
  logger: Logs;
  adapters: ReturnType<typeof createAdapters>;
}
