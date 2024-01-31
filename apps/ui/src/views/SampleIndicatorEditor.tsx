import { MonacoEditor } from "../components/MonacoEditor";
import { CATEGORY_INDICATOR_HELPER } from "../const";

export const SampleIndicatorEditor = () => {
    return (
        <MonacoEditor 
            lang="json" 
            text="// write json for indicator config here" 
            category={CATEGORY_INDICATOR_HELPER}
            />
    );
}