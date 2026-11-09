import { expect, test } from "bun:test";
import { check, type Row } from "./helpers/run";

// biome-ignore format: every row stays on one line
const rows: Row[] = [
  { args: ["check", "p.txt", "c.txt"], files: {"p.txt": "", "c.txt": "read /work/a\n"}, code: 2, out: "", err: "pathwarden: p.txt: no root line\n" },
  { args: ["check", "p.txt", "c.txt"], files: {"p.txt": "root /work # c\n", "c.txt": "read /work/a\n"}, code: 2, out: "", err: "pathwarden: p.txt:1: root needs PATH\n" },
  { args: ["check", "p.txt", "c.txt"], files: {"p.txt": "root\n", "c.txt": "read /work/a\n"}, code: 2, out: "", err: "pathwarden: p.txt:1: root needs PATH\n" },
  { args: ["check", "p.txt", "c.txt"], files: {"p.txt": "root /work /x\n", "c.txt": "read /work/a\n"}, code: 2, out: "", err: "pathwarden: p.txt:1: root needs PATH\n" },
  { args: ["check", "p.txt", "c.txt"], files: {"p.txt": "root work\n", "c.txt": "read /work/a\n"}, code: 2, out: "", err: "pathwarden: p.txt:1: invalid root \"work\"\n" },
  { args: ["check", "p.txt", "c.txt"], files: {"p.txt": "root /work/\n", "c.txt": "read /work/a\n"}, code: 2, out: "", err: "pathwarden: p.txt:1: invalid root \"/work/\"\n" },
  { args: ["check", "p.txt", "c.txt"], files: {"p.txt": "root /a/./b\n", "c.txt": "read /work/a\n"}, code: 2, out: "", err: "pathwarden: p.txt:1: invalid root \"/a/./b\"\n" },
  { args: ["check", "p.txt", "c.txt"], files: {"p.txt": "root /a//b\n", "c.txt": "read /work/a\n"}, code: 2, out: "", err: "pathwarden: p.txt:1: invalid root \"/a//b\"\n" },
  { args: ["check", "p.txt", "c.txt"], files: {"p.txt": "root /work\nroot /work\n", "c.txt": "read /work/a\n"}, code: 2, out: "", err: "pathwarden: p.txt:2: second root line\n" },
  { args: ["check", "p.txt", "c.txt"], files: {"p.txt": "root /work\ndefault\n", "c.txt": "read /work/a\n"}, code: 2, out: "", err: "pathwarden: p.txt:2: default needs allow or deny\n" },
  { args: ["check", "p.txt", "c.txt"], files: {"p.txt": "root /work\ndefault maybe\n", "c.txt": "read /work/a\n"}, code: 2, out: "", err: "pathwarden: p.txt:2: invalid default \"maybe\"\n" },
  { args: ["check", "p.txt", "c.txt"], files: {"p.txt": "root /work\nallow read\n", "c.txt": "read /work/a\n"}, code: 2, out: "", err: "pathwarden: p.txt:2: allow needs TOOL PATTERN\n" },
  { args: ["check", "p.txt", "c.txt"], files: {"p.txt": "root /work\ndeny write /a /b\n", "c.txt": "read /work/a\n"}, code: 2, out: "", err: "pathwarden: p.txt:2: deny needs TOOL PATTERN\n" },
  { args: ["check", "p.txt", "c.txt"], files: {"p.txt": "root /work\nallow exec /a\n", "c.txt": "read /work/a\n"}, code: 2, out: "", err: "pathwarden: p.txt:2: unknown tool \"exec\"\n" },
  { args: ["check", "p.txt", "c.txt"], files: {"p.txt": "root /work\nallow read a\n", "c.txt": "read /work/a\n"}, code: 2, out: "", err: "pathwarden: p.txt:2: invalid pattern \"a\"\n" },
  { args: ["check", "p.txt", "c.txt"], files: {"p.txt": "root /work\nrun git\n", "c.txt": "read /work/a\n"}, code: 2, out: "", err: "pathwarden: p.txt:2: unknown keyword \"run\"\n" },
  { args: ["check", "p.txt", "c.txt"], files: {"p.txt": "root /work\nAllow read /a\n", "c.txt": "read /work/a\n"}, code: 2, out: "", err: "pathwarden: p.txt:2: unknown keyword \"Allow\"\n" },
  { args: ["check", "p.txt", "c.txt"], files: {"p.txt": "root /work\nallow read /a\nallow write /b\nbogus x\n", "c.txt": "read /work/a\n"}, code: 2, out: "", err: "pathwarden: p.txt:4: unknown keyword \"bogus\"\n" },
  { args: ["check", "p.txt", "c.txt"], files: {"c.txt": "read a\n"}, code: 2, out: "", err: "pathwarden: p.txt: cannot read the file\n" },
  { args: ["check", "p.txt", "c.txt"], files: {"p.txt": "root /work\n"}, code: 2, out: "", err: "pathwarden: c.txt: cannot read the file\n" },
  { args: ["check", "dir\\p.txt", "c.txt"], files: {"c.txt": "read a\n"}, code: 2, out: "", err: "pathwarden: dir/p.txt: cannot read the file\n" },
  { args: ["check", "p.txt", "c.txt"], files: {"p.txt": "root /work\n", "c.txt": "read\n"}, code: 2, out: "", err: "pathwarden: c.txt:1: call needs TOOL ARG\n" },
  { args: ["check", "p.txt", "c.txt"], files: {"p.txt": "root /work\n", "c.txt": "exec ls\n"}, code: 2, out: "", err: "pathwarden: c.txt:1: unknown tool \"exec\"\n" },
  { args: ["check", "p.txt", "c.txt"], files: {"p.txt": "root /work\n", "c.txt": "# one\n\nread a\nwrite\n"}, code: 2, out: "", err: "pathwarden: c.txt:4: call needs TOOL ARG\n" },
];

for (const [index, row] of rows.entries()) {
  test(`row ${index + 1}`, () => {
    expect(check(row)).toEqual(row);
  });
}
