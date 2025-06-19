import { useState } from "react";
import { formatTree, parse } from "../src";

export function App() {
	const [source, setSource] = useState(() => {
		try {
			return atob(window.location.hash.substring(1));
		} catch {
			return "";
		}
	});

	let parseTree: string;
	try {
		parseTree = formatTree(parse(source));
		history.replaceState(undefined, "", `#${btoa(source)}`);
	} catch (e) {
		parseTree = `Error: ${e instanceof Error ? e.message : String(e)}`;
	}

	return (
		<div className="flex flex-row w-full h-full gap-4 p-4">
			<div className="grow w-0">
				Type query:
				<textarea
					className="w-full h-full font-mono border-2"
					value={source}
					onChange={(e) => setSource(e.target.value)}
				/>
			</div>
			<div className="grow w-0">
				<div>Parse tree:</div>
				<pre>{parseTree}</pre>
			</div>
		</div>
	);
}
