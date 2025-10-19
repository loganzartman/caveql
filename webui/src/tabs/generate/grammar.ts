export const grammarGBNF = String.raw`
root ::= pipeline
pipeline ::= "|" ws command ("\n" "|" ws command)*
command ::= rex-command | search-command | stats-command | sort-command

rex-command ::= "rex" ws "field" ws? "=" ws? string ws quoted-string

search-command ::= "search" ws search-expression
search-expression ::= search-term (ws search-term)*
search-term ::= search-comparison
search-comparison ::= string ws? search-comparator ws? value
search-comparator ::= "=" | "!=" | "<" | "<=" | ">" | ">="

sort-command ::= "sort" ws sort-term (ws? "," ws? sort-term)*
sort-term ::= ("-" | "+")? ws? string

stats-command ::= "stats" ws stats-term ((ws | ws? "," ws?) stats-term)*
stats-term ::= "count"

value ::= string | number
string ::= bare-string | quoted-string
bare-string ::= [a-zA-Z0-9_\-$.]+
quoted-string ::= "\"" ([^"\\] | "\\\"")* "\""
number ::= "-"? [0-9]+ ("." [0-9]+)?
ws ::= [ ]
`;
