import { useState, useCallback, useEffect } from "react";
import { FolderOpen, Folder, FileText, ChevronLeft, RefreshCw } from "lucide-react";
import { open } from "@tauri-apps/plugin-dialog";
import { readDir, watch, type WatchEvent } from "@tauri-apps/plugin-fs";
import { MD_EXT, baseName, joinPath } from "../lib/markdownFiles";

interface FolderSidebarProps {
  rootDir: string | null;
  onRootDirChange: (dir: string) => void;
  onOpenFile: (path: string) => void;
}

interface Entry {
  name: string;
  path: string;
  isDirectory: boolean;
}

// Only listing changes matter: creates, removes, and renames — not reads or content edits.
function affectsListing(event: WatchEvent): boolean {
  const t = event.type;
  if (typeof t !== "object") return true;
  if ("access" in t) return false;
  if ("modify" in t) return t.modify.kind === "rename";
  return true;
}

export function FolderSidebar({ rootDir: initialRoot, onRootDirChange, onOpenFile }: FolderSidebarProps) {
  // The root folder lives in App so it survives the sidebar being hidden; subfolder navigation is local.
  const [dirStack, setDirStack] = useState<string[]>(() => initialRoot ? [initialRoot] : []);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(false);

  const currentDir = dirStack[dirStack.length - 1] ?? null;
  const rootDir = dirStack[0] ?? null;

  const loadDir = useCallback(async (path: string, silent = false) => {
    if (!silent) setLoading(true);
    try {
      const raw = await readDir(path);
      const parsed: Entry[] = raw
        .filter(e => e.name && !e.name.startsWith("."))
        .map(e => ({
          name: e.name!,
          path: joinPath(path, e.name!),
          isDirectory: e.isDirectory ?? false,
        }))
        .filter(e => e.isDirectory || MD_EXT.test(e.name))
        .sort((a, b) => {
          if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1;
          return a.name.localeCompare(b.name);
        });
      setEntries(parsed);
    } catch {
      setEntries([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (initialRoot) loadDir(initialRoot);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-refresh the listing when files are added, removed, or renamed on disk.
  useEffect(() => {
    if (!currentDir) return;
    let unwatch: (() => void) | null = null;
    let cancelled = false;
    watch(currentDir, event => {
      if (affectsListing(event)) loadDir(currentDir, true);
    }, { delayMs: 300 })
      .then(fn => { if (cancelled) fn(); else unwatch = fn; })
      .catch(() => { /* watching unsupported or denied — manual refresh still works */ });
    return () => {
      cancelled = true;
      unwatch?.();
    };
  }, [currentDir, loadDir]);

  const openFolder = useCallback(async () => {
    const selected = await open({ directory: true, multiple: false });
    if (typeof selected !== "string") return;
    setDirStack([selected]);
    loadDir(selected);
    onRootDirChange(selected);
  }, [loadDir, onRootDirChange]);

  const navigateInto = useCallback((entry: Entry) => {
    setDirStack(s => [...s, entry.path]);
    loadDir(entry.path);
  }, [loadDir]);

  const navigateBack = useCallback(() => {
    setDirStack(s => {
      const next = s.slice(0, -1);
      if (next.length) loadDir(next[next.length - 1]);
      else setEntries([]);
      return next;
    });
  }, [loadDir]);

  const folderName = currentDir ? baseName(currentDir) : null;
  const rootName = rootDir ? baseName(rootDir) : null;

  return (
    <>
      <div className="sidebar-header">
        {currentDir && dirStack.length > 1 && (
          <button className="toolbar-btn sidebar-back" onClick={navigateBack} title="Back">
            <ChevronLeft size={14} />
          </button>
        )}
        <span className="sidebar-dir-name" title={currentDir ?? undefined}>
          {folderName ?? rootName ?? "No folder"}
        </span>
        {currentDir && (
          <button className="toolbar-btn" onClick={() => loadDir(currentDir)} title="Refresh folder" disabled={loading}>
            <RefreshCw size={14} />
          </button>
        )}
        <button className="toolbar-btn" onClick={openFolder} title="Open folder">
          <FolderOpen size={14} />
        </button>
      </div>

      <div className="sidebar-files">
        {loading && <div className="sidebar-empty">Loading…</div>}
        {!loading && !currentDir && (
          <div className="sidebar-empty">Open a folder to browse files</div>
        )}
        {!loading && currentDir && entries.length === 0 && (
          <div className="sidebar-empty">No markdown files found</div>
        )}
        {!loading && entries.map(entry => (
          <button
            key={entry.path}
            className="sidebar-item"
            title={entry.path}
            onClick={() => entry.isDirectory ? navigateInto(entry) : onOpenFile(entry.path)}
          >
            {entry.isDirectory
              ? <Folder size={14} className="sidebar-icon" />
              : <FileText size={14} className="sidebar-icon" />
            }
            <span className="sidebar-item-name">{entry.name}</span>
          </button>
        ))}
      </div>
    </>
  );
}
