/** What the program needs from its surroundings: main() does no input or output itself. */
export type Read = { text: string } | { error: string };

export interface Io {
  readFile(path: string): Read;
}

export interface Outcome {
  code: number;
  out: string;
  err: string;
}

export const TOOLS = ["read", "write", "run"] as const;
export type Tool = (typeof TOOLS)[number];

export const USAGE =
  "usage: pathwarden check POLICY CALLS\n       pathwarden match PATTERN PATH\n       pathwarden normalize ROOT PATH\n";
