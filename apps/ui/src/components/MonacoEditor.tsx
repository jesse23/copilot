import { useEffect, useRef } from "react";
import { debounce, eventBus, wait } from "../libs";
import {
  CATEGORY_JS_COMPLETION,
  CATEGORY_JS_COMPLETION_INLINE,
  EVENT_COPILOT_QUERY,
  EVENT_COPILOT_UPDATE,
} from "../const";

import "monaco-editor/esm/vs/editor/editor.all.js";

// import 'monaco-editor/esm/vs/editor/standalone/browser/iPadShowKeyboard/iPadShowKeyboard.js';
// import 'monaco-editor/esm/vs/editor/standalone/browser/inspectTokens/inspectTokens.js';
// import 'monaco-editor/esm/vs/editor/standalone/browser/quickAccess/standaloneHelpQuickAccess.js';
// import 'monaco-editor/esm/vs/editor/standalone/browser/quickAccess/standaloneGotoLineQuickAccess.js';
// import 'monaco-editor/esm/vs/editor/standalone/browser/quickAccess/standaloneGotoSymbolQuickAccess.js';
// import 'monaco-editor/esm/vs/editor/standalone/browser/quickAccess/standaloneCommandsQuickAccess.js';
// import 'monaco-editor/esm/vs/editor/standalone/browser/referenceSearch/standaloneReferenceSearch.js';

// import 'monaco-editor/esm/vs/basic-languages/monaco.contribution';
import "monaco-editor/esm/vs/basic-languages/javascript/javascript.contribution";
import "monaco-editor/esm/vs/language/typescript/monaco.contribution";
import "monaco-editor/esm/vs/language/json/monaco.contribution";
import "monaco-editor/esm/vs/language/css/monaco.contribution";
import "monaco-editor/esm/vs/language/html/monaco.contribution";

import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import { useCopilot } from ".";
// import * as monaco from 'monaco-editor';

interface MonacoEditorProps {
  /* language type */
  lang: string;
  /* text input to initialize the editor */
  text: string;
  /* category for copilot */
  category: string;
}

const queryCompletion = async (category, query) => {
  // TODO: need to handle timeout and reject here
  return new Promise((resolve) => {
    const sub = eventBus.subscribe(EVENT_COPILOT_UPDATE, ({ response }) => {
      eventBus.unsubscribe(EVENT_COPILOT_UPDATE, sub);
      const lastLine = query.split("\n").pop() || "";
      const lastWord = lastLine.split(/\b/).pop() || "";
      if (response.startsWith("```")) {
        const responseInLines = response.split("\n");
        response = responseInLines
          .slice(1, responseInLines.length - 1)
          .join("\n");
      } else if (response.startsWith(query)) {
        response = response.slice(query.length);
        response = lastWord + response;
      } else if (response.startsWith(lastLine)) {
        response = response.slice(lastLine.length);
        response = lastWord + response;
      } else if (response.startsWith(lastLine)) {
        // do nothing
      } else if (!response.startsWith(lastWord)) {
        response = lastWord + response;
      }
      resolve(response);
    });

    eventBus.publish(EVENT_COPILOT_QUERY, {
      category,
      query,
    });
  });
};

const queryCompletionDebounced = debounce(queryCompletion, 2000);

export const MonacoEditor = ({ lang, text, category }: MonacoEditorProps) => {
  const domRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);

  const { setCategory } = useCopilot();

  useEffect(() => {
    setCategory(category);
    const subs = eventBus.subscribe(
      EVENT_COPILOT_UPDATE,
      ({ category: c, response }) => {
        if (c === category) {
          if (response.startsWith("```")) {
            const responseInLines = response.split("\n");
            response = responseInLines
              .slice(1, responseInLines.length - 1)
              .join("\n");
          }
          const code = editorRef.current.getValue();
          editorRef.current.setValue(code + "\n" + response);
        }
      }
    );
    return () => {
      eventBus.unsubscribe(EVENT_COPILOT_UPDATE, subs);
      setCategory("");
    };
  }, []);

  useEffect(() => {
    if (domRef.current && editorRef.current === null) {
      editorRef.current = monaco.editor.create(domRef.current, {
        value: text,
        language: lang,
        inlineSuggest: {
          enabled: true,
          showToolbar: "always",
          mode: "prefix",
          keepOnBlur: true,
        },
        suggest: {
          snippetsPreventQuickSuggestions: false,
        },
      });

      let _currentSuggestionPromise = Promise.resolve({
        items: [{ insertText: "" }],
      });

      // Event listener for editor changes
      editorRef.current.onDidChangeModelContent((/*event*/) => {
        const code = editorRef.current.getValue();

        // Call your AI API with the code to get the suggestion
        _currentSuggestionPromise = queryCompletionDebounced(
          `${category}_inline`,
          code
        ).then((suggestion: string) => {
          // console.log(suggestion);
          // NOTE: suggest widget will block the inline suggestions, hide it for now as workaround
          editorRef.current.trigger("keyboard", "hideSuggestWidget", {});
          return {
            items: [
              {
                insertText: suggestion,
              },
            ],
          };
        });
      });

      // NOTE: put it here for now
      monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
        validate: true,
        allowComments: true,
      });

      monaco.languages.registerInlineCompletionsProvider(lang, {
        provideInlineCompletions: function () {
          return _currentSuggestionPromise;
        },
        freeInlineCompletions: function () {},
      });
    }

    // NOTE: this will cause strange behavior in dev mode
    return () => {
      if (editorRef.current) {
        editorRef.current.dispose();
        editorRef.current = null;
      }
    };
  }, []);

  return <div ref={domRef} style={{ height: "100%", width: "100%" }}></div>;
};
