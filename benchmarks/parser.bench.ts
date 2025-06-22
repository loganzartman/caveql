import {
	barplot,
	bench,
	compact,
	do_not_optimize,
	group,
	type k_state,
	run,
} from "mitata";
import { parseQuery } from "../src/parser.js";

compact(() => {
	barplot(() => {
		group(() => {
			bench("AND clause x$count", function* (state: k_state) {
				const count = state.get("count");
				const clauses = Array.from(
					{ length: count },
					(_, i) => `field${i}="value${i}"`,
				);
				const query = `search ${clauses.join(" and ")}`;
				yield () => do_not_optimize(parseQuery(query));
			}).range("count", 1, 2 ** 8);
		});

		group(() => {
			bench("Nesting depth x$depth", function* (state: k_state) {
				const depth = state.get("depth");
				let query = 'field="value"';
				for (let i = 0; i < depth; i++) {
					query = `(${query})`;
				}
				const finalQuery = `search ${query}`;
				yield () => do_not_optimize(parseQuery(finalQuery));
			}).range("depth", 1, 8, 2);
		});

		group(() => {
			bench("NOT operator chaining x$count", function* (state: k_state) {
				const count = state.get("count");
				let query = 'field="value"';
				for (let i = 0; i < count; i++) {
					query = `not ${query}`;
				}
				const finalQuery = `search ${query}`;
				yield () => do_not_optimize(parseQuery(finalQuery));
			}).range("count", 1, 2 ** 4);
		});

		group(() => {
			bench("Pipeline length x$length", function* (state: k_state) {
				const length = state.get("length");
				const commands = ['search field="value"'];
				for (let i = 1; i < length; i++) {
					commands.push(i % 2 === 1 ? `where count > ${i}` : "stats");
				}
				const query = commands.join(" | ");
				yield () => do_not_optimize(parseQuery(query));
			}).range("length", 1, 2 ** 8);
		});

		group(() => {
			bench("String length scaling x$length", function* (state: k_state) {
				const length = state.get("length");
				const longQuery = `search message="${"x".repeat(length)}"`;
				yield () => do_not_optimize(parseQuery(longQuery));
			}).range("length", 1, 2 ** 10);
		});
	});
});

await run({
	colors: true,
});
