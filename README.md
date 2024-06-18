# `@ubiquibot/plugin-template`

## Prerequisites

- A good understanding of how the [kernel](https://github.com/ubiquity/ubiquibot-kernel) works and how to interact with it.
- A basic understanding of the Ubiquibot configuration and how to define your plugin's settings.

## Getting Started

1. Create a new repository using this template.
2. Clone the repository to your local machine.
3. Install the dependencies preferably using `yarn` or `bun`.

## Creating a new plugin

- If your plugin is to be used as a slash command which should have faster response times as opposed to longer running GitHub action tasks, you should use the `worker` type.

1. Ensure you understand and have setup the [kernel](https://github.com/ubiquity/ubiquibot-kernel).
2. Update [compute.yml](./.github/workflows/compute.yml) with your plugin's name and update the `id`.
3. Update [context.ts](./src/types/context.ts) with the events that your plugin will fire on.
4. Update [plugin-inputs.ts](./src/types/plugin-inputs.ts) to match the `with:` settings in your org or repo level configuration.

- Your plugin config should look similar to this:

```yml
- plugin: <plugin-org/owner>/<plugin-repo-name>:compute.yml@development
  name: plugin-name
  id: plugin-name-command
  description: "Plugin description" # small description of what the plugin does
  command: "<regex for command>" # if you are creating a plugin with a slash command
  example: "<example usage>" # how to invoke the slash command
  with: # these are the example settings, the kernel passes these to the plugin.
    disabledCommands: []
    timers:
      reviewDelayTolerance: 86000
      taskStaleTimeoutDuration: 2580000
    miscellaneous:
      maxConcurrentTasks: 3
    labels:
      time: []
      priority: []
```

###### At this stage, your plugin will fire on your defined events with the required settings passed in from the kernel. You can now start writing your plugin's logic.

5. Start building your plugin by adding your logic to the [plugin.ts](./src/plugin.ts) file.

## Testing a plugin

### Worker Plugins

- `yarn/bun worker` - to run the worker locally.
- To trigger the worker, `POST` requests to http://localhost:4000/ with an event payload similar to:

```ts
await fetch("http://localhost:4000/", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    stateId: "",
    eventName: "",
    eventPayload: "",
    settings: "",
    ref: "",
    authToken: "",
  }),
});
```

A full example can be found [here](https://github.com/ubiquibot/assistive-pricing/blob/623ea3f950f04842f2d003bda3fc7b7684e41378/tests/http/request.http).

### Action Plugins

- Ensure the kernel is running and listening for events.
- Fire an event in/to the repo where the kernel is installed. This can be done in a number of ways, the easiest being via the GitHub UI or using the GitHub API, such as posting a comment, opening an issue, etc in the org/repo where the kernel is installed.
- The kernel will process the event and dispatch it using the settings defined in your `.ubiquibot-config.yml`.
- The `compute.yml` workflow will run and execute your plugin's logic.
- You can view the logs in the Actions tab of your repo.

[Nektos Act](https://github.com/nektos/act) - a tool for running GitHub Actions locally.

## More information

- [Full Ubiquibot Configuration](https://github.com/ubiquity/ubiquibot/blob/0fde7551585499b1e0618ec8ea5e826f11271c9c/src/types/configuration-types.ts#L62) - helpful for defining your plugin's settings as they are strongly typed and will be validated by the kernel.
- [Ubiquibot V1](https://github.com/ubiquity/ubiquibot) - helpful for porting V1 functionality to V2, helper/utility functions, types, etc. Everything is based on the V1 codebase but with a more modular approach. When using V1 code, keep in mind that most all code will need refactored to work with the new V2 architecture.

## Examples

- [Start/Stop Slash Command](https://github.com/ubq-testing/start-stop-module) - simple
- [Assistive Pricing Plugin](https://github.com/ubiquibot/assistive-pricing) - complex
- [Conversation Rewards](https://github.com/ubiquibot/conversation-rewards) - really complex
