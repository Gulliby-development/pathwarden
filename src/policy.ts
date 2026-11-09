import { validRoot } from "./paths";
import type { Tool } from "./types";

export type Decision = "allow" | "deny";

export interface Rule {
  number: number;
  tool: Tool;
  pattern: string;
  decision: Decision;
}

export interface Call {
  number: number;
  tool: Tool;
  arg: string;
}

export interface Policy {
  root: string;
  default: Decision;
  rules: Rule[];
}

export type ParsePolicyResult = { policy: Policy } | { error: string };
export type ParseCallsResult = { calls: Call[] } | { error: string };

interface SourceLine {
  number: number;
  words: string[];
}

function sourceLines(text: string): SourceLine[] {
  const content = text.startsWith("\uFEFF") ? text.slice(1) : text;
  return content.split("\n").map((raw, index, lines) => {
    const line = index < lines.length - 1 && raw.endsWith("\r") ? raw.slice(0, -1) : raw;
    return {
      number: index + 1,
      words: line.split(/[ \t]+/).filter((word) => word !== ""),
    };
  });
}

function displayName(display: string): string {
  return display.replace(/\\/g, "/");
}

function isTool(value: string): value is Tool {
  return value === "read" || value === "write" || value === "run";
}

function lineError(display: string, line: number, message: string): string {
  return `${displayName(display)}:${line}: ${message}`;
}

export function parsePolicy(display: string, text: string): ParsePolicyResult {
  let root: string | undefined;
  let sawRoot = false;
  let defaultDecision: Decision = "deny";
  let sawDefault = false;
  const rules: Rule[] = [];

  for (const line of sourceLines(text)) {
    const [keyword] = line.words;
    if (keyword === undefined || keyword.startsWith("#")) {
      continue;
    }

    if (keyword === "root") {
      if (sawRoot) {
        return { error: lineError(display, line.number, "second root line") };
      }
      sawRoot = true;
      if (line.words.length !== 2) {
        return { error: lineError(display, line.number, "root needs PATH") };
      }
      const value = line.words[1];
      if (value === undefined || !validRoot(value)) {
        return {
          error: lineError(display, line.number, `invalid root "${line.words[1] ?? ""}"`),
        };
      }
      root = value;
      continue;
    }

    if (keyword === "default") {
      if (sawDefault) {
        return { error: lineError(display, line.number, "second default line") };
      }
      sawDefault = true;
      if (line.words.length !== 2) {
        return {
          error: lineError(display, line.number, "default needs allow or deny"),
        };
      }
      const value = line.words[1];
      if (value !== "allow" && value !== "deny") {
        return {
          error: lineError(display, line.number, `invalid default "${value ?? ""}"`),
        };
      }
      defaultDecision = value;
      continue;
    }

    if (keyword === "allow" || keyword === "deny") {
      if (line.words.length !== 3) {
        return {
          error: lineError(display, line.number, `${keyword} needs TOOL PATTERN`),
        };
      }
      const tool = line.words[1];
      const pattern = line.words[2];
      if (tool === undefined || !isTool(tool)) {
        return {
          error: lineError(display, line.number, `unknown tool "${tool ?? ""}"`),
        };
      }
      if (
        pattern === undefined ||
        (tool === "run" ? pattern.includes("/") : !pattern.startsWith("/"))
      ) {
        return {
          error: lineError(display, line.number, `invalid pattern "${pattern ?? ""}"`),
        };
      }
      rules.push({
        number: rules.length + 1,
        tool,
        pattern,
        decision: keyword,
      });
      continue;
    }

    return {
      error: lineError(display, line.number, `unknown keyword "${keyword}"`),
    };
  }

  if (root === undefined) {
    return { error: `${displayName(display)}: no root line` };
  }
  return { policy: { root, default: defaultDecision, rules } };
}

export function parseCalls(display: string, text: string): ParseCallsResult {
  const calls: Call[] = [];

  for (const line of sourceLines(text)) {
    const [tool, arg] = line.words;
    if (tool === undefined || tool.startsWith("#")) {
      continue;
    }
    if (line.words.length !== 2) {
      return {
        error: lineError(display, line.number, "call needs TOOL ARG"),
      };
    }
    if (!isTool(tool)) {
      return {
        error: lineError(display, line.number, `unknown tool "${tool}"`),
      };
    }
    calls.push({ number: calls.length + 1, tool, arg: arg ?? "" });
  }

  return { calls };
}
