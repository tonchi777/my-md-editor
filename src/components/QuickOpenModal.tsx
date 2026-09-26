import { useEffect, useMemo, useRef, useState } from "react";
import { FileText, Clock } from "lucide-react";
import { baseName, listMarkdownFiles, normalizePath } from "../lib/markdownFiles";
import { fuzzyScore } from "../lib/fuzzyMatch";

interface QuickOpenModalProps {
  rootDir: string | null;
  recentFiles: string[];
  onOpen: (path: string) => void;
  onClose: () => void;
}

interface Item {
  path: string;
  name: string;
  detail: string; // path relative to the folder, or the full path for recent files outside it
  recent: boolean;
}

const MAX_RESULTS = 50;

function relativeTo(root: string, path: string): string | null {
  const r = normalizePath(root) + "/";
  return normalizePath(path).startsWith(r) ? path.slice(r.length).replace(/\\/g, "/") : null;
}

export function QuickOpenModal({ rootDir, recentFiles, onOpen, onClose }: QuickOpenModalProps) {
  const [query, setQuery] = useState("");
  const [folderFiles, setFolderFiles] = useState<string[]>([]);
  const [scanning, setScanning] = useState(!!rootDir);
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
    if (!rootDir) return;
    let cancelled = false;
    listMarkdownFiles(rootDir).then(files => {
      if (cancelled) return;
      setFolderFiles(files);
      setScanning(false);
    });
    return () => { cancelled = true; };
  }, [rootDir]);

  // Recent files first, then the rest of the folder; deduplicated by normalized path.
  const items = useMemo<Item[]>(() => {
    const seen = new Set<string>();
    const out: Item[] = [];
    const add = (path: string, recent: boolean) => {
      const key = normalizePath(path);
      if (seen.has(key)) return;
      seen.add(key);
      const rel = rootDir ? relativeTo(rootDir, path) : null;
      out.push({ path, name: baseName(path), detail: rel ?? path, recent });
    };
    recentFiles.forEach(p => add(p, true));
    folderFiles.forEach(p => add(p, false));
    return out;
  }, [recentFiles, folderFiles, rootDir]);

  const results = useMemo(() => {
    const q = query.trim();
    if (!q) return items.slice(0, MAX_RESULTS);
    return items
      .map(item => {
        const nameScore = fuzzyScore(q, item.name);
        const pathScore = fuzzyScore(q, item.detail);
        const score = Math.max(nameScore === null ? -Infinity : nameScore + 10, pathScore ?? -Infinity);
        return { item, score: score + (item.recent ? 1 : 0) };
      })
      .filter(r => r.score > -Infinity)
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX_RESULTS)
      .map(r => r.item);
  }, [items, query]);

  useEffect(() => { setSelected(0); }, [query]);

  useEffect(() => {
    listRef.current?.children[selected]?.scrollIntoView({ block: "nearest" });
  }, [selected]);

  const choose = (item: Item | undefined) => {
    if (!item) return;
    onOpen(item.path);
    onClose();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelected(s => Math.min(s + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelected(s => Math.max(s - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      choose(results[selected]);
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  let emptyMessage: string | null = null;
  if (results.length === 0) {
    if (scanning) emptyMessage = "Scanning folder…";
    else if (query.trim()) emptyMessage = "No matching files";
    else emptyMessage = "No recent files. Open a folder in the sidebar to search its files.";
  }

  return (
    <div className="modal-backdrop quick-open-backdrop" onClick={onClose}>
      <div
        className="modal quick-open"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Quick open"
      >
        <input
          ref={inputRef}
          className="rename-input quick-open-input"
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={rootDir ? "Search files by name…" : "Search recent files… (open a folder in the sidebar to search it)"}
          role="combobox"
          aria-expanded="true"
          aria-controls="quick-open-list"
        />
        <div className="quick-open-list" id="quick-open-list" role="listbox" ref={listRef}>
          {results.map((item, i) => (
            <button
              key={item.path}
              role="option"
              aria-selected={i === selected}
              className={`quick-open-item${i === selected ? " quick-open-item-selected" : ""}`}
              onMouseMove={() => setSelected(i)}
              onClick={() => choose(item)}
              title={item.path}
            >
              {item.recent
                ? <Clock size={14} className="sidebar-icon" />
                : <FileText size={14} className="sidebar-icon" />}
              <span className="quick-open-name">{item.name}</span>
              <span className="quick-open-detail">{item.detail}</span>
            </button>
          ))}
          {emptyMessage && <div className="sidebar-empty">{emptyMessage}</div>}
          {scanning && results.length > 0 && <div className="quick-open-status">Scanning folder…</div>}
        </div>
      </div>
    </div>
  );
}
