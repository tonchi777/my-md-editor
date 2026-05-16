import { useState, useCallback } from "react";
import { FolderOpen, Folder, FileText, ChevronLeft } from "lucide-react";
import { open } from "@tauri-apps/plugin-dialog";
import { readDir } from "@tauri-apps/plugin-fs";

interface FolderSidebarProps {
  onOpenFile: (path: string) => void;
}

interface Entry {
  name: string;
  path: string;
  isDirectory: boolean;
}

const MD_EXT = /\.(md|markdown|txt)$/i;

function joinPath(dir: string, name: string): string {
  return dir.replace(/[/\\]$/, "") + "/" + name;
}

export function FolderSidebar({ onOpenFile }: FolderSidebarProps) {
  const [dirStack, setDirStack] = useState<string[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(false);

  const currentDir = dirStack[dirStack.length - 1] ?? null;
  const rootDir = dirStack[0] ?? null;

  const loadDir = useCallback(async (path: string) => {
    setLoading(true);
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

  const openFolder = useCallback(async () => {
    const selected = await open({ directory: true, multiple: false });
    if (typeof selected !== "string") return;
    setDirStack([selected]);
    loadDir(selected);
  }, [loadDir]);

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

  const folderName = currentDir ? currentDir.split(/[\\/]/).pop() : null;
  const rootName = rootDir ? rootDir.split(/[\\/]/).pop() : null;

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        {currentDir && dirStack.length > 1 && (
          <button className="toolbar-btn sidebar-back" onClick={navigateBack} title="Back">
            <ChevronLeft size={14} />
          </button>
        )}
        <span className="sidebar-dir-name" title={currentDir ?? undefined}>
          {folderName ?? rootName ?? "No folder"}
        </span>
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
    </div>
  );
}
