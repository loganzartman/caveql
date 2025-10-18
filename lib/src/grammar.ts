export const grammarGBNF = String.raw`
root ::= search-expression | pipeline
pipeline ::= ("|" ws+ command)+
command ::= search-command | stats-command

search-command ::= "search" ws+ search-expression
search-expression ::= search-term (ws+ search-term)*
search-term ::= string

stats-command ::= "stats" ws+ stats-term ((ws+ | ws* "," ws*) stats-term)*
stats-term ::= "count"

string ::= bare-string
bare-string ::= [^ \t\n\r]+
ws ::= [ \t\n\r]
`;

console.log(grammarGBNF);
