import { globMatch } from "./glob";
import { isInside, normalize, validRoot } from "./paths";
import { parseCalls, parsePolicy } from "./policy";
import type { Io, Outcome } from "./types";
import { USAGE } from "./types";

function error(message: string): Outcome {
  return { code: 2, out: "", err: `pathwarden: ${message}\n` };
}

export function main(args: string[], io: Io): Outcome {
  const command = args[0];
  if (command === undefined) {
    return error("missing command (check, match or normalize)");
  }
  if (command === "--help" && args.length === 1) {
    return { code: 0, out: USAGE, err: "" };
  }
  if (command !== "check" && command !== "match" && command !== "normalize") {
    return error(`unknown command "${command}"`);
  }

  const option = args.slice(1).find((argument) => argument.startsWith("-"));
  if (option !== undefined) {
    return error(`unknown option "${option}"`);
  }

  const operands = args.slice(1);
  const required =
    command === "check"
      ? ["POLICY", "CALLS"]
      : command === "match"
        ? ["PATTERN", "PATH"]
        : ["ROOT", "PATH"];
  for (let index = 0; index < required.length; index += 1) {
    if (operands[index] === undefined) {
      return error(`missing ${required[index]}`);
    }
  }
  if (operands.length > required.length) {
    return error("too many arguments");
  }

  if (command === "check") {
    const policyFile = operands[0] as string;
    const callsFile = operands[1] as string;
    const policyRead = io.readFile(policyFile);
    if ("error" in policyRead) {
      return error(`${policyFile.replace(/\\/g, "/")}: ${policyRead.error}`);
    }
    const parsedPolicy = parsePolicy(policyFile, policyRead.text);
    if ("error" in parsedPolicy) {
      return error(parsedPolicy.error);
    }

    const callsRead = io.readFile(callsFile);
    if ("error" in callsRead) {
      return error(`${callsFile.replace(/\\/g, "/")}: ${callsRead.error}`);
    }
    const parsedCalls = parseCalls(callsFile, callsRead.text);
    if ("error" in parsedCalls) {
      return error(parsedCalls.error);
    }

    let allowed = 0;
    let denied = 0;
    const verdicts: string[] = [];
    for (const call of parsedCalls.calls) {
      let decision: "allow" | "deny";
      let reason: string;
      let cleaned: string | undefined;

      if (call.tool === "run") {
        if (call.arg.includes("/")) {
          decision = "deny";
          reason = "not a program name";
        } else {
          const rule = parsedPolicy.policy.rules.find(
            (candidate) => candidate.tool === call.tool && globMatch(candidate.pattern, call.arg),
          );
          decision = rule?.decision ?? parsedPolicy.policy.default;
          reason = rule === undefined ? "default" : `rule ${rule.number}`;
        }
      } else {
        const path = normalize(parsedPolicy.policy.root, call.arg);
        cleaned = path;
        if (!isInside(parsedPolicy.policy.root, cleaned)) {
          decision = "deny";
          reason = "outside root";
        } else {
          const rule = parsedPolicy.policy.rules.find(
            (candidate) => candidate.tool === call.tool && globMatch(candidate.pattern, path),
          );
          decision = rule?.decision ?? parsedPolicy.policy.default;
          reason = rule === undefined ? "default" : `rule ${rule.number}`;
        }
      }

      if (decision === "allow") {
        allowed += 1;
      } else {
        denied += 1;
      }
      const cleanedDisplay = cleaned !== undefined && cleaned !== call.arg ? ` -> ${cleaned}` : "";
      verdicts.push(
        `${call.number} ${call.tool} ${call.arg}${cleanedDisplay}: ${decision} (${reason})`,
      );
    }
    const count = parsedCalls.calls.length;
    verdicts.push(
      `${count} ${count === 1 ? "call" : "calls"}: ${allowed} allowed, ${denied} denied`,
    );
    return { code: denied > 0 ? 1 : 0, out: `${verdicts.join("\n")}\n`, err: "" };
  }

  if (command === "match") {
    const pattern = operands[0] as string;
    const text = operands[1] as string;
    if (pattern === "") {
      return error('invalid pattern ""');
    }
    const matched = globMatch(pattern, text);
    return { code: matched ? 0 : 1, out: matched ? "match\n" : "no match\n", err: "" };
  }

  const root = operands[0] as string;
  const path = operands[1] as string;
  if (!validRoot(root)) {
    return error(`invalid root "${root}"`);
  }
  if (path === "") {
    return error('invalid path ""');
  }
  const result = normalize(root, path);
  if (isInside(root, result)) {
    return { code: 0, out: `${result}\n`, err: "" };
  }
  return { code: 1, out: `outside root: ${result}\n`, err: "" };
}
