export const grammarGBNF = String.raw`
root ::= query
query ::= ((("|" ws*)? "search" ws+)? search-expression?)? (ws* "|" ws* command ws*)*

command ::= search-command | where-command | rex-command | stats-command | sort-command

rex-command ::= "rex" ws+ "field" ws* "=" ws* string ws quoted-string

search-command ::= "search" ws search-expression
search-expression ::= search-term (ws+ search-term)*
search-term ::= search-comparison | value | "*"
search-comparison ::= string ws* search-comparator ws* value
search-comparator ::= "=" | "!=" | "<" | "<=" | ">" | ">="

sort-command ::= "sort" ws+ sort-term (ws* "," ws* sort-term)*
sort-term ::= ("-" | "+")? ws* string

stats-command ::= "stats" ws+ stats-term ((ws+ | ws* "," ws*) stats-term)*
stats-term ::= stats-function-call
stats-function-call ::= stats-function (ws* "(" ws* (string | "*") ws* ")")?
stats-function ::= "count" | "sum" | "avg" | "min" | "max" | "median"

where-command ::= "where" ws+ where-expression
where-expression ::= where-term | where-binary-operation
where-binary-operation ::= where-term ws+ where-binary-operator ws+ where-expression
where-binary-operator ::= "and" | "or" | "=" | "==" | "!=" | "<" | "<=" | ">" | ">="
where-term ::= value

value ::= string | number
string ::= bare-string | quoted-string
bare-string ::= [a-zA-Z0-9_\-$.]+
quoted-string ::= "\"" ([^"\\] | "\\\"")* "\""
number ::= "-"? [0-9]+ ("." [0-9]+)?
ws ::= [ \t\n\r]
`;
