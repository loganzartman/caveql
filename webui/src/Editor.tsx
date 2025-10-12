import { useEffect, useRef, useState } from "react";
import { monaco } from "./monaco";

export function Editor({
  editorRef,
  onChange,
}: {
  editorRef?: React.Ref<monaco.editor.IStandaloneCodeEditor | null>;
  onChange?: (value: string) => void;
}) {
  const divEl = useRef<HTMLDivElement>(null);
  const internalEditorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(
    null,
  );
  const onChangeRef = useRef(onChange);
  const firstUpdateRef = useRef(false);

  onChangeRef.current = onChange;

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

    firstUpdateRef.current = true;
    const editor = monaco.editor.create(divEl.current, {
      language: "caveql",
      "semanticHighlighting.enabled": true,

      value: "",
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
      theme: "caveql",
      overviewRulerLanes: 0,
      hideCursorInOverviewRuler: true,
      overviewRulerBorder: false,
      lineNumbers: "off",
      padding: {
        top: 8,
        bottom: 8,
      },

      fontFamily: "Monaspace Neon Var",
      fontSize: 18,
    });

    internalEditorRef.current = editor;
    if (editorRef) {
      if (typeof editorRef === "function") {
        editorRef(editor);
      } else {
        editorRef.current = editor;
      }
    }

    editor.onDidContentSizeChange((event) => {
      const { contentHeight } = event;
      if (divEl.current) {
        divEl.current.style.height = `${contentHeight}px`;
      }
    });

    editor.onDidChangeModelContent(() => {
      if (firstUpdateRef.current) {
        firstUpdateRef.current = false;
        return;
      }
      onChangeRef.current?.(editor.getValue());
    });

    editor.focus();

    return () => {
      editor.dispose();
    };
  }, [fontsLoaded, editorRef]);

  return <div className="w-full h-full min-h-28" ref={divEl}></div>;
}
