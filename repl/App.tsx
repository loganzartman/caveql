import { useState } from "react";
import { formatTree, parseQuery } from "../src";
import { compileQuery } from "../src/compile";
import { formatJS } from "../src/formatJS";

export function App() {
	const [source, setSource] = useState(() => {
		try {
			return atob(window.location.hash.substring(1));
		} catch {
			return "";
		}
	});

	let error: string | null = null;
	let treeString: string | null = null;
	let code: string | null = null;
	let results: Record<string, unknown>[] | null;
	try {
		const tree = parseQuery(source);
		treeString = formatTree(tree);
		const run = compileQuery(tree);
		code = formatJS(run.source);
		results = [...run([])];
		history.replaceState(undefined, "", `#${btoa(source)}`);
	} catch (e) {
		error = `Error: ${e instanceof Error ? e.message : String(e)}`;
		results = null;
	}

	return (
		<div className="flex flex-col w-full h-full gap-4 p-4">
			<div className="flex-1/4 grow h-0 flex flex-col gap-2">
				Type query:
				<textarea
					className="w-full h-full font-mono border-2"
					value={source}
					onChange={(e) => setSource(e.target.value)}
				/>
			</div>
			<div className="flex-2/4 grow h-0 flex flex-row gap-4">
				<div className="grow w-0 flex flex-col gap-2">
					<div>Parse tree:</div>
					<pre className="text-wrap break-all overflow-auto">
						{treeString ?? error}
					</pre>
				</div>
				<div className="grow w-0 flex flex-col gap-2">
					<div>Generated code:</div>
					<pre className="text-wrap break-all overflow-auto">
						{code ?? error}
					</pre>
				</div>
			</div>
			<div className="flex-1/4 grow h-0 overflow-auto">
				<table className="w-full table-auto border-collapse border border-slate-400">
					<thead>
						<tr className="sticky top-0 bg-fg text-bg">
							{results && results.length > 0 ? (
								Object.keys(results[0]).map((key) => (
									<th key={key} className="border border-slate-300 px-2">
										{key}
									</th>
								))
							) : (
								<th className="border border-slate-300 px-2">No results</th>
							)}
						</tr>
					</thead>
					<tbody>
						{results?.map((result, i) => (
							// biome-ignore lint/suspicious/noArrayIndexKey: no guaranteed key
							<tr key={i}>
								{Object.values(result).map((value, j) => (
									// biome-ignore lint/suspicious/noArrayIndexKey: no guaranteed key
									<td key={j} className="border border-slate-300 px-2">
										{String(value)}
									</td>
								))}
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
}
