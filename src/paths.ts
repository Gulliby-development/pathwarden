/**
 * Reports whether root is an already-normalized absolute POSIX path.
 */
export function validRoot(root: string): boolean {
  if (root === "/") {
    return true;
  }
  if (!root.startsWith("/") || root.endsWith("/")) {
    return false;
  }

  const segments = root.slice(1).split("/");
  return segments.every((segment) => segment !== "" && segment !== "." && segment !== "..");
}

/**
 * Resolves path as POSIX text against root, dropping redundant segments and
 * clamping parent traversal at the filesystem root.
 */
export function normalize(root: string, path: string): string {
  const source = path.startsWith("/") ? path : root === "/" ? `/${path}` : `${root}/${path}`;
  const segments: string[] = [];

  for (const segment of source.split("/")) {
    if (segment === "" || segment === ".") {
      continue;
    }
    if (segment === "..") {
      segments.pop();
      continue;
    }
    segments.push(segment);
  }

  return segments.length === 0 ? "/" : `/${segments.join("/")}`;
}

/**
 * Tests POSIX slash-boundary containment without interpreting host paths.
 */
export function isInside(root: string, path: string): boolean {
  return root === "/" || path === root || path.startsWith(`${root}/`);
}
