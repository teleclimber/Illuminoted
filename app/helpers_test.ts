import {dateStr } from './helpers.ts';
import { assertEquals} from "https://deno.land/std@0.159.0/testing/asserts.ts";

Deno.test({
	name: "dateStr",
	//ignore: true,
	fn: () => {
		const d = new Date('December 17, 1995 03:24:00');
		const str = dateStr(d);
		assertEquals(str, '1995-Dec-17');

	}
});

Deno.test("escapeSingleQuotes: no quotes", () => {
  assertEquals(escapeSingleQuotes("hello"), "hello");
});

Deno.test("escapeSingleQuotes: single quote", () => {
  assertEquals(escapeSingleQuotes("it's"), "it''s");
});

Deno.test("escapeSingleQuotes: multiple quotes", () => {
  assertEquals(escapeSingleQuotes("don't 'quote' me"), "don''t ''quote'' me");
});

Deno.test("escapeSingleQuotes: only quote", () => {
  assertEquals(escapeSingleQuotes("'"), "''");
});

Deno.test("escapeSingleQuotes: empty string", () => {
  assertEquals(escapeSingleQuotes(""), "");
});

Deno.test("escapeSingleQuotes: two consecutive quotes", () => {
  assertEquals(escapeSingleQuotes("two '' consec"), "two '''' consec");
});

Deno.test("escapeSingleQuotes: three consecutive quotes", () => {
  assertEquals(escapeSingleQuotes("three ''' consec"), "three '''''' consec");
});