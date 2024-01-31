import {
  CATEGORY_CHAT,
  CATEGORY_JS_COMPLETION,
  CATEGORY_COMMAND_CONFIG,
  CATEGORY_CREATE_JSON,
  CATEGORY_JS_COMPLETION_INLINE,
  CATEGORY_INDICATOR_HELPER,
} from "../../const";
import * as webllm from "@mlc-ai/web-llm";
import appConfig from "./app_config";

const PROMPTS = {
  /// what is 'Detroit'?
  [CATEGORY_CHAT]: `
    <s>[INST]You are a helpful assistant that can answer any question in one sentence.[/INST]<s>
    `,
  /// Given 'ItemRevision.items_tag>Item', rule for traverse and process from Item to ItemRevision
  [CATEGORY_CREATE_JSON]: `
    <s>[INST] You are a helpful code assistant. Your task is to generate a valid JSON object only without explanation. So for instance the following:

    name: John
    lastname: Smith
    address: #1 Samuel St.
    
    would be converted to:[/INST]
    {
    "address": "#1 Samuel St.",
    "lastname": "Smith",
    "name": "John"
    }
    </s>
    `.trim(),
  [CATEGORY_JS_COMPLETION]: `
    <s>[INST]You are a helpful code assistant. Your task is to complete the javascript code for the ask in js file. You should only return the code. No steps or explanations.[/INST]</s>
    `.trim(),
  [CATEGORY_JS_COMPLETION_INLINE]: `
    <s>[INST]You are a helpful code assistant. Your task is to complete the javascript code from input. You should only return the new completion part. No explanation needed.[/INST]</s>
    `.trim(),
  [CATEGORY_INDICATOR_HELPER]: `
    <s>[INST]
    You are a helpful assistant to complete a JSON definition for indicators in a APP. The response should be a complete JSON with the given key in input as key, without explanation.

    The "prop" attribute in example defines the traversal start from a given object, to the next type and so on. modelTypes defines the start object type. For example, given 'WorkspaceObject.release_status_list>ReleaseStatus.object_Name', if I want to show indicator with icon 'ReleaseApproved' it will be written as:
    \`\`\`
    {
      "iconName": "ReleasedApproved",
      "tooltip": {
        "showPropDisplayName": false,
        "propNames": ["object_name", "date_released"]
      },
      "prop": {
        "names": ["release_status_list"],
        "type": {
          "names": ["ReleaseStatus"],
          "prop": {
            "names": ["object_name"],
            "conditions": { "object_name": { "$eq": "Approved" } }
          }
        }
      },
      "modelTypes": ["WorkspaceObject"]
    }
    \`\`\`
    Another example will be show indicator with icon 'UserIsAdmin' for 'DesignRevision.items_tag>Design.owning_user>User.is_admin' when 'is_admin' is true:
    \`\`\`
    {
      "iconName": "ReleasedApproved",
      "tooltip": {
        "showPropDisplayName": false,
        "propNames": ["object_name", "is_admin"]
      },
      "prop": {
        "names": ["items_tag"],
        "type": {
          "names": ["Design"],
          "prop": {
            "names": ["owning_user"],
            "type": {
              "names": ["User"],
              "prop": {
                "names": ["is_admin"],
                "conditions": { "is_admin": { "$eq": true } }
              }
            }
          }
        }
      },
      "modelTypes": ["DesignRevision"]
    }
    \`\`\`
    and the condition applys at the end object with given properties.[/INST]</s>
  `.trim(),
  /// 'paste' command in left wall, visible when it is object set table
  [CATEGORY_COMMAND_CONFIG]: `
    <s>[INST] You are a helpful code assistant. Your task is to generate a valid Command configuration JSON object based on the given information. It follows rules below:
    - Command configuration is constructed by 3 parts: commands, commandHandlers and commandPlacements. 
    - All the attributes that we could use are listed in example below.
    - uiAnchor is a string that can be chosen from 'rightWall', 'toolBar', 'leftWall', 'summaryHeader'.
    - icon id is string to find icon in icon library.
    - action for command handler is a function name as string.

    Below is examples to define 'icon' command and 'home' command:[/INST]
    {
      "commands": {
        "iconCommand": {
            "iconId": "cmdImage",
            "isGroup": false,
            "title": "Icon Library"
        },
        "homeCommand": {
            "iconId": "cmdHome",
            "isGroup": false,
            "title": "Home"
        }
      },
      "commandHandlers": {
        "homeCommandHandler": {
            "id": "homeCommand",
            "action": "homeCommandAction",
            "activeWhen": true,
            "visibleWhen": true
        },
        "iconCommandHandler": {
            "id": "iconCommand",
            "action": "iconCommandAction",
            "activeWhen": true,
            "visibleWhen": {
                "condition": "conditions.showIconList"
            }
        }
      },
      "commandPlacements": {
        "homeCommandPlacement": {
            "id": "homeCommand",
            "uiAnchor": "aw_globalNavigationbar",
            "priority": 1000
        },
        "iconCommandPlacement": {
            "id": "iconCommand",
            "uiAnchor": "aw_globalNavigationbar",
            "priority": 2500
        }
      },
      "conditions": {
        "isLabelShown": {
            "expression": "ctx.toggleLabel === true"
        },
        "showIconList": {
            "expression": "ctx.showIconList === 'true'"
        }
      }
    }
    </s>
    `.trim(),
};

const createPrompt = (category: string, query: string) => {
  return `${PROMPTS[category]}[INST]${query}[/INST]`;
};

const ctx = {
  clientChatInitPromise: null,
};

const createChat = async (
  { model, progressCallback } = {} as {
    model: string;
    progressCallback?: (msg: string, step?: number) => void;
  }
) => {
  // Use a chat worker client instead of ChatModule here
  const chat = new webllm.ChatWorkerClient(
    new Worker(new URL("./worker.ts", import.meta.url), { type: "module" })
  );

  chat.setInitProgressCallback((report: webllm.InitProgressReport) => {
    // setLabel("init-label", report.text);
    // console.log(report.text);
    progressCallback?.(report.text);
  });

  await chat.reload(model, undefined, appConfig);

  return {
    generate: async (prompt: string) => {
      const resp = await chat.generate(
        prompt,
        (_step: number, message: string) => {
          // setLabel("generate-label", message);
          progressCallback?.(message, _step);
        }
      );

      progressCallback?.(await chat.runtimeStatsText());

      return resp;
    },
  };
};

export const queryLLM = async (category: string, query: string) => {
  if (!ctx.clientChatInitPromise) {
    await initLLM(console.log);
  }
  const clientChatObj = await ctx.clientChatInitPromise;
  return clientChatObj.generate(createPrompt(category, query));
};

export const initLLM = async (progressCallback) => {
  if (!ctx.clientChatInitPromise) {
    ctx.clientChatInitPromise = createChat({
      model: "Mistral-7B-Instruct-v0.1-q4f32_1",
      progressCallback,
    });
  }
};

