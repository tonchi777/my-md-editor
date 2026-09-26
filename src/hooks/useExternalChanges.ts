import { useEffect, useRef } from "react";
import { exists, readTextFile, watch } from "@tauri-apps/plugin-fs";
import { normalizePath, parentDir, samePath } from "../lib/markdownFiles";
import type { Tab } from "../types";

export type DiskState = { content: string } | { deleted: true };

// Watches the folders containing open files and reports the on-disk state of any open file that
// changes. Watching the parent folder (not the file) survives editors that save by replacing the file.
export function useExternalChanges(tabs: Tab[], onDiskChange: (path: string, disk: DiskState) => void) {
  const onDiskChangeRef = useRef(onDiskChange);
  onDiskChangeRef.current = onDiskChange;

  const paths = tabs.map(t => t.path).filter((p): p is string => !!p);
  const pathsRef = useRef(paths);
  pathsRef.current = paths;

  // Re-subscribe only when the set of watched folders changes, not on every keystroke.
  const dirsKey = [...new Set(paths.map(p => normalizePath(parentDir(p))))].sort().join("\n");

  useEffect(() => {
    if (!dirsKey) return;
    const dirs = new Map<string, string>();
    for (const p of pathsRef.current) dirs.set(normalizePath(parentDir(p)), parentDir(p));

    const timers = new Map<string, ReturnType<typeof setTimeout>>();
    const check = async (path: string) => {
      try {
        onDiskChangeRef.current(path, { content: await readTextFile(path) });
      } catch {
        const stillThere = await exists(path).catch(() => true);
        if (!stillThere) onDiskChangeRef.current(path, { deleted: true });
      }
    };
    // Several events usually arrive for one save; check each file once per burst.
    const schedule = (path: string) => {
      const key = normalizePath(path);
      clearTimeout(timers.get(key));
      timers.set(key, setTimeout(() => { timers.delete(key); check(path); }, 100));
    };

    let cancelled = false;
    const unwatchers: (() => void)[] = [];
    for (const dir of dirs.values()) {
      watch(dir, event => {
        if (typeof event.type === "object" && "access" in event.type) return;
        for (const changed of event.paths) {
          const open = pathsRef.current.find(p => samePath(p, changed));
          if (open) schedule(open);
        }
      }, { delayMs: 500 })
        .then(unwatch => { if (cancelled) unwatch(); else unwatchers.push(unwatch); })
        .catch(() => { /* watching unsupported or denied — changes just won't be detected */ });
    }

    return () => {
      cancelled = true;
      unwatchers.forEach(unwatch => unwatch());
      timers.forEach(clearTimeout);
    };
  }, [dirsKey]);
}
