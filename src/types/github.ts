import { RestEndpointMethodTypes } from "@octokit/rest";

export type Label = RestEndpointMethodTypes["issues"]["listLabelsForRepo"]["response"]["data"][0];

export enum UserType {
  User = "User",
  Bot = "Bot",
  Organization = "Organization",
}
