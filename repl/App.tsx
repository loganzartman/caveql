import CaveqlSvg from "jsx:./caveql.svg";
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

	return (
		<div className="flex flex-col w-full h-full gap-4 p-4 overflow-auto">
			<div className="flex flex-row justify-between">
				<CaveqlSvg />
				<div className="flex flex-row gap-4">
					<div className="font-black">no input</div>
					<div className="font-light">
						drag n' drop json or csv anywhere (soon)
					</div>
				</div>
			</div>
			<div className="">
				<Editor value={source} onChange={setSource} />
			</div>
			<div className="grow shrink">
				<TabGroup>
					<TabList>
						<Tab>table</Tab>
						<Tab>parse tree</Tab>
						<Tab>generated</Tab>
					</TabList>
					<TabPanels>
						<TabPanel>
							<div className="flex-1/4 grow h-0 overflow-auto">
								<table className="w-full table-auto border-collapse border border-stone-400">
									<thead>
										<tr className="sticky top-0 bg-fg text-bg">
											{results && results.length > 0 ? (
												Object.keys(results[0]).map((key) => (
													<th
														key={key}
														className="border border-stone-300 px-2"
													>
														{key}
													</th>
												))
											) : (
												<th className="border border-stone-300 px-2">
													No results
												</th>
											)}
										</tr>
									</thead>
									<tbody>
										{results?.map((result, i) => (
											// biome-ignore lint/suspicious/noArrayIndexKey: no guaranteed key
											<tr key={i}>
												{Object.values(result).map((value, j) => (
													// biome-ignore lint/suspicious/noArrayIndexKey: no guaranteed key
													<td key={j} className="border border-stone-300 px-2">
														{String(value)}
													</td>
												))}
											</tr>
										))}
									</tbody>
								</table>
							</div>
						</TabPanel>
						<TabPanel>
							<div className="grow flex flex-col gap-2">
								<div>Parse tree:</div>
								<pre className="text-wrap break-all overflow-auto">
									{treeString ?? error}
								</pre>
							</div>
						</TabPanel>
						<TabPanel>
							<div className="grow flex flex-col gap-2">
								<div>Generated code:</div>
								<pre className="text-wrap break-all overflow-auto">
									{code ?? error}
								</pre>
							</div>
						</TabPanel>
					</TabPanels>
				</TabGroup>
			</div>
		</div>
	);
}
