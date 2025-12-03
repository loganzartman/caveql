import { useEffect, useRef, useState } from "react";
import { monaco } from "./monaco";

export function Editor({
  editorRef,
  onChange,
  value,
  language = "caveql",
  readOnly = false,
}: {
  editorRef?: React.Ref<monaco.editor.IStandaloneCodeEditor | null>;
  onChange?: (value: string) => void;
  value?: string;
  language?: string;
  readOnly?: boolean;
}) {
  const divEl = useRef<HTMLDivElement>(null);
  const internalEditorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(
    null,
  );
  const onChangeRef = useRef(onChange);
  const firstUpdateRef = useRef(false);
  const valueRef = useRef(value);
  valueRef.current = value;

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
      language,
      "semanticHighlighting.enabled": true,

      value: valueRef.current ?? "",
      minimap: {
        enabled: false,
      },

      // behavior
      automaticLayout: true,
      scrollBeyondLastLine: false,
      scrollbar: {
        alwaysConsumeMouseWheel: false,
      },
      readOnly,
      domReadOnly: readOnly,

      // visual
      theme: "caveql",
      overviewRulerLanes: 0,
      hideCursorInOverviewRuler: true,
      overviewRulerBorder: false,
      lineNumbers: readOnly ? "on" : "off",
      padding: {
        top: 8,
        bottom: 8,
      },
      renderLineHighlight: readOnly ? "none" : "line",

      fontFamily: "Monaspace Neon Var",
      fontSize: readOnly ? 14 : 18,
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

    if (!readOnly) {
      editor.focus();
    }

    return () => {
      editor.dispose();
    };
  }, [fontsLoaded, editorRef, language, readOnly]);

  // Update value when it changes externally (for controlled read-only editors)
  useEffect(() => {
    const editor = internalEditorRef.current;
    if (editor && value !== undefined && editor.getValue() !== value) {
      editor.setValue(value);
    }
  }, [value]);

  return <div className="w-full h-full min-h-28" ref={divEl}></div>;
}
