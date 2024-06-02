# `@ubiquibot/plugin-template`

Still a work in progress while some aspects of the kernel are being actively worked on.

It contains the ingredients for a basic plugin, including the necessary files and a basic structure. This is not a complete guide or fully featured template at this stage, but it should be enough to get you started. If you have any questions, pop into the Telegram chat and ask or dm me directly, I'm happy to help.

## Prerequisites

- A basic understanding of GitHub Actions, writing workflows, and the GitHub API.
- A good understanding of how the kernel works and how to interact with it.
- A basic understanding of the Ubiquibot configuration file and how to define your plugin's settings.

## Getting Started

1. Create a new repository using this template.
2. Clone the repository to your local machine.
3. Install the dependencies using your package manager of choice.

## Creating a new plugin

1. Ensure you understand and have setup the [kernel](https://github.com/ubiquity/ubiquibot-kernel).
2. Update [.ubiquibot-config.yml](./.github/.ubiquibot-config.yml) with your plugin's information. This is the configuration file for _this_ repository, you should also have a private org repo `.ubiquibot-config` with `./github/.ubiquibot-config.yml` as the contents. Here is where you should store sensitive keys like `keys.openAi` and `keys.evmPrivateEncrypted`.

```yml
plugins: # an object of plugins, indexed by the event they fire on
  issue_comment.created: # or any other event
    - uses: # sequence of plugins to run
        - plugin: <plugin-org/owner>/<plugin-repo-name>:compute.yml@development
          name: plugin-name
          id: plugin-name-command
          type: github # | worker # only github is supported at the moment.
          description: "Plugin description" # small description of what the plugin does
          command: "<regex for command>" # if you are creating a plugin with a slash command
          example: "<example usage>" # how to invoke the slash command
          with: # these are the example settings, the kernel passes these to the plugin.
            # it will merge both your repo and org settings with the event
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

3. Update [compute.yml](./.github/workflows/compute.yml) with your plugin's name and update the `id`.
4. Update [context.ts](./src/types/context.ts) with the events that your plugin will fire on and any additional environment variables passed in via your workflow.
5. Update [plugin-inputs.ts](./src/types/plugin-inputs.ts) to match the `with:` settings inside the `.ubiquibot-config.yml` that you created in step 2.

###### At this stage, your plugin will fire on your defined events with the required settings passed in from the kernel. You can now start writing your plugin's logic.

6. Start buidling your plugin by adding your logic to the [plugin.ts](./src/plugin.ts) file.

## Testing a plugin

#### Testing

1. Launch the kernel (ubiquibot GH app) to listen for events in the org/repos it is installed.
2. Fire an event (e.g. "issue_comment.created") in the org/repo where the kernel is installed.
3. The kernel will process the event and dispatch it using the settings defined in the `.ubiquibot-config.yml`.

- Tip: Work from a private repo which will allow you to log anything into your worker logs safely. Before you make your plugin public, ensure you remove any sensitive information from the logs by deleting the logs from the workflow runs.

- Tip: You can also fire events directly to your Smee.io webhook URL created during the kernel setup but will require you to manually build the event payload.

[Nektos Act](https://github.com/nektos/act) - a tool for running GitHub Actions locally.

## More information

- [Full Ubiquibot Configuration](https://github.com/ubiquity/ubiquibot/blob/0fde7551585499b1e0618ec8ea5e826f11271c9c/src/types/configuration-types.ts#L62) - helpful for defining your plugin's settings as they are strongly typed and will be validated by the kernel.
- [Ubiquibot V1](https://github.com/ubiquity/ubiquibot) - helpful for porting V1 functionality to V2, helper/utility functions, types, etc. Everything is based on the V1 codebase but with a more modular approach. When using V1 code, keep in mind that most all code will need refactored to work with the new V2 architecture.

## Examples

- [Start/Stop Slash Command](https://github.com/ubq-testing/start-stop-module) - simple
- [Assistive Pricing Plugin](https://github.com/ubiquibot/assistive-pricing) - complex
- [Conversation Rewards](https://github.com/ubiquibot/conversation-rewards) - really complex
