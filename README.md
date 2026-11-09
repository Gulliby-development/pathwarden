<p align="center"><img src="docs/logo.svg" width="96" alt="" /></p>

# pathwarden

[![CI](https://github.com/Gulliby-development/pathwarden/actions/workflows/ci.yml/badge.svg)](https://github.com/Gulliby-development/pathwarden/actions/workflows/ci.yml) [![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

pathwarden is a text-only policy checker for people who want to review an AI agent's proposed file and command calls before they run. Give it a policy and a calls list; it reports an ordered allow or deny verdict for each call, including the rule or safety check responsible. It does not execute calls, open paths mentioned in calls, inspect the filesystem, or resolve symlinks. Policy and calls files themselves are read as UTF-8 input.

The checker applies the same POSIX path and glob rules on Windows, macOS, and Linux. It requires Bun 1.1 or newer.

## Install

From the repository directory, install the project dependencies:

```sh
bun install
```

Run a command with Bun:

```sh
bun run src/cli.ts check POLICY CALLS
bun run src/cli.ts match PATTERN PATH
bun run src/cli.ts normalize ROOT PATH
```

## Textual paths

A policy root must be an absolute, already-clean POSIX path: `/` or slash-separated nonempty segments that are not `.` or `..`. For example, `/work` and `/a/b` are valid; `work`, `/work/`, `/a//b`, `/a/./b`, `/a/..` and `//a` are not.

For normalization, a relative input is appended to the root (with the special case that root `/` contributes only one leading slash). An absolute input is used as-is. Empty segments and `.` are discarded, and `..` removes the preceding segment. Parent traversal at the top is clamped at `/`. Other segments are preserved, so `...` and `.hidden` are ordinary names. Matching is case-sensitive, and a backslash is an ordinary character rather than a separator.

Containment means equality with the root, or a path beginning with the root followed by a slash; root `/` contains every normalized absolute path. Thus `/workshop` is not inside `/work`. These operations are string processing only: pathwarden does not check whether a path exists, follow symbolic links, or enforce a filesystem sandbox.

## Glob patterns

Patterns match the entire text, case-sensitively, one Unicode code point at a time:

- `?` matches one character other than `/`.
- A single `*` matches zero or more characters other than `/`.
- A run of two or more stars acts as one `**`, matching zero or more characters including slashes.
- The special sequence `/**/` is recognized before other star rules. It matches either one slash or a slash, any run of characters (including an empty run), and another slash. For example, `/a/**/b` matches `/a/b`, `/a/x/b`, `/a/x/y/b`, and `/a//b`, but not `/ab`. In `/a/**/**/b`, the first sequence consumes through its following slash; the second pair of stars is therefore a standalone `**`.
- All other characters are literal, including brackets and backslashes. There are no character classes or escape syntax.

## Policy file

The policy is read as UTF-8. One leading byte order mark is ignored. Lines are separated by LF; a CR immediately before an LF is removed. Words are separated only by spaces and tabs. Empty lines and lines whose first word begins with `#` are ignored; a hash elsewhere is just part of a word.

Use these directives:

```text
root /work
default deny
allow read /work/**
deny write /work/src/secrets/**
allow run git
```

Exactly one `root PATH` line is required. At most one `default allow` or `default deny` line is permitted; if omitted, the default is deny. Rules use `allow TOOL PATTERN` or `deny TOOL PATTERN`, where TOOL is `read`, `write`, or `run`. For read and write, a pattern must start with `/` and is matched against the cleaned absolute path. For run, the pattern must not contain `/` and is matched against the program name. Rule numbers begin at 1 and count rules in file order; root, default, blank, and comment lines do not count. Rules are considered in order, and the first matching rule for the call's tool wins.

Each invalid line stops parsing at its first problem:

| Line kind | First-error checks, in order |
| --- | --- |
| `root` | A repeated root reports `second root line`; otherwise wrong word count reports `root needs PATH`; otherwise an invalid root reports `invalid root "X"`. |
| `default` | A repeated default reports `second default line`; otherwise wrong word count reports `default needs allow or deny`; otherwise an unsupported value reports `invalid default "X"`. |
| `allow` or `deny` | Wrong word count reports `allow needs TOOL PATTERN` or `deny needs TOOL PATTERN`; then an unsupported tool reports `unknown tool "X"`; then a disallowed pattern reports `invalid pattern "X"`. |
| Any other keyword | Reports `unknown keyword "WORD"`. |

After all lines, a missing root reports `DISPLAY: no root line`. Line-specific errors are `DISPLAY:LINE: MESSAGE`. The displayed filename is the supplied name with backslashes changed to forward slashes. Offending words are quoted as written.

## Calls file

Calls use the same UTF-8, BOM, line-ending, word-separation, blank-line, and comment rules as the policy. Each non-comment line must contain exactly two words: `TOOL ARG`. TOOL must be `read`, `write`, or `run`. Calls are numbered from 1 in file order; a file with no calls is valid.

The first malformed call stops parsing. A wrong number of words reports `call needs TOOL ARG`; an unsupported tool reports `unknown tool "X"`. These use the same `DISPLAY:LINE: MESSAGE` form and filename display conversion as policy errors.

## Commands and errors

The usage text is:

```text
usage: pathwarden check POLICY CALLS
       pathwarden match PATTERN PATH
       pathwarden normalize ROOT PATH
```

Passing only `--help` prints that usage and exits with code 0. Errors are written to standard error as `pathwarden: TEXT`, with no standard output, and exit code 2. Validation order is: no arguments reports `missing command (check, match or normalize)`; an unknown command reports `unknown command "X"`; the first later argument beginning with `-` reports `unknown option "X"` (there are no options); then missing operands, too many operands, and command-specific validation. Missing-operand messages name the expected value, such as `missing POLICY`, `missing CALLS`, `missing PATTERN`, `missing ROOT`, or `missing PATH`. Too many operands report `too many arguments`.

- `check POLICY CALLS` reads and validates the policy first, then reads and validates calls. A read failure is displayed as `DISPLAY: cannot read the file`; invalid UTF-8 is `DISPLAY: input is not valid UTF-8`. The display name uses forward slashes. No verdict is printed unless both files have parsed successfully.
- `match PATTERN PATH` prints `match` and exits 0, or prints `no match` and exits 1. An empty pattern is an error: `invalid pattern ""`.
- `normalize ROOT PATH` validates the root before checking the path. An invalid root reports `invalid root "X"`; an empty path reports `invalid path ""`. An in-root result is printed by itself and exits 0. Otherwise it prints `outside root: RESULT` and exits 1.

Successful output lines end with a line feed. Check exits 1 if any call is denied and 0 otherwise (including an empty calls file). A singular total is written as `1 call`; all other totals use `calls`.

## Verdicts

For read and write calls, pathwarden cleans ARG against the policy root. A path outside that root is denied first, with reason `outside root`, regardless of rules or default. For run calls, an argument containing `/` is denied first with reason `not a program name`. Otherwise, pathwarden applies the first matching rule for the same tool; if none matches, it applies the default. Read and write rules never cross-apply.

A verdict has the form `N TOOL ARG: allow (WHY)` or `N TOOL ARG: deny (WHY)`. WHY is `rule N`, `default`, `outside root`, or `not a program name`. For read and write, when cleaning changes ARG, the output includes ` -> CLEANED` immediately after the original argument, even when the result is outside the root. The final line reports the call total and allowed and denied counts.

## Example

The following transcript is for a POSIX shell, run in the repository directory. It is reproduced as supplied; the commands create and remove the two temporary example files.

```text
$ printf 'root /work\ndefault deny\ndeny write /work/src/secrets/**\nallow read /work/**\nallow write /work/src/**\nallow run git\n' > policy.txt
$ printf 'read src/main.ts\nwrite src/main.ts\nwrite src/secrets/key.pem\nread ../../etc/passwd\nrun git\nrun rm\n' > calls.txt
$ bun run src/cli.ts check policy.txt calls.txt; echo "exit $?"
1 read src/main.ts -> /work/src/main.ts: allow (rule 2)
2 write src/main.ts -> /work/src/main.ts: allow (rule 3)
3 write src/secrets/key.pem -> /work/src/secrets/key.pem: deny (rule 1)
4 read ../../etc/passwd -> /etc/passwd: deny (outside root)
5 run git: allow (rule 4)
6 run rm: deny (default)
6 calls: 3 allowed, 3 denied
exit 1
$ bun run src/cli.ts match 'src/**/test.ts' src/a/b/test.ts
match
$ bun run src/cli.ts match 'src/**/test.ts' src/test.js; echo "exit $?"
no match
exit 1
$ bun run src/cli.ts normalize work x 2>&1; echo "exit $?"
pathwarden: invalid root "work"
exit 2
$ rm policy.txt calls.txt
```

## Development

Run the project checks with:

```sh
bun run typecheck
bun run lint
bun test
```

See [LICENSE](LICENSE) for the MIT license.

---

Built with [BAKED](https://github.com/Gulliby-development/baked), an open-source coding agent (bench round R88).
