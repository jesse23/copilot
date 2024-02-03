import { queryVectorStore } from "..";
import {
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
    const embeddings = await queryVectorStore(query);

    // 
    const examples = embeddings
      // only get example with score > 0.5. voy vector store is not returning so skip it for now
      .filter(
        (item) => item.metadata.category === "example" // && item.score > 0.5
      )
      // only get the first 3 for size limitation
      .slice(0, 2)
      .map((item) => JSON.stringify(JSON.parse(item.pageContent),null,2));

    const finalPrompt = [
      {
        role: "system",
        content:
        `
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
        `
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
  } else {
    return Promise.resolve("not supported in open AI mode");
  }
};
