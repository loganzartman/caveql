export const grammarGBNF = String.raw`
root ::= query
query ::= ((("|" ws*)? "search" ws+)? search-expression?)? (ws* "|" ws* command ws*)* ws*

command ::= search-command | where-command | rex-command | stats-command | sort-command | eval-command | fields-command | head-command | makeresults-command | streamstats-command

rex-command ::= "rex" (ws+ rex-option)* ws+ quoted-string
rex-option ::= "field" ws* "=" ws* field-name | "mode" ws* "=" ws* "sed"

search-command ::= "search" ws+ search-expression
search-expression ::= search-or-expression
search-or-expression ::= search-and-expression (ws* "OR" ws* search-and-expression)*
search-and-expression ::= search-unary-expression (ws* "AND" ws* search-unary-expression)*
search-unary-expression ::= "NOT" ws* search-unary-expression | search-primary
search-primary ::= search-group | search-comparison | search-string | number | "*"
search-group ::= "(" ws* search-expression ws* ")"
search-comparison ::= field-name ws* search-comparator ws* search-value
search-comparator ::= "=" | "!=" | "<" | "<=" | ">" | ">="
search-value ::= search-string | number
search-string ::= quoted-string | bare-search-string
bare-search-string ::= [A-Za-z_$][A-Za-z0-9_$\-.]*

sort-command ::= "sort" ws+ sort-args
sort-args ::= sort-count? ws* sort-field (ws* "," ws* sort-field)*
sort-count ::= number
sort-field ::= sort-direction? ws* sort-field-body
sort-direction ::= "-" | "+"
sort-field-body ::= comparator-call | field-name
comparator-call ::= comparator-name ws* "(" ws* field-name ws* ")"
comparator-name ::= "auto" | "str" | "ip" | "num"

stats-command ::= "stats" ws+ aggregation-list (ws+ groupby-clause)?
streamstats-command ::= "streamstats" ws+ aggregation-list (ws+ groupby-clause)?
aggregation-list ::= aggregation-term ((ws+ | ws* "," ws*) aggregation-term)*
aggregation-term ::= aggregation-function-call
aggregation-function-call ::= aggregation-function (ws* "(" ws* field-name ws* ")")? (ws+ "as" ws+ field-name)?
aggregation-function ::= "count" | "distinct" | "sum" | "avg" | "min" | "max" | "mode" | "median" | "perc"
groupby-clause ::= "by" ws+ field-name (ws* ("," | ws) ws* field-name)*

where-command ::= "where" ws+ expression

fields-command ::= "fields" ws+ fields-args
fields-args ::= fields-modifier? ws* field-name (ws* "," ws* field-name)*
fields-modifier ::= "+" | "-"

makeresults-command ::= "makeresults" (ws+ makeresults-param)*
makeresults-param ::= makeresults-count | makeresults-format | makeresults-data
makeresults-count ::= "count" ws* "=" ws* number
makeresults-format ::= "format" ws* "=" ws* ("csv" | "json")
makeresults-data ::= "data" ws* "=" ws* string

eval-command ::= "eval" ws+ eval-binding (ws* "," ws* eval-binding)*
eval-binding ::= field-name ws* "=" ws* expression

expression ::= or-expression
or-expression ::= and-expression (ws* "or" ws* and-expression)*
and-expression ::= equality-expression (ws* "and" ws* equality-expression)*
equality-expression ::= comparison-expression (ws* equality-operator ws* comparison-expression)*
equality-operator ::= "!=" | "==" | "="
comparison-expression ::= additive-expression (ws* comparison-operator ws* additive-expression)*
comparison-operator ::= "<" | "<=" | ">" | ">="
additive-expression ::= multiplicative-expression (ws* additive-operator ws* multiplicative-expression)*
additive-operator ::= "+" | "-" | "."
multiplicative-expression ::= unary-expression (ws* multiplicative-operator ws* unary-expression)*
multiplicative-operator ::= "*" | "/" | "%"
unary-expression ::= "not" ws* unary-expression | primary-expression
primary-expression ::= function-call | group | number | string | field-name
group ::= "(" ws* expression ws* ")"
function-call ::= builtin-function ws* "(" ws* argument-list? ws* ")"
argument-list ::= expression (ws* "," ws* expression)*
builtin-function ::= "case" | "coalesce" | "false" | "if" | "isnull" | "isnum" | "len" | "match" | "null" | "random" | "replace" | "round" | "true" | "$lit"

head-command ::= "head" (ws+ head-arg)* (ws+ (group | number))?
head-arg ::= ("limit" ws* "=" ws* number) | ("keeplast" ws* "=" ws* ("true" | "false")) | ("null" ws* "=" ws* ("true" | "false"))

field-name ::= bare-field-name | quoted-string
bare-field-name ::= [A-Za-z0-9_$][A-Za-z0-9_$\-.]*

string ::= quoted-string
quoted-string ::= double-quoted-string | single-quoted-string
double-quoted-string ::= "\"" ([^"\\] | "\\\"")* "\""
single-quoted-string ::= "'" ([^'\\] | "\\'")* "'"

number ::= "-"? [0-9]+ ("." [0-9]+)?
ws ::= [ \t\n\r]
`;
