import type { Heading } from "../lib/outline";

interface OutlinePanelProps {
  headings: Heading[];
  onSelect: (index: number) => void;
}

export function OutlinePanel({ headings, onSelect }: OutlinePanelProps) {
  if (headings.length === 0) {
    return <div className="sidebar-empty">No headings in this document</div>;
  }
  const minLevel = Math.min(...headings.map(h => h.level));
  return (
    <div className="sidebar-files">
      {headings.map((h, i) => (
        <button
          key={`${h.line}-${h.text}`}
          className={`sidebar-item outline-item outline-level-${h.level}`}
          style={{ paddingLeft: 10 + (h.level - minLevel) * 12 }}
          title={`${h.text} (line ${h.line})`}
          onClick={() => onSelect(i)}
        >
          <span className="sidebar-item-name">{h.text}</span>
        </button>
      ))}
    </div>
  );
}
