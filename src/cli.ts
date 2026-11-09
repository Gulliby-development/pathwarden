// Command-line entry of pathwarden: reads files as UTF-8 text and hands them to main().
import { readFileSync } from "node:fs";
import { main } from "./main";
import type { Io, Read } from "./types";

const io: Io = {
  readFile(path: string): Read {
    try {
      return { text: new TextDecoder("utf-8", { fatal: true }).decode(readFileSync(path)) };
    } catch (error) {
      const invalid = error instanceof TypeError;
      return { error: invalid ? "input is not valid UTF-8" : "cannot read the file" };
    }
  },
};

const outcome = main(process.argv.slice(2), io);
process.stdout.write(outcome.out);
process.stderr.write(outcome.err);
process.exitCode = outcome.code;
