import { useRef, useState, useEffect } from "react";
import { Clock } from "lucide-react";

interface RecentFilesMenuProps {
  recentFiles: string[];
  onOpenRecent: (path: string) => void;
}

export function RecentFilesMenu({ recentFiles, onOpenRecent }: RecentFilesMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen]);

  const basename = (path: string) => path.split(/[\\/]/).pop() ?? path;

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      <button
        className="toolbar-btn"
        onClick={() => setIsOpen(v => !v)}
        title="Recent files"
        disabled={recentFiles.length === 0}
      >
        <Clock size={16} />
      </button>
      {isOpen && (
        <div className="recent-menu">
          {recentFiles.map(path => (
            <button
              key={path}
              className="recent-menu-item"
              title={path}
              onClick={() => { onOpenRecent(path); setIsOpen(false); }}
            >
              {basename(path)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
