import CaveqlSvg from "jsx:./caveql.svg";
import { CodeBracketIcon, TableCellsIcon } from "@heroicons/react/20/solid";
import { clsx } from "clsx";
import { useState } from "react";
import { formatTree, parseQuery } from "../src";
import { compileQuery } from "../src/compile";
import { formatJS } from "../src/formatJS";
import { Tab } from "./components/Tab";
import { TabGroup } from "./components/TabGroup";
import { TabList } from "./components/TabList";
import { TabPanel } from "./components/TabPanel";
import { TabPanels } from "./components/TabPanels";
import { Editor } from "./Editor";

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

	const cols = new Set(results?.flatMap((result) => Object.keys(result)));

	return (
		<div className="flex flex-col w-full h-full gap-4 p-4 overflow-auto">
			<div className="flex flex-row justify-between">
				<CaveqlSvg />
				<div className="flex flex-row gap-4">
					<div className="font-black">no data</div>
					<div className="font-light">
						drag n' drop json or csv anywhere (soon)
					</div>
				</div>
			</div>
			<div className="">
				<Editor value={source} onChange={setSource} />
			</div>
			<div className="grow shrink relative">
				<TabGroup>
					<TabList>
						<Tab icon={<TableCellsIcon />}>table</Tab>
						<Tab icon={<CodeBracketIcon />}>parse tree</Tab>
						<Tab icon={<CodeBracketIcon />}>generated</Tab>
					</TabList>
					<TabPanels>
						<TabPanel>
							<table className="w-full table-auto border-collapse">
								<thead>
									<tr className="sticky -top-4 bg-stone-400 text-stone-950">
										{results && results.length > 0 ? (
											Object.keys(results[0]).map((key) => (
												<th key={key} className="px-3 py-1">
													{key}
												</th>
											))
										) : (
											<th className="px-2">No results</th>
										)}
									</tr>
								</thead>
								<tbody>
									{results?.map((result, i) => (
										<tr
											// biome-ignore lint/suspicious/noArrayIndexKey: no guaranteed key
											key={i}
											className="relative even:bg-stone-900 odd:bg-stone-800 hover:ring-1 hover:ring-amber-600 hover:z-10 hover:text-amber-300"
										>
											{[...cols].map((col, j) => {
												const value = result[col];
												return (
													<td
														// biome-ignore lint/suspicious/noArrayIndexKey: no guaranteed key
														key={j}
														className={clsx(
															"px-3 py-1  hover:bg-amber-900/50 hover:text-amber-100",
															typeof value !== "string" && "text-right",
														)}
													>
														{value !== undefined ? String(value) : null}
													</td>
												);
											})}
										</tr>
									))}
								</tbody>
							</table>
						</TabPanel>
						<TabPanel>
							<pre className="text-wrap break-all overflow-auto">
								{treeString ?? error}
							</pre>
						</TabPanel>
						<TabPanel>
							<pre className="text-wrap break-all overflow-auto">
								{code ?? error}
							</pre>
						</TabPanel>
					</TabPanels>
				</TabGroup>
			</div>
		</div>
	);
}
