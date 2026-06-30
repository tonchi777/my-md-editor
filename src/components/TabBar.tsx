import { X, Plus, Edit2 } from "lucide-react";
import type { Tab } from "../types";

interface TabBarProps {
  tabs: Tab[];
  activeTabId: string;
  onSelectTab: (id: string) => void;
  onCloseTab: (id: string) => void;
  onNewTab: () => void;
  onRenameTab: (id: string) => void;
}

function tabTitle(tab: Tab): string {
  if (tab.label) return tab.label;
  if (!tab.path) return "Untitled";
  return tab.path.split(/[\\/]/).pop() ?? "Untitled";
}

export function TabBar({ tabs, activeTabId, onSelectTab, onCloseTab, onNewTab, onRenameTab }: TabBarProps) {
  return (
    <div className="tab-bar">
      {tabs.map(tab => (
        <div
          key={tab.id}
          className={`tab${tab.id === activeTabId ? " tab-active" : ""}`}
          onClick={() => onSelectTab(tab.id)}
          title={tab.path ?? undefined}
        >
          <span className="tab-title">
            {tab.content !== tab.savedContent ? "• " : ""}
            {tabTitle(tab)}
          </span>
          <button
            className="tab-close"
            onClick={e => { e.stopPropagation(); onCloseTab(tab.id); }}
            title="Close tab"
          >
            <X size={12} />
          </button>
          <button
            className="tab-rename"
            onClick={e => { e.stopPropagation(); onRenameTab(tab.id); }}
            title="Rename tab"
          >
            <Edit2 size={10} />
          </button>
        </div>
      ))}
      <button className="tab-new" onClick={onNewTab} title="New tab (Ctrl+T)">
        <Plus size={14} />
      </button>
    </div>
  );
}
