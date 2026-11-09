import { main } from "../../src/main";
import type { Io } from "../../src/types";

export interface Row {
  args: string[];
  files: Record<string, string>;
  code: number;
  out: string;
  err: string;
}

/**
 * Runs the program on a row's arguments and files and returns the row it actually produced.
 * `files` maps a file name to its text; a name that is not in it cannot be read.
 */
export function check(row: Row): Row {
  const io: Io = {
    readFile: (path) =>
      Object.hasOwn(row.files, path)
        ? { text: row.files[path] as string }
        : { error: "cannot read the file" },
  };
  const outcome = main(row.args, io);
  return {
    args: row.args,
    files: row.files,
    code: outcome.code,
    out: outcome.out,
    err: outcome.err,
  };
}
