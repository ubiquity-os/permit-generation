import { EmitterWebhookEvent as WebhookEvent, EmitterWebhookEventName as WebhookEventName } from "@octokit/webhooks";
import { SupportedEvents } from "./context";

export interface PluginInputs<T extends WebhookEventName = SupportedEvents> {
  stateId: string;
  eventName: T;
  eventPayload: WebhookEvent<T>["payload"];
  settings: PermitGenerationSettings;
  authToken: string;
  ref: string;
}

export interface PermitGenerationSettings {
  evmNetworkId: number;
  evmPrivateEncrypted: string;
  isNftRewardEnabled: boolean;

  // possible inputs from workflow_dispatch
  token?: `0x${string}`;
  amount?: number;
  spender?: `0x${string}`;
  networkId?: number;
  userId?: number;

  // nft specific inputs
  contribution_type?: string;
  username?: string;
  issueID?: number;
}
