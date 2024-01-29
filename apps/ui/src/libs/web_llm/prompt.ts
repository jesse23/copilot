import {
  CATEGORY_CHAT,
  CATEGORY_JS_COMPLETION,
  CATEGORY_COMMAND_CONFIG,
  CATEGORY_CREATE_JSON,
} from "../../const";
import { createChat } from "./llm";

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
    <s>[INST]You are a helpful code assistant. Your task is to complete the javascript code from input. You should only return the new completion part. No explanation needed.[/INST]</s>
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

export const initWebLLM = async (progressCallback) => {
  if (!ctx.clientChatInitPromise) {
    ctx.clientChatInitPromise = createChat({
      model: "Mistral-7B-Instruct-v0.1-q4f32_1",
      progressCallback,
    });
  }
};

export const queryLLM = async (category: string, query: string) => {
  if (!ctx.clientChatInitPromise) {
    await initWebLLM(console.log);
  }
  const clientChatObj = await ctx.clientChatInitPromise;
  return clientChatObj.generate(createPrompt(category, query));
};
