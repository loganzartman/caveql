import CaveqlSvg from "jsx:./caveql.svg";
import {
	ArrowLeftIcon,
	ArrowRightIcon,
	CodeBracketIcon,
	TableCellsIcon,
} from "@heroicons/react/20/solid";
import { clsx } from "clsx";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { formatTree, parseQuery } from "../src";
import { compileQuery } from "../src/compile";
import { formatJS } from "../src/formatJS";
import { Tab } from "./components/Tab";
import { TabGroup } from "./components/TabGroup";
import { TabList } from "./components/TabList";
import { TabPanel } from "./components/TabPanel";
import { TabPanels } from "./components/TabPanels";
import { Editor } from "./Editor";
import type { monaco } from "./monaco";

export function App() {
	const [editorRef, setEditorRef] =
		useState<monaco.editor.IStandaloneCodeEditor | null>(null);
	const [source, setSource] = useState("");
	const [inputRecords, setInputRecords] = useState<Record<string, unknown>[]>(
		[],
	);

	useEffect(() => {
		if (!editorRef) return;
		try {
			const src = atob(window.location.hash.substring(1));
			editorRef.setValue(src);
			setSource(src);
		} catch {
			console.log("Failed to parse document hash");
		}
	}, [editorRef]);

	const updateSource = useCallback((source: string) => {
		history.replaceState(undefined, "", `#${btoa(source)}`);
		setSource(source);
	}, []);

	const countFormatter = useMemo(() => {
		return new Intl.NumberFormat(undefined, {});
	}, []);

	let error: string | null = null;
	let treeString: string | null = null;
	let code: string | null = null;
	let results: Record<string, unknown>[] | null;
	try {
		const tree = parseQuery(source);
		treeString = formatTree(tree);
		const run = compileQuery(tree);
		code = formatJS(run.source);
		results = [...run(inputRecords)];
	} catch (e) {
		error = `Error: ${e instanceof Error ? e.message : String(e)}`;
		results = null;
	}

	const cols = new Set(results?.flatMap((result) => Object.keys(result)));

	return (
		<div className="flex flex-col w-full h-full gap-4 p-4 overflow-auto">
			<div className="flex flex-row justify-between">
				<CaveqlSvg />
				<div className="flex flex-row gap-1 items-center">
					<ArrowRightIcon className="w-[1em]" />
					<span className="font-black">
						{countFormatter.format(inputRecords.length)}
					</span>{" "}
					records in
				</div>
			</div>
			<div className="">
				<Editor editorRef={setEditorRef} onChange={updateSource} />
			</div>
			<div className="grow shrink relative">
				<TabGroup>
					<div className="flex flex-row justify-between">
						<TabList>
							<Tab icon={<TableCellsIcon />}>table</Tab>
							<Tab icon={<CodeBracketIcon />}>parse tree</Tab>
							<Tab icon={<CodeBracketIcon />}>generated</Tab>
						</TabList>
						{results && (
							<div className="shrink-0 flex flex-row gap-1 items-center">
								<ArrowLeftIcon className="w-[1em]" />
								<span className="font-black">
									{countFormatter.format(results.length)}
								</span>{" "}
								results out
							</div>
						)}
					</div>
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
