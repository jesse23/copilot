import { MonacoEditor } from "../components/MonacoEditor";
import { CATEGORY_JS_COMPLETION } from "../const";

export const SampleJSEditor = () => {
    return (
        <MonacoEditor 
            lang="javascript" 
            text="console.log('hello, world')" 
            category={CATEGORY_JS_COMPLETION}
            />
    );
}