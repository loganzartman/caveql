import EditorWorker from "url:monaco-editor/esm/vs/editor/editor.worker.js";
import CSSWorker from "url:monaco-editor/esm/vs/language/css/css.worker.js";
import HTMLWorker from "url:monaco-editor/esm/vs/language/html/html.worker.js";
import JSONWorker from "url:monaco-editor/esm/vs/language/json/json.worker.js";
import TSWorker from "url:monaco-editor/esm/vs/language/typescript/ts.worker.js";
import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import { caveqlLanguage } from "./language";

self.MonacoEnvironment = {
	getWorkerUrl: (_moduleId, label) => {
		if (label === "json") {
			return JSONWorker;
		}
		if (label === "css" || label === "scss" || label === "less") {
			return CSSWorker;
		}
		if (label === "html" || label === "handlebars" || label === "razor") {
			return HTMLWorker;
		}
		if (label === "typescript" || label === "javascript") {
			return TSWorker;
		}
		return EditorWorker;
	},
};

monaco.languages.register({ id: "caveql" });
monaco.languages.setMonarchTokensProvider("caveql", caveqlLanguage);

export { monaco };
