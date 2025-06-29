import type * as monaco from "monaco-editor/esm/vs/editor/editor.api";

export const caveqlLanguage: monaco.languages.IMonarchLanguage = {
  defaultToken: "",
  tokenPostfix: ".caveql",

  ignoreCase: false,

  keywords: [""],

  // SPL functions
  functions: [],

  // SPL operators
  operators: ["|"],

  // SPL symbols
  symbols: /[=><!~?:&|+\-*/^%]+/,

  // Escapes
  escapes:
    /\\(?:[abfnrtv\\"']|x[0-9A-Fa-f]{1,4}|u[0-9A-Fa-f]{4}|U[0-9A-Fa-f]{8})/,

  // The main tokenizer
  tokenizer: {
    root: [
      // Comments
      [/^\s*#.*$/, "comment"],

      // Whitespace
      { include: "@whitespace" },

      // Pipe character
      [/\|/, "delimiter.pipe"],

      // Field names (with or without quotes)
      [/[a-zA-Z_]\w*(?=\s*=)/, "variable.name"],

      // Keywords, functions, and identifiers
      [
        /[a-zA-Z_]\w*/,
        {
          cases: {
            "@keywords": "keyword",
            "@functions": "support.function",
            "@default": "identifier",
          },
        },
      ],

      // Numbers
      [/\d*\.\d+([eE][-+]?\d+)?/, "number.float"],
      [/0[xX][0-9a-fA-F]+/, "number.hex"],
      [/\d+/, "number"],

      // Delimiters and operators
      [/[{}()[\]]/, "@brackets"],
      [
        /@symbols/,
        {
          cases: {
            "@operators": "operator",
            "@default": "",
          },
        },
      ],

      // Strings
      [/"([^"\\]|\\.)*$/, "string.invalid"], // non-terminated string
      [/"/, "string", "@string_double"],
      [/'/, "string", "@string_single"],

      // Field references with $
      [/\$[a-zA-Z_]\w*\$/, "variable.predefined"],

      // Subsearches
      [/\[/, "delimiter.bracket", "@subsearch"],
    ],

    whitespace: [[/[ \t\r\n]+/, ""]],

    string_double: [
      [/[^\\"]+/, "string"],
      [/@escapes/, "string.escape"],
      [/\\./, "string.escape.invalid"],
      [/"/, "string", "@pop"],
    ],

    string_single: [
      [/[^\\']+/, "string"],
      [/@escapes/, "string.escape"],
      [/\\./, "string.escape.invalid"],
      [/'/, "string", "@pop"],
    ],

    subsearch: [
      [/[^[\]]+/, ""],
      [/\[/, "delimiter.bracket", "@subsearch"],
      [/\]/, "delimiter.bracket", "@pop"],
    ],
  },
};
