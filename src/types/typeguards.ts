import { RestEndpointMethodTypes } from "@octokit/rest";
import { Context } from "./context";

export function isIssueEvent(context: Context): context is Context & { issue: RestEndpointMethodTypes["issues"]["list"]["response"]["data"][0] } {
  return context.eventName.startsWith("issues.");
}
