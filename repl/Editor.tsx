import { useEffect, useRef, useState } from "react";
import { monaco } from "./monaco";

export function Editor() {
	const divEl = useRef<HTMLDivElement>(null);
	const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);

	const [fontsLoaded, setFontsLoaded] = useState(false);
	useState(() => {
		Promise.all([document.fonts.load("400 1em Font Name")]).then(() =>
			setFontsLoaded(true),
		);
	});

	useEffect(() => {
		if (!fontsLoaded) return;
		if (!divEl.current) {
			throw new Error("divEl is not defined");
		}

		const editor = monaco.editor.create(divEl.current, {
			minimap: {
				enabled: false,
			},
			scrollBeyondLastLine: false,
			automaticLayout: true,
			theme: "vs-dark",

			overviewRulerLanes: 0,
			hideCursorInOverviewRuler: true,
			overviewRulerBorder: false,

			fontFamily: "Monaspace Neon Var",
			fontSize: 18,

			placeholder: "type a query...",
		});
		editorRef.current = editor;

		editor.onDidContentSizeChange((event) => {
			const { contentHeight } = event;
			if (divEl.current) {
				divEl.current.style.height = `${contentHeight}px`;
			}
		});

		return () => {
			editor.dispose();
		};
	}, [fontsLoaded]);

	return <div className="w-full h-full min-h-32" ref={divEl}></div>;
}
