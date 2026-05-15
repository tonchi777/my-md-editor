import { FolderOpen, Save, SaveAll, FilePlus, Sun, Moon, PanelLeft, PanelRight, HelpCircle } from "lucide-react";
import type { Theme } from "../types";

interface ToolbarProps {
  onNew: () => void;
  onOpen: () => void;
  onSave: () => void;
  onSaveAs: () => void;
  onToggleTheme: () => void;
  onToggleEditor: () => void;
  onTogglePreview: () => void;
  onHelp: () => void;
  theme: Theme;
  editorVisible: boolean;
  previewVisible: boolean;
  isDirty: boolean;
  fileName: string | null;
}

export function Toolbar({
  onNew,
  onOpen,
  onSave,
  onSaveAs,
  onToggleTheme,
  onToggleEditor,
  onTogglePreview,
  onHelp,
  theme,
  editorVisible,
  previewVisible,
  isDirty,
  fileName,
}: ToolbarProps) {
  return (
    <header className="toolbar">
      <div className="toolbar-left">
        <button className="toolbar-btn" onClick={onNew} title="New (Ctrl+N)">
          <FilePlus size={16} />
        </button>
        <button className="toolbar-btn" onClick={onOpen} title="Open (Ctrl+O)">
          <FolderOpen size={16} />
        </button>
        <button
          className="toolbar-btn"
          onClick={onSave}
          title="Save (Ctrl+S)"
          disabled={!isDirty}
        >
          <Save size={16} />
        </button>
        <button className="toolbar-btn" onClick={onSaveAs} title="Save As (Ctrl+Shift+S)">
          <SaveAll size={16} />
        </button>
      </div>

      <div className="toolbar-center">
        {fileName && (
          <span className="toolbar-filename">
            {isDirty ? "• " : ""}
            {fileName}
          </span>
        )}
      </div>

      <div className="toolbar-right">
        <button
          className={`toolbar-btn${editorVisible ? " active" : ""}`}
          onClick={onToggleEditor}
          title="Toggle editor"
        >
          <PanelLeft size={16} />
        </button>
        <button
          className={`toolbar-btn${previewVisible ? " active" : ""}`}
          onClick={onTogglePreview}
          title="Toggle preview"
        >
          <PanelRight size={16} />
        </button>
        <button className="toolbar-btn" onClick={onToggleTheme} title="Toggle theme">
          {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
        </button>
        <button className="toolbar-btn" onClick={onHelp} title="Markdown reference (F1)">
          <HelpCircle size={16} />
        </button>
      </div>
    </header>
  );
}
