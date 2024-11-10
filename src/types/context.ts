import { EmitterWebhookEvent as WebhookEvent, EmitterWebhookEventName as WebhookEventName } from "@octokit/webhooks";
import { Octokit } from "@octokit/rest";
import { PermitGenerationSettings } from "./plugin-input";
import { createAdapters } from "../adapters";
import { Env } from "./env";

export type SupportedEvents = "issue_comment.created" | "workflow_dispatch" | "pull_request.closed" | "issues.closed";

export interface Logger {
  fatal: (message: unknown, ...optionalParams: unknown[]) => void;
  error: (message: unknown, ...optionalParams: unknown[]) => void;
  warn: (message: unknown, ...optionalParams: unknown[]) => void;
  info: (message: unknown, ...optionalParams: unknown[]) => void;
  debug: (message: unknown, ...optionalParams: unknown[]) => void;
}

export interface Context<T extends WebhookEventName = SupportedEvents> {
  eventName: T;
  payload: WebhookEvent<T>["payload"];
  octokit: InstanceType<typeof Octokit>;
  adapters: ReturnType<typeof createAdapters>;
  config: PermitGenerationSettings;
  env: Env;
  logger: Logger;
}
