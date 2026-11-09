type Token =
  | { kind: "literal"; value: string }
  | { kind: "one" }
  | { kind: "segmentStar" }
  | { kind: "star" }
  | { kind: "slashStarSlash" };

function tokenize(pattern: string[]): Token[] {
  const tokens: Token[] = [];
  let index = 0;

  while (index < pattern.length) {
    if (pattern[index] === "/") {
      let starEnd = index + 1;
      while (pattern[starEnd] === "*") starEnd += 1;
      if (starEnd - index - 1 >= 2 && pattern[starEnd] === "/") {
        tokens.push({ kind: "slashStarSlash" });
        index = starEnd + 1;
        continue;
      }
    }

    const character = pattern[index];
    if (character === "?") {
      tokens.push({ kind: "one" });
      index += 1;
    } else if (character === "*") {
      let end = index + 1;
      while (pattern[end] === "*") end += 1;
      tokens.push({ kind: end - index === 1 ? "segmentStar" : "star" });
      index = end;
    } else {
      tokens.push({ kind: "literal", value: character });
      index += 1;
    }
  }

  return tokens;
}

/** Match a glob pattern against the complete text using Unicode code points. */
export function globMatch(pattern: string, text: string): boolean {
  const tokens = tokenize(Array.from(pattern));
  const characters = Array.from(text);
  let reachable = new Array<boolean>(characters.length + 1).fill(false);
  reachable[0] = true;

  for (const token of tokens) {
    const next = new Array<boolean>(characters.length + 1).fill(false);

    if (token.kind === "literal") {
      for (let position = 0; position < characters.length; position += 1) {
        if (reachable[position] && characters[position] === token.value) {
          next[position + 1] = true;
        }
      }
    } else if (token.kind === "one") {
      for (let position = 0; position < characters.length; position += 1) {
        if (reachable[position] && characters[position] !== "/") {
          next[position + 1] = true;
        }
      }
    } else if (token.kind === "segmentStar" || token.kind === "star") {
      for (let start = 0; start <= characters.length; start += 1) {
        if (!reachable[start]) continue;
        next[start] = true;
        for (let end = start; end < characters.length; end += 1) {
          if (token.kind === "segmentStar" && characters[end] === "/") break;
          next[end + 1] = true;
        }
      }
    } else {
      for (let start = 0; start < characters.length; start += 1) {
        if (!reachable[start] || characters[start] !== "/") continue;
        next[start + 1] = true;
        for (let end = start + 1; end < characters.length; end += 1) {
          if (characters[end] === "/") next[end + 1] = true;
        }
      }
    }

    reachable = next;
  }

  return reachable[characters.length] === true;
}
