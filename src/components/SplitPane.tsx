import { useState, useRef, type CSSProperties } from "react";

interface SplitPaneProps {
  leftVisible: boolean;
  rightVisible: boolean;
  left: React.ReactNode;
  right: React.ReactNode;
}

const STORAGE_KEY = "md-editor-split-ratio";
const DEFAULT_RATIO = 0.5;

export function SplitPane({ leftVisible, rightVisible, left, right }: SplitPaneProps) {
  const [ratio, setRatio] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const parsed = stored ? parseFloat(stored) : NaN;
    return isNaN(parsed) ? DEFAULT_RATIO : Math.min(0.8, Math.max(0.2, parsed));
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    dragging.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const newRatio = Math.min(0.8, Math.max(0.2, (e.clientX - rect.left) / rect.width));
    setRatio(newRatio);
    localStorage.setItem(STORAGE_KEY, String(newRatio));
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    dragging.current = false;
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const bothVisible = leftVisible && rightVisible;

  const leftStyle: CSSProperties = {
    display: leftVisible ? "flex" : "none",
    flexDirection: "column",
    overflow: "hidden",
    minWidth: 0,
    flex: bothVisible ? `0 0 ${ratio * 100}%` : "1 1 100%",
  };

  const rightStyle: CSSProperties = {
    display: rightVisible ? "flex" : "none",
    flexDirection: "column",
    overflow: "hidden",
    minWidth: 0,
    flex: bothVisible ? "1 1 0" : "1 1 100%",
  };

  return (
    <div ref={containerRef} className="split-pane">
      <div style={leftStyle}>{left}</div>
      {bothVisible && (
        <div
          className="split-divider"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
        />
      )}
      <div style={rightStyle}>{right}</div>
    </div>
  );
}
