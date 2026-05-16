import { useRef, useState, useEffect } from "react";
import { Download } from "lucide-react";

interface ExportMenuProps {
  onExportHtml: () => void;
  onExportTxt: () => void;
  onExportDocx: () => void;
  onPrint: () => void;
}

export function ExportMenu({ onExportHtml, onExportTxt, onExportDocx, onPrint }: ExportMenuProps) {
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

  const item = (label: string, fn: () => void) => (
    <button className="recent-menu-item" onClick={() => { fn(); setIsOpen(false); }}>
      {label}
    </button>
  );

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      <button className="toolbar-btn" onClick={() => setIsOpen(v => !v)} title="Export / Print">
        <Download size={16} />
      </button>
      {isOpen && (
        <div className="recent-menu">
          {item("Export as HTML", onExportHtml)}
          {item("Export as Plain Text", onExportTxt)}
          {item("Export as DOCX", onExportDocx)}
          {item("Print / Save as PDF", onPrint)}
        </div>
      )}
    </div>
  );
}
