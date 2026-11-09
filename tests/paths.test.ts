import { expect, test } from "bun:test";
import { check, type Row } from "./helpers/run";

// biome-ignore format: every row stays on one line
const rows: Row[] = [
  { args: ["normalize", "/", "a"], files: {}, code: 0, out: "/a\n", err: "" },
  { args: ["normalize", "/", "/"], files: {}, code: 0, out: "/\n", err: "" },
  { args: ["normalize", "/", "/a/../.."], files: {}, code: 0, out: "/\n", err: "" },
  { args: ["normalize", "/work", "src/a.txt"], files: {}, code: 0, out: "/work/src/a.txt\n", err: "" },
  { args: ["normalize", "/work", "./a//b/./c"], files: {}, code: 0, out: "/work/a/b/c\n", err: "" },
  { args: ["normalize", "/work", "a/../b"], files: {}, code: 0, out: "/work/b\n", err: "" },
  { args: ["normalize", "/work", "a/../../b"], files: {}, code: 1, out: "outside root: /b\n", err: "" },
  { args: ["normalize", "/work", ".."], files: {}, code: 1, out: "outside root: /\n", err: "" },
  { args: ["normalize", "/work", "../work/x"], files: {}, code: 0, out: "/work/x\n", err: "" },
  { args: ["normalize", "/work", "../workshop"], files: {}, code: 1, out: "outside root: /workshop\n", err: "" },
  { args: ["normalize", "/work", "/work/"], files: {}, code: 0, out: "/work\n", err: "" },
  { args: ["normalize", "/work", "/work/.."], files: {}, code: 1, out: "outside root: /\n", err: "" },
  { args: ["normalize", "/work", "/workshop/x"], files: {}, code: 1, out: "outside root: /workshop/x\n", err: "" },
  { args: ["normalize", "/work", "//work//x"], files: {}, code: 0, out: "/work/x\n", err: "" },
  { args: ["normalize", "/work", "/a/b/../../work/c"], files: {}, code: 0, out: "/work/c\n", err: "" },
  { args: ["normalize", "/a/b", "..//b/c"], files: {}, code: 0, out: "/a/b/c\n", err: "" },
  { args: ["normalize", "/work", "..."], files: {}, code: 0, out: "/work/...\n", err: "" },
  { args: ["normalize", "/work", ""], files: {}, code: 2, out: "", err: "pathwarden: invalid path \"\"\n" },
  { args: ["normalize", "work", "a"], files: {}, code: 2, out: "", err: "pathwarden: invalid root \"work\"\n" },
];

for (const [index, row] of rows.entries()) {
  test(`row ${index + 1}`, () => {
    expect(check(row)).toEqual(row);
  });
}
