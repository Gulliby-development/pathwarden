import { expect, test } from "bun:test";
import { check, type Row } from "./helpers/run";

// biome-ignore format: every row stays on one line
const rows: Row[] = [
  { args: ["match", "/a/b", "/a/b"], files: {}, code: 0, out: "match\n", err: "" },
  { args: ["match", "/a/b", "/a/c"], files: {}, code: 1, out: "no match\n", err: "" },
  { args: ["match", "/a/*", "/a/b"], files: {}, code: 0, out: "match\n", err: "" },
  { args: ["match", "/a/*", "/a/"], files: {}, code: 0, out: "match\n", err: "" },
  { args: ["match", "/a/*", "/a/b/c"], files: {}, code: 1, out: "no match\n", err: "" },
  { args: ["match", "*", "abc"], files: {}, code: 0, out: "match\n", err: "" },
  { args: ["match", "*", ""], files: {}, code: 0, out: "match\n", err: "" },
  { args: ["match", "*", "a/b"], files: {}, code: 1, out: "no match\n", err: "" },
  { args: ["match", "**", "a/b"], files: {}, code: 0, out: "match\n", err: "" },
  { args: ["match", "/a/**", "/a/b/c"], files: {}, code: 0, out: "match\n", err: "" },
  { args: ["match", "/a/**", "/a/"], files: {}, code: 0, out: "match\n", err: "" },
  { args: ["match", "/a/**/b", "/a/b"], files: {}, code: 0, out: "match\n", err: "" },
  { args: ["match", "/a/**/b", "/a/x/y/b"], files: {}, code: 0, out: "match\n", err: "" },
  { args: ["match", "/a/**/b", "/ab"], files: {}, code: 1, out: "no match\n", err: "" },
  { args: ["match", "/a/***", "/a/x/y"], files: {}, code: 0, out: "match\n", err: "" },
  { args: ["match", "/a/?", "/a/b"], files: {}, code: 0, out: "match\n", err: "" },
  { args: ["match", "/a/?", "/a/bc"], files: {}, code: 1, out: "no match\n", err: "" },
  { args: ["match", "/a/*.txt", "/a/.txt"], files: {}, code: 0, out: "match\n", err: "" },
  { args: ["match", "/a/b*", "/a/b/c"], files: {}, code: 1, out: "no match\n", err: "" },
  { args: ["match", "/**/x", "/x"], files: {}, code: 0, out: "match\n", err: "" },
  { args: ["match", "**/x", "x"], files: {}, code: 1, out: "no match\n", err: "" },
  { args: ["match", "/a.b", "/axb"], files: {}, code: 1, out: "no match\n", err: "" },
  { args: ["match", "/[ab]", "/[ab]"], files: {}, code: 0, out: "match\n", err: "" },
  { args: ["match", "/\u00e9?", "/\u00e9\u4e2d"], files: {}, code: 0, out: "match\n", err: "" },
];

for (const [index, row] of rows.entries()) {
  test(`row ${index + 1}`, () => {
    expect(check(row)).toEqual(row);
  });
}
