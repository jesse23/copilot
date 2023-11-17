import CodeFlask from "codeflask";
import { useEffect, useRef } from "react";

export const CodeEditor = ({code, type, onChange}: {code: string, type: string, onChange: (code: string) => void}) => {
  const domRef = useRef<HTMLDivElement>(null);
  const codeFlaskRef = useRef<CodeFlask | null>(null);
  const codeRef = useRef<string | null>(null);

  useEffect(() => {
    if (domRef.current && codeFlaskRef.current === null) {
      codeFlaskRef.current = new CodeFlask(domRef.current, {
        language: type || "js",
        /*readonly: true,*/
      });
      codeFlaskRef.current.onUpdate(code => {
        // NOTE: without this sometimes the old state will overwrite the
        //new state in dev mode
        if(codeRef.current !== code) {
          onChange(code);
        } 
      });
      /*
      NOTE: this will cause strange behavior in dev mode
      return () => {
        codeFlaskRef.current = null;
      };
      */
    }
  }, [type, onChange]);

  useEffect(() => {
    if (codeFlaskRef.current && code !== codeFlaskRef.current.getCode()) {
      // used for block circular update
      codeRef.current = code;
      codeFlaskRef.current.updateCode(code || `const a = 1;`);
    }
  }, [code]);

  return (
    <div
      ref={domRef}
      style={{ height: "100%", width: "100%" }}
    ></div>
  );
};
