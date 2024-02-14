import { queryCommand, queryAnchor } from "..";
import {
  CATEGORY_COMMAND_PLACEMENT_HELPER,
  CATEGORY_INDICATOR_HELPER,
  CATEGORY_INDICATOR_HELPER_INLINE,
  CATEGORY_JS_COMPLETION,
  CATEGORY_JS_COMPLETION_INLINE,
} from "../../const";

const { COPILOT_OPENAI_API_URL } = import.meta.env;

export const queryLLM = async (category: string, query: string, apiKey) => {
  if (!apiKey) {
    return Promise.resolve("COPILOT_OPENAI_API_KEY is not defined");
  }

  if (
    category === CATEGORY_JS_COMPLETION ||
    category === CATEGORY_JS_COMPLETION_INLINE
  ) {
    return fetch(`${COPILOT_OPENAI_API_URL}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content:
              "You are a JavaScript developer. you will complete the partial code with complete statement. The response should be code only without explanation.",
          },
          {
            role: "user",
            content: query,
          },
        ],
        max_tokens: 64,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        const suggestion = data.choices[0].message.content;
        return suggestion;
      });
  } else if (
    // "favoriteRank" for ItemRevision.items_tag>Item.master_object>Dataset.rank, while rank>0
    // show icon "favoriteRank" for ItemRevision, while its items_tag is Item, and the Item has attribute master_object and the master_object is Dataset, and the Dataset has attribute rank which is greater than 0
    // Based on rank attribute on type Dataset, I want to display the favoriteRank icon for the ItemRevision
    // category === CATEGORY_INDICATOR_HELPER_BACKUP
    category === CATEGORY_INDICATOR_HELPER ||
    category === CATEGORY_INDICATOR_HELPER_INLINE
  ) {
    // retrieval augmented generation
    const embeddings = (await queryCommand(query)) as any[];

    //
    const examples = embeddings
      // only get example with score > 0.5. voy vector store is not returning so skip it for now
      .filter(
        (item) => item.metadata.category === "example" // && item.score > 0.5
      )
      // only get the first 3 for size limitation
      .slice(0, 2)
      .map((item) => JSON.stringify(JSON.parse(item.pageContent), null, 2));

    const finalPrompt = [
      {
        role: "system",
        content: `
# Instruction
You are a helpful assistant to complete a JSON definition for indicators in a APP. The example is in the indicator.json. The response should be a complete JSON, without explanation.

# Object Traversal
The "prop" section  defines the traversal start from a given object, to the next type and so on. modelTypes defines the start object type. For example, given 'WorkspaceObject.release_status_list>ReleaseStatus.object_Name', if I want to show indicator with icon 'ReleaseApproved' it will be written as:
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

# Examples
\`\`\`json
${examples.join("\n")}
\`\`\`
        `,
      },
      {
        role: "user",
        content: query,
      },
    ];

    console.log(finalPrompt);

    return fetch(`${COPILOT_OPENAI_API_URL}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: finalPrompt,
        // max_tokens: 64,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        const suggestion = data.choices[0].message.content;
        return suggestion;
      });
  } else if (
    // find command in xxx
    category === CATEGORY_COMMAND_PLACEMENT_HELPER
  ) {
    // Step 1: convert query to command and placement
    const formatInputPrompt = [
      {
        role: "system",
        content: `
You are a helpful assistant that convert questions to command placement creation request. The response should be in JSON format below, without explanation:

\`\`\`json
{
  "command": "<command>",
  "from": "<command bar>",
  "to": "<command bar>
}
\`\`\`

For example, if the question is "move submitToWorkFlow to the page level", the response should be:

\`\`\`json
{
  "command": "submitToWorkFlow",
  "to": "page level"
}
\`\`\`

Another example is "move submit to work flow command from more group to page level", the response should be:

\`\`\`json
{
  "command": "submitToWorkFlow",
  "from": "more group",
  "to": "page level"
}
\`\`\`
        `,
      },
      {
        role: "user",
        content: query,
      },
    ];

    const inputData = await fetch(
      `${COPILOT_OPENAI_API_URL}/v1/chat/completions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4",
          messages: formatInputPrompt,
          // max_tokens: 64,
        }),
      }
    )
      .then((res) => res.json())
      .then((data) => {
        let suggestion = data.choices[0].message.content;
        if (suggestion.startsWith("```")) {
          suggestion = suggestion.split("\n").slice(1, -1).join("\n").trim();
        }
        return JSON.parse(suggestion);
      });

    // step 2: retrieve anchor from vector store
    const anchorTo = ((await queryAnchor(inputData.to)) as any[]).filter(
        (item) => item.metadata.category === "example" // && item.score > 0.5
      )
      // only get the first 3 for size limitation
      .slice(0, 1)
      .map((item) => JSON.parse(item.pageContent))[0];

    const anchorFrom = inputData.from? ((await queryAnchor(inputData.from)) as any[]).filter(
        (item) => item.metadata.category === "example" // && item.score > 0.5
      )
      // only get the first 3 for size limitation
      .slice(0, 1)
      .map((item) => JSON.parse(item.pageContent))[0] : anchorTo;

    // step 3: retrieve command from vector store
    const embeddings = (await queryCommand(`${inputData.command} ${anchorFrom.id}`)) as any[];

    const commandDefs = embeddings
      // only get example with score > 0.5. voy vector store is not returning so skip it for now
      .filter(
        (item) => item.metadata.category === "example" // && item.score > 0.5
      )
      // only get the first 3 for size limitation
      .slice(0, 1)
      .map((item) => JSON.parse(item.pageContent));

    const cmdDef = commandDefs[0];

    // Step 4: final prompt to generate the answer
    const finalPrompt = [
      {
        role: "system",
        content: `
# Instruction
You are a helpful assistant to create command placement JSON. The response should be in JSON format below, without explanation:

\`\`\`json
{
  "<command>_<command bar>_placement": {
    "id": "<command>",
    "uiAnchor": "<command bar>",
    "priority": 130,
    "parentGroupId": "<command group>"
  }
}
\`\`\`

- Priority is a number usually greater than 0. The lower the number, the command will be placed higher in the list. For now put a default 0.
- parentGroupId is the parent group id of the command. uiAnchor is the command bar where the command will be placed.
- If the command has parentGroupId defined, the uiAnchor is not required.

# Examples
- "put submitToWorkFlow to command bar aw_toolbar" will generate:
\`\`\`json
{
  "submitToWorkFlow_aw_toolbar_placement": {
    "id": "submitToWorkFlow",
    "uiAnchor": "aw_toolbar",
    "priority": 0
  }
}
\`\`\`

- "move submitToWorkFlow to command group Awp0ChangeTheme" will generate:
\`\`\`json
{
  "submitToWorkFlow_Awp0ChangeTheme_placement": {
    "id": "submitToWorkFlow",
    "parentGroupId": "Awp0ChangeTheme",
    "priority": 0
  }
}
\`\`\`
        `,
      },
      {
        role: "user",
        content: `put ${cmdDef.id} to ${anchorTo.type} ${anchorTo.id}`,
      },
    ];

    return await fetch(
      `${COPILOT_OPENAI_API_URL}/v1/chat/completions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4",
          messages: finalPrompt,
          // max_tokens: 64,
        }),
      }
    )
      .then((res) => res.json())
      .then((data) => {
        let suggestion = data.choices[0].message.content;
        if (suggestion.startsWith("```")) {
          suggestion = suggestion.split("\n").slice(1, -1).join("\n").trim();
        }
        const cmdPlacement = Object.values(JSON.parse(suggestion))[0] as Record<string, string>;
        const resp = {
          json: JSON.parse(suggestion),
          gql: `
mutation {
    addPlacement(input: {
        command: "${cmdPlacement.id}",
        anchor: "${cmdPlacement.parentGroupId || cmdPlacement.uiAnchor}",
        priority: -1
    }) {
        id placements {
            id priority anchor {
                id title {
                    value
                }
            }
            parentCommand {
                id title {
                    value
                }
            }
        }
    }
}
    `.split('\n').map(s => s.trim()).join('\n').trim()
        };
      return JSON.stringify(resp, null, 2); 
      });
  } else {
    return Promise.resolve("not supported in open AI mode");
  }
};
