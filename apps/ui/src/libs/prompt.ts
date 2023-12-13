import { CATEGORY_CHAT, CATEGORY_COMMAND_CONFIG, CATEGORY_FETCH_RULE } from "../const";

const PROMPTS = {
    /// what is 'Detroit'?
    [CATEGORY_CHAT]: "Response should be short. Question:",
    /// Given 'ItemRevision.items_tag>Item', rule for traverse and process from Item to ItemRevision
    [CATEGORY_FETCH_RULE]: `
    # Concept
    Given 'A.a>B' (or 'B<a.A') presents class A has an attributes and the value type of the attribute is class B:
    - If we need to traverse only from A to B, the rule is:
      CLASS.A:CLASS.B:ATTRIBUTE.a:TRAVERSE
    - If we need to traverse and process from B to A, the rule is:
      CLASS.B:CLASS.A:REFBY.a:TRAVERSE+PROCESS
    
    # Format
    Response should be rule only without quote. Question:
    `.trim(),
    /// 'paste' command in left wall, visible when it is object set table
    [CATEGORY_COMMAND_CONFIG]: `
    # Definition
    - Command configuration is constructed by 3 parts: commands, commandHandlers and commandPlacements. 
    - All the attributes that we could use are listed in example below.
    - uiAnchor is a string that can be chosen from 'rightWall', 'toolBar', 'leftWall', 'summaryHeader'.
    - icon id is string to find icon in icon library.
    - action for command handler is a function name as string.

    ## Example
    Below is examples to define 'icon' command and 'home' command.
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

    # Format
    Response should be JSON only. Question:
    `
}


export const createPrompt = (category: string, query: string) => {
  return `${PROMPTS[category]} ${query}`;
}

/*
    ## Relation
    GIven class C and class D are connected by class E, ( as 'C<primary_object.E.secondary_object>D'), then:
    - If we need to traverse and process from C to D, the rule is:
      CLASS.C:CLASS.D:P2S.E:TRAVERSE+PROCESS
    - If we need to only process from D to C, the rule is:
      CLASS.D:CLASS.C:S2P.E:PROCESS
*/