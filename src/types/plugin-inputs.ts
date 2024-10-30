import { EmitterWebhookEvent as WebhookEvent, EmitterWebhookEventName as WebhookEventName } from "@octokit/webhooks";
import { SupportedEventsU } from "./context";
import { StaticDecode, Type as T } from "@sinclair/typebox";
import { StandardValidator } from "typebox-validators";

export interface PluginInputs<T extends WebhookEventName = SupportedEventsU> {
  stateId: string;
  eventName: T;
  eventPayload: WebhookEvent<T>["payload"];
  settings: PermitGenerationSettings;
  authToken: string;
  ref: string;
}

const permitRequestSchema = T.Union([
  T.Object({
    type: T.Literal("ERC20"),
    userId: T.Number(),
    amount: T.Number({ minimum: 1 }),
    evmNetworkId: T.Number(),
    tokenAddress: T.String(),
    issueNodeId: T.String(),
  }),
  T.Object({
    type: T.Literal("ERC721"),
    userId: T.Number(),
    amount: T.Number({ maximum: 1, minimum: 1, default: 1 }),
    evmNetworkId: T.Number(),
    tokenAddress: T.String(),
    issueNodeId: T.String(),
    erc721Request: T.Object({
      contributionType: T.String(),
      keys: T.Array(T.String()),
      values: T.Array(T.String()),
      metadata: T.Object({
        GITHUB_ORGANIZATION_NAME: T.String(),
        GITHUB_REPOSITORY_NAME: T.String(),
        GITHUB_ISSUE_NODE_ID: T.String(),
        GITHUB_USERNAME: T.String(),
        GITHUB_CONTRIBUTION_TYPE: T.String(),
      }),
    }),
  }),
]);

export type PermitRequest = StaticDecode<typeof permitRequestSchema>;

export const permitGenerationSettingsSchema = T.Object({
  evmPrivateEncrypted: T.String(),
  permitRequests: T.Array(permitRequestSchema),
});

export type PermitGenerationSettings = StaticDecode<typeof permitGenerationSettingsSchema>;

export const permitGenerationSettingsValidator = new StandardValidator(permitGenerationSettingsSchema);
