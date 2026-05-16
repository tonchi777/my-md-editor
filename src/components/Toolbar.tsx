import {
  FolderOpen, Save, SaveAll, FilePlus,
  Sun, Moon, PanelLeft, PanelRight, HelpCircle,
  WrapText, ZoomIn, ZoomOut, ArrowUpDown,
  Timer, Palette, PanelLeftOpen, Search,
} from "lucide-react";
import type { Theme } from "../types";
import { RecentFilesMenu } from "./RecentFilesMenu";
import { ExportMenu } from "./ExportMenu";

interface ToolbarProps {
  onNew: () => void;
  onOpen: () => void;
  onSave: () => void;
  onSaveAs: () => void;
  onToggleTheme: () => void;
  onToggleEditor: () => void;
  onTogglePreview: () => void;
  onHelp: () => void;
  onToggleWordWrap: () => void;
  onFontSizeChange: (delta: number) => void;
  onToggleScrollSync: () => void;
  onOpenRecent: (path: string) => void;
  onExportHtml: () => void;
  onExportTxt: () => void;
  onExportDocx: () => void;
  onPrint: () => void;
  onFind: () => void;
  onToggleAutoSave: () => void;
  onOpenCustomCss: () => void;
  onToggleSidebar: () => void;
  theme: Theme;
  editorVisible: boolean;
  previewVisible: boolean;
  sidebarVisible: boolean;
  wordWrap: boolean;
  scrollSync: boolean;
  autoSave: boolean;
  fontSize: number;
  isDirty: boolean;
  fileName: string | null;
  recentFiles: string[];
}

export function Toolbar({
  onNew, onOpen, onSave, onSaveAs,
  onToggleTheme, onToggleEditor, onTogglePreview, onHelp,
  onToggleWordWrap, onFontSizeChange, onToggleScrollSync, onOpenRecent,
  onExportHtml, onExportTxt, onExportDocx, onPrint,
  onFind, onToggleAutoSave, onOpenCustomCss, onToggleSidebar,
  theme, editorVisible, previewVisible, sidebarVisible,
  wordWrap, scrollSync, autoSave, fontSize,
  isDirty, fileName, recentFiles,
}: ToolbarProps) {
  return (
    <header className="toolbar">
      <div className="toolbar-left">
        <button
          className={`toolbar-btn${sidebarVisible ? " active" : ""}`}
          onClick={onToggleSidebar}
          title="Toggle file sidebar"
        >
          <PanelLeftOpen size={16} />
        </button>
        <button className="toolbar-btn" onClick={onNew} title="New tab (Ctrl+T)">
          <FilePlus size={16} />
        </button>
        <button className="toolbar-btn" onClick={onOpen} title="Open (Ctrl+O)">
          <FolderOpen size={16} />
        </button>
        <RecentFilesMenu recentFiles={recentFiles} onOpenRecent={onOpenRecent} />
        <button className="toolbar-btn" onClick={onSave} title="Save (Ctrl+S)" disabled={!isDirty}>
          <Save size={16} />
        </button>
        <button className="toolbar-btn" onClick={onSaveAs} title="Save As (Ctrl+Shift+S)">
          <SaveAll size={16} />
        </button>
        <ExportMenu
          onExportHtml={onExportHtml}
          onExportTxt={onExportTxt}
          onExportDocx={onExportDocx}
          onPrint={onPrint}
        />
        <button className="toolbar-btn" onClick={onFind} title="Find & Replace (Ctrl+F)">
          <Search size={16} />
        </button>
      </div>

      <div className="toolbar-center">
        {fileName && (
          <span className="toolbar-filename">
            {isDirty ? "• " : ""}{fileName}
          </span>
        )}
      </div>

      <div className="toolbar-right">
        <button
          className={`toolbar-btn${autoSave ? " active" : ""}`}
          onClick={onToggleAutoSave}
          title="Toggle auto-save (every 30s)"
        >
          <Timer size={16} />
        </button>
        <button className="toolbar-btn" onClick={onOpenCustomCss} title="Custom preview CSS">
          <Palette size={16} />
        </button>
        <button
          className={`toolbar-btn${wordWrap ? " active" : ""}`}
          onClick={onToggleWordWrap}
          title="Toggle word wrap"
        >
          <WrapText size={16} />
        </button>
        <button
          className="toolbar-btn"
          onClick={() => onFontSizeChange(-1)}
          title={`Decrease font size (${fontSize}px)`}
          disabled={fontSize <= 10}
        >
          <ZoomOut size={16} />
        </button>
        <button
          className="toolbar-btn"
          onClick={() => onFontSizeChange(1)}
          title={`Increase font size (${fontSize}px)`}
          disabled={fontSize >= 24}
        >
          <ZoomIn size={16} />
        </button>
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
        <button
          className={`toolbar-btn${scrollSync ? " active" : ""}`}
          onClick={onToggleScrollSync}
          title="Toggle scroll sync"
        >
          <ArrowUpDown size={16} />
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
