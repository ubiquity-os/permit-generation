import YAML from "yaml";
import { Context } from "../types/context";
import { BotConfig } from "../types/botConfig";

export async function getUbiquiBotConfig(event: Context): Promise<BotConfig> {
  const responses = {
    repositoryConfig: null as BotConfig | null,
    organizationConfig: null as BotConfig | null,
  };
  const payload = event.payload;
  if (!("repository" in payload) || !payload.repository) throw new Error("Repo is not defined");

  try {
    responses.repositoryConfig = await fetchConfig(event, payload.repository.name);
  } catch (error) {
    console.error(error);
  }

  try {
    responses.organizationConfig = await fetchConfig(event, `.ubiquibot-config`);
  } catch (error) {
    console.error(error);
  }

  // Merge the two configs
  return {
    ...(responses.organizationConfig || {}),
    ...(responses.repositoryConfig || {}),
  } as BotConfig;
}

async function fetchConfig(event: Context, repo: string): Promise<BotConfig | null> {
  const payload = event.payload;
  if (!("repository" in payload) || !payload.repository) throw new Error("Repository is not defined");

  const response = await event.octokit.rest.repos.getContent({
    owner: payload.repository.owner.login,
    repo,
    path: ".github/ubiquibot-config.yml",
  });

  // Check if the response data is a file and has a content property
  if ("content" in response.data && typeof response.data.content === "string") {
    // Convert the content from Base64 to string and parse the YAML content
    const content = atob(response.data.content).toString();
    return parseYaml(content) as BotConfig;
  } else {
    return null;
    // throw new Error("Expected file content, but got something else");
  }
}

export function parseYaml(data: null | string) {
  try {
    if (data) {
      const parsedData = YAML.parse(data);
      return parsedData ?? null;
    }
  } catch (error) {
    console.error("Error parsing YAML", error);
  }
  return null;
}
