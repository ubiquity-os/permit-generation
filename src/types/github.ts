import { RestEndpointMethodTypes } from "@octokit/rest";

export type Label = RestEndpointMethodTypes["issues"]["listLabelsForRepo"]["response"]["data"][0];

export enum UserType {
  User = "User",
  Bot = "Bot",
  Organization = "Organization",
}

export type Comment = RestEndpointMethodTypes["issues"]["listComments"]["response"]["data"][0];
export type Repository = RestEndpointMethodTypes["repos"]["get"]["response"]["data"];
export type Issue = RestEndpointMethodTypes["issues"]["get"]["response"]["data"];
export type PullRequest = RestEndpointMethodTypes["pulls"]["get"]["response"]["data"];
