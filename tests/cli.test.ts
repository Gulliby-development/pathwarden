import { expect, test } from "bun:test";
import { check, type Row } from "./helpers/run";

// biome-ignore format: every row stays on one line
const rows: Row[] = [
  { args: [], files: {}, code: 2, out: "", err: "pathwarden: missing command (check, match or normalize)\n" },
  { args: ["bogus"], files: {}, code: 2, out: "", err: "pathwarden: unknown command \"bogus\"\n" },
  { args: ["Check", "p", "c"], files: {}, code: 2, out: "", err: "pathwarden: unknown command \"Check\"\n" },
  { args: ["--help"], files: {}, code: 0, out: "usage: pathwarden check POLICY CALLS\n       pathwarden match PATTERN PATH\n       pathwarden normalize ROOT PATH\n", err: "" },
  { args: ["--help", "check"], files: {}, code: 2, out: "", err: "pathwarden: unknown command \"--help\"\n" },
  { args: ["check", "--help"], files: {}, code: 2, out: "", err: "pathwarden: unknown option \"--help\"\n" },
  { args: ["match"], files: {}, code: 2, out: "", err: "pathwarden: missing PATTERN\n" },
  { args: ["match", "/a"], files: {}, code: 2, out: "", err: "pathwarden: missing PATH\n" },
  { args: ["match", "/a", "/a", "/a"], files: {}, code: 2, out: "", err: "pathwarden: too many arguments\n" },
  { args: ["normalize", "/work"], files: {}, code: 2, out: "", err: "pathwarden: missing PATH\n" },
  { args: ["check", "p.txt"], files: {}, code: 2, out: "", err: "pathwarden: missing CALLS\n" },
  { args: ["match", "-x", "/a"], files: {}, code: 2, out: "", err: "pathwarden: unknown option \"-x\"\n" },
];

for (const [index, row] of rows.entries()) {
  test(`row ${index + 1}`, () => {
    expect(check(row)).toEqual(row);
  });
}
