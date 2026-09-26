import { FolderSidebar } from "./FolderSidebar";
import { OutlinePanel } from "./OutlinePanel";
import type { Heading } from "../lib/outline";

export type SidebarTab = "files" | "outline";

interface SidebarProps {
  tab: SidebarTab;
  onTabChange: (tab: SidebarTab) => void;
  rootDir: string | null;
  onRootDirChange: (dir: string) => void;
  onOpenFile: (path: string) => void;
  headings: Heading[];
  onSelectHeading: (index: number) => void;
}

export function Sidebar({ tab, onTabChange, rootDir, onRootDirChange, onOpenFile, headings, onSelectHeading }: SidebarProps) {
  return (
    <div className="sidebar">
      <div className="sidebar-tabs" role="tablist">
        <button
          role="tab"
          aria-selected={tab === "files"}
          className={`sidebar-tab${tab === "files" ? " sidebar-tab-active" : ""}`}
          onClick={() => onTabChange("files")}
        >
          Files
        </button>
        <button
          role="tab"
          aria-selected={tab === "outline"}
          className={`sidebar-tab${tab === "outline" ? " sidebar-tab-active" : ""}`}
          onClick={() => onTabChange("outline")}
        >
          Outline
        </button>
      </div>
      {/* Kept mounted while hidden so folder navigation survives switching tabs. */}
      <div className="sidebar-panel" hidden={tab !== "files"}>
        <FolderSidebar rootDir={rootDir} onRootDirChange={onRootDirChange} onOpenFile={onOpenFile} />
      </div>
      {tab === "outline" && (
        <div className="sidebar-panel">
          <OutlinePanel headings={headings} onSelect={onSelectHeading} />
        </div>
      )}
    </div>
  );
}
