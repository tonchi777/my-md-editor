import { readDir } from "@tauri-apps/plugin-fs";

export const MD_EXT = /\.(md|markdown|txt)$/i;

const SKIP_DIRS = new Set(["node_modules"]);

export function joinPath(dir: string, name: string): string {
  return dir.replace(/[/\\]$/, "") + "/" + name;
}

export function parentDir(path: string): string {
  return path.replace(/[/\\][^/\\]*$/, "");
}

export function baseName(path: string): string {
  return path.split(/[\\/]/).pop() ?? path;
}

// Paths arrive with mixed separators (dialogs use "\", joinPath uses "/"), so compare normalized.
export function normalizePath(path: string): string {
  return path.replace(/\\/g, "/").replace(/\/$/, "").toLowerCase();
}

export function samePath(a: string, b: string): boolean {
  return normalizePath(a) === normalizePath(b);
}

// Recursively collects Markdown files under `root`, skipping hidden entries and node_modules.
export async function listMarkdownFiles(root: string, maxDepth = 8, maxFiles = 5000): Promise<string[]> {
  const files: string[] = [];
  const queue: { dir: string; depth: number }[] = [{ dir: root, depth: 0 }];
  while (queue.length && files.length < maxFiles) {
    const { dir, depth } = queue.shift()!;
    let entries;
    try {
      entries = await readDir(dir);
    } catch {
      continue;
    }
    for (const e of entries) {
      if (!e.name || e.name.startsWith(".")) continue;
      const path = joinPath(dir, e.name);
      if (e.isDirectory) {
        if (depth < maxDepth && !SKIP_DIRS.has(e.name)) queue.push({ dir: path, depth: depth + 1 });
      } else if (MD_EXT.test(e.name)) {
        files.push(path);
      }
    }
  }
  return files;
}
