import { useEffect, useRef } from "react";
import { debounce, eventBus, wait } from "../libs";
import { CATEGORY_JS_COMPLETION, EVENT_COPILOT_QUERY, EVENT_COPILOT_UPDATE } from "../const";

import 'monaco-editor/esm/vs/editor/editor.all.js';

// import 'monaco-editor/esm/vs/editor/standalone/browser/iPadShowKeyboard/iPadShowKeyboard.js';
// import 'monaco-editor/esm/vs/editor/standalone/browser/inspectTokens/inspectTokens.js';
// import 'monaco-editor/esm/vs/editor/standalone/browser/quickAccess/standaloneHelpQuickAccess.js';
// import 'monaco-editor/esm/vs/editor/standalone/browser/quickAccess/standaloneGotoLineQuickAccess.js';
// import 'monaco-editor/esm/vs/editor/standalone/browser/quickAccess/standaloneGotoSymbolQuickAccess.js';
// import 'monaco-editor/esm/vs/editor/standalone/browser/quickAccess/standaloneCommandsQuickAccess.js';
// import 'monaco-editor/esm/vs/editor/standalone/browser/referenceSearch/standaloneReferenceSearch.js';

// import 'monaco-editor/esm/vs/basic-languages/monaco.contribution';
import 'monaco-editor/esm/vs/basic-languages/javascript/javascript.contribution';
import 'monaco-editor/esm/vs/language/typescript/monaco.contribution';
import 'monaco-editor/esm/vs/language/json/monaco.contribution';
import 'monaco-editor/esm/vs/language/css/monaco.contribution';
import 'monaco-editor/esm/vs/language/html/monaco.contribution';

import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
// import * as monaco from 'monaco-editor';

const queryCompletion = async (mode, code) => {
  return new Promise((resolve, reject) => {
    const sub = eventBus.subscribe(EVENT_COPILOT_UPDATE, ({ response }) => {
      eventBus.unsubscribe(EVENT_COPILOT_UPDATE, sub);
      const lastLine = code.split("\n").pop() || "";
      const lastWord = lastLine.split(/\b/).pop() || "";
      if(response.startsWith(code)) {
        response = response.slice(code.length);
        response = lastWord + response;
      } else if(response.startsWith(lastLine)) {
        response = response.slice(lastLine.length);
        response = lastWord + response;
      } else if(response.startsWith(lastLine)) {
        // do nothing
      } else if(!response.startsWith(lastWord)) {
        response = lastWord + response;
      }
      resolve(response);
    });

    eventBus.publish(EVENT_COPILOT_QUERY, {
      category: CATEGORY_JS_COMPLETION,
      query: code,
    });
  });
};

const queryCompletionDebounced = debounce(queryCompletion, 2000);

export const MonacoEditor = ({}: {
  code: string;
  type: string;
  onChange: (code: string) => void;
}) => {
  const domRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);

  useEffect(() => {
    if (domRef.current && editorRef.current === null) {
      editorRef.current = monaco.editor.create(domRef.current, {
        value: 'console.log("Hello, world")',
        language: "javascript",
        inlineSuggest: {
          enabled: true,
          showToolbar: "always",
          mode: "prefix",
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
        _currentSuggestionPromise = queryCompletionDebounced("", code).then(
          (suggestion: string) => {
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
          }
        );
      });

      monaco.languages.registerInlineCompletionsProvider("javascript", {
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

  /*
  useEffect(() => {
    if (editorRef.current && code !== editorRef.current.getCode()) {
      // used for block circular update
      codeRef.current = code;
      editorRef.current.updateCode(code || `const a = 1;`);
    }
  }, [code]);
  */

  return <div ref={domRef} style={{ height: "100%", width: "100%" }}></div>;
};
