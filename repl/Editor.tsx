import { useEffect, useRef, useState } from "react";
import { monaco } from "./monaco";

export function Editor({
	value,
	onChange,
}: {
	value?: string;
	onChange?: (value: string) => void;
}) {
	const divEl = useRef<HTMLDivElement>(null);
	const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
	const onChangeRef = useRef(onChange);
	const valueRef = useRef(value);

	onChangeRef.current = onChange;
	valueRef.current = value;

	const [fontsLoaded, setFontsLoaded] = useState(false);
	useState(() => {
		Promise.all([document.fonts.load("1em 'Monaspace Neon Var'")]).then(() =>
			setFontsLoaded(true),
		);
	});

	useEffect(() => {
		if (!fontsLoaded) return;
		if (!divEl.current) {
			throw new Error("divEl is not defined");
		}

		const editor = monaco.editor.create(divEl.current, {
			value: valueRef.current ?? "",
			placeholder: "Enter your query here...",
			minimap: {
				enabled: false,
			},

			// behavior
			automaticLayout: true,
			scrollBeyondLastLine: false,
			scrollbar: {
				alwaysConsumeMouseWheel: false,
			},

			// visual
			theme: "vs-dark",
			overviewRulerLanes: 0,
			hideCursorInOverviewRuler: true,
			overviewRulerBorder: false,
			lineNumbers: "off",

			fontFamily: "Monaspace Neon Var",
			fontSize: 18,
		});

		editorRef.current = editor;

		editor.onDidContentSizeChange((event) => {
			const { contentHeight } = event;
			if (divEl.current) {
				divEl.current.style.height = `${contentHeight}px`;
			}
		});

		editor.onDidChangeModelContent((event) => {
			onChangeRef.current?.(editor.getValue());
		});

		editor.focus();

		return () => {
			editor.dispose();
		};
	}, [fontsLoaded]);

	useEffect(() => {
		if (editorRef.current && value !== undefined) {
			editorRef.current.executeEdits("", [
				{
					range: editorRef.current.getModel()!.getFullModelRange(),
					text: value,
					forceMoveMarkers: true,
				},
			]);
			editorRef.current.pushUndoStop();
		}
	}, [value]);

	return <div className="w-full h-full min-h-32" ref={divEl}></div>;
}
