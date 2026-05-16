import { useState, useEffect, useCallback, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { readTextFile } from "@tauri-apps/plugin-fs";
import type { EditorView } from "@codemirror/view";
import { openSearchPanel } from "@codemirror/search";
import { Toolbar } from "./components/Toolbar";
import { TabBar } from "./components/TabBar";
import { Editor } from "./components/Editor";
import { Preview } from "./components/Preview";
import { SplitPane } from "./components/SplitPane";
import { StatusBar } from "./components/StatusBar";
import { HelpModal, type HelpTab } from "./components/HelpModal";
import { CustomCssModal } from "./components/CustomCssModal";
import { FolderSidebar } from "./components/FolderSidebar";
import { useTheme } from "./hooks/useTheme";
import { useMarkdown } from "./hooks/useMarkdown";
import { useFileSystem } from "./hooks/useFileSystem";
import { generateHtmlExport } from "./lib/exportHtml";
import { generateDocxExport } from "./lib/exportDocx";
import type { Tab } from "./types";

const WELCOME = `# Welcome to Pasulong MD

A lightweight desktop Markdown editor. Start writing — the preview updates as you type.

## Editing

- **Live split preview** with syntax-highlighted code blocks
- **Multiple tabs** — open several files at once
- **Word wrap** toggle and **font size** controls in the toolbar
- **Find & Replace** with \`Ctrl+F\`
- **Distraction-free mode** with \`F11\` (press \`Esc\` to exit)

## Files

- \`Ctrl+O\` — open file
- \`Ctrl+S\` — save, \`Ctrl+Shift+S\` — save as
- \`Ctrl+N\` — new file in active tab, \`Ctrl+T\` — new tab, \`Ctrl+W\` — close tab
- **Folder sidebar** — browse and open \`.md\` files from a directory
- **Recent files** — clock icon in the toolbar reopens the last 10 files
- **Auto-save** — timer icon saves automatically every 30 seconds when enabled

## Export

- **HTML** — standalone file with inlined CSS
- **DOCX** — Word document preserving headings, lists, tables, and code blocks
- **Plain text** — strips all Markdown formatting
- **Print / PDF** — via the browser print dialog

## Appearance

- **Dark / light theme** — follows your OS preference, toggle in the toolbar
- **Custom preview CSS** — palette icon lets you style the preview with your own CSS
- **Scroll sync** — links editor and preview scroll positions

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| \`Ctrl+O\` | Open file |
| \`Ctrl+S\` | Save |
| \`Ctrl+Shift+S\` | Save As |
| \`Ctrl+N\` | New file |
| \`Ctrl+T\` | New tab |
| \`Ctrl+W\` | Close tab |
| \`Ctrl+Tab\` | Next tab |
| \`Ctrl+Shift+Tab\` | Previous tab |
| \`Ctrl+F\` | Find & Replace |
| \`F1\` | Markdown reference |
| \`F11\` | Distraction-free mode |
`;

function makeTab(content = "", path: string | null = null, label?: string): Tab {
  return { id: Math.random().toString(36).slice(2), content, savedContent: content, path, label };
}

interface TabsState { tabs: Tab[]; activeId: string }

function initTabsState(): TabsState {
  const tab = makeTab(WELCOME, null, "Welcome");
  return { tabs: [tab], activeId: tab.id };
}

export default function App() {
  const [{ tabs, activeId }, setTabsState] = useState<TabsState>(initTabsState);
  const [editorVisible, setEditorVisible] = useState(true);
  const [previewVisible, setPreviewVisible] = useState(true);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [helpTab, setHelpTab] = useState<HelpTab | null>(null);
  const [customCssOpen, setCustomCssOpen] = useState(false);
  const [distractionFree, setDistractionFree] = useState(false);

  const [wordWrap, setWordWrap] = useState(() => localStorage.getItem("md-editor-word-wrap") === "true");
  const [fontSize, setFontSize] = useState(() => parseInt(localStorage.getItem("md-editor-font-size") ?? "14", 10));
  const [scrollSync, setScrollSync] = useState(() => localStorage.getItem("md-editor-scroll-sync") === "true");
  const [autoSave, setAutoSave] = useState(() => localStorage.getItem("md-editor-auto-save") === "true");
  const [customCss, setCustomCss] = useState(() => localStorage.getItem("md-editor-custom-css") ?? "");
  const [editorView, setEditorView] = useState<EditorView | null>(null);

  const previewRef = useRef<HTMLDivElement>(null);
  const syncingRef = useRef(false);

  const { theme, toggleTheme } = useTheme();
  const { openFile, openFilePath, saveFile, saveFileAs, exportFile, exportBinaryFile, recentFiles, addToRecent } = useFileSystem();

  // If launched via file association, open that file in tab 1 and move welcome to tab 2
  useEffect(() => {
    invoke<string | null>("get_open_file_path").then(async (path) => {
      if (!path) return;
      try {
        const content = await readTextFile(path);
        const fileTab = makeTab(content, path);
        fileTab.savedContent = content;
        const welcomeTab = makeTab(WELCOME, null, "Welcome");
        setTabsState({ tabs: [fileTab, welcomeTab], activeId: fileTab.id });
        addToRecent(path);
      } catch { /* ignore unreadable paths */ }
    }).catch(() => { /* not running in Tauri (browser preview) */ });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Derive active tab values
  const activeTab = tabs.find(t => t.id === activeId) ?? tabs[0];
  const content = activeTab.content;
  const currentPath = activeTab.path;
  const isDirty = activeTab.content !== activeTab.savedContent;
  const fileName = currentPath ? currentPath.split(/[\\/]/).pop() ?? null : null;

  const html = useMarkdown(content);

  // Refs for auto-save (avoids stale closures in interval)
  const tabsRef = useRef(tabs);
  tabsRef.current = tabs;
  const activeIdRef = useRef(activeId);
  activeIdRef.current = activeId;

  // Tab state helpers
  const updateActiveTab = useCallback((updates: Partial<Omit<Tab, "id">>) => {
    setTabsState(s => ({
      ...s,
      tabs: s.tabs.map(t => t.id === s.activeId ? { ...t, ...updates } : t),
    }));
  }, []);

  const setContent = useCallback((value: string) => {
    updateActiveTab({ content: value });
  }, [updateActiveTab]);

  // Persist preferences
  useEffect(() => { localStorage.setItem("md-editor-word-wrap", String(wordWrap)); }, [wordWrap]);
  useEffect(() => {
    document.documentElement.style.setProperty("--font-size-base", `${fontSize}px`);
    localStorage.setItem("md-editor-font-size", String(fontSize));
  }, [fontSize]);
  useEffect(() => { localStorage.setItem("md-editor-scroll-sync", String(scrollSync)); }, [scrollSync]);
  useEffect(() => { localStorage.setItem("md-editor-auto-save", String(autoSave)); }, [autoSave]);

  // Custom CSS
  useEffect(() => {
    localStorage.setItem("md-editor-custom-css", customCss);
    let el = document.getElementById("md-editor-custom-css") as HTMLStyleElement | null;
    if (!el) {
      el = document.createElement("style");
      el.id = "md-editor-custom-css";
      document.head.appendChild(el);
    }
    el.textContent = customCss;
  }, [customCss]);

  // Auto-save every 30s (reads active tab from refs to avoid resetting the interval on keystrokes)
  useEffect(() => {
    if (!autoSave) return;
    const id = setInterval(async () => {
      const tab = tabsRef.current.find(t => t.id === activeIdRef.current);
      if (tab?.path && tab.content !== tab.savedContent) {
        const ok = await saveFile(tab.content, tab.path);
        if (ok) updateActiveTab({ savedContent: tab.content });
      }
    }, 30000);
    return () => clearInterval(id);
  }, [autoSave, saveFile, updateActiveTab]);

  // Scroll sync
  useEffect(() => {
    if (!scrollSync || !editorView || !previewRef.current) return;
    const scroller = editorView.scrollDOM;
    const preview = previewRef.current;
    const syncFromEditor = () => {
      if (syncingRef.current) return;
      const { scrollTop, scrollHeight, clientHeight } = scroller;
      if (scrollHeight <= clientHeight) return;
      syncingRef.current = true;
      preview.scrollTop = (scrollTop / (scrollHeight - clientHeight)) * (preview.scrollHeight - preview.clientHeight);
      requestAnimationFrame(() => { syncingRef.current = false; });
    };
    const syncFromPreview = () => {
      if (syncingRef.current) return;
      const { scrollTop, scrollHeight, clientHeight } = preview;
      if (scrollHeight <= clientHeight) return;
      syncingRef.current = true;
      scroller.scrollTop = (scrollTop / (scrollHeight - clientHeight)) * (scroller.scrollHeight - scroller.clientHeight);
      requestAnimationFrame(() => { syncingRef.current = false; });
    };
    scroller.addEventListener("scroll", syncFromEditor);
    preview.addEventListener("scroll", syncFromPreview);
    return () => {
      scroller.removeEventListener("scroll", syncFromEditor);
      preview.removeEventListener("scroll", syncFromPreview);
    };
  }, [scrollSync, editorView]);

  // Unsaved changes guard
  useEffect(() => {
    const anyDirty = tabs.some(t => t.content !== t.savedContent);
    window.onbeforeunload = anyDirty ? () => "You have unsaved changes." : null;
    return () => { window.onbeforeunload = null; };
  }, [tabs]);

  // ── Tab management ──────────────────────────────────────────────
  const handleNewTab = useCallback(() => {
    const tab = makeTab();
    setTabsState(s => ({ tabs: [...s.tabs, tab], activeId: tab.id }));
  }, []);

  const handleSelectTab = useCallback((id: string) => {
    setTabsState(s => ({ ...s, activeId: id }));
  }, []);

  const handleCloseTab = useCallback((id: string) => {
    setTabsState(s => {
      const tab = s.tabs.find(t => t.id === id)!;
      if (tab.content !== tab.savedContent && !window.confirm("Discard unsaved changes?")) return s;
      if (s.tabs.length === 1) {
        const fresh = makeTab();
        return { tabs: [fresh], activeId: fresh.id };
      }
      const remaining = s.tabs.filter(t => t.id !== id);
      const nextId = s.activeId === id
        ? (remaining[Math.max(0, s.tabs.findIndex(t => t.id === id) - 1)]?.id ?? remaining[0].id)
        : s.activeId;
      return { tabs: remaining, activeId: nextId };
    });
  }, []);

  // ── File operations ─────────────────────────────────────────────
  const handleNew = useCallback(() => {
    if (isDirty && !window.confirm("Discard unsaved changes?")) return;
    updateActiveTab({ content: "", savedContent: "", path: null, label: undefined });
  }, [isDirty, updateActiveTab]);

  const openInActiveTab = useCallback((content: string, path: string) => {
    const isBlank = !activeTab.path && !activeTab.content;
    if (isBlank) {
      updateActiveTab({ content, savedContent: content, path });
    } else {
      const tab = makeTab(content, path);
      tab.savedContent = content;
      setTabsState(s => ({ tabs: [...s.tabs, tab], activeId: tab.id }));
    }
  }, [activeTab, updateActiveTab]);

  const handleOpen = useCallback(async () => {
    const result = await openFile();
    if (result) {
      openInActiveTab(result.content, result.path);
      addToRecent(result.path);
    }
  }, [openFile, openInActiveTab, addToRecent]);

  const handleOpenRecent = useCallback(async (path: string) => {
    const text = await openFilePath(path);
    if (text !== null) {
      openInActiveTab(text, path);
      addToRecent(path);
    }
  }, [openFilePath, openInActiveTab, addToRecent]);

  const handleOpenFromSidebar = useCallback(async (path: string) => {
    const existing = tabs.find(t => t.path === path);
    if (existing) {
      setTabsState(s => ({ ...s, activeId: existing.id }));
      return;
    }
    const text = await openFilePath(path);
    if (text !== null) {
      openInActiveTab(text, path);
      addToRecent(path);
    }
  }, [tabs, openFilePath, openInActiveTab, addToRecent]);

  const handleSave = useCallback(async () => {
    if (!currentPath) {
      const path = await saveFileAs(content);
      if (path) { updateActiveTab({ savedContent: content, path }); addToRecent(path); }
    } else {
      const ok = await saveFile(content, currentPath);
      if (ok) updateActiveTab({ savedContent: content });
    }
  }, [content, currentPath, saveFile, saveFileAs, updateActiveTab, addToRecent]);

  const handleSaveAs = useCallback(async () => {
    const path = await saveFileAs(content);
    if (path) { updateActiveTab({ savedContent: content, path }); addToRecent(path); }
  }, [content, saveFileAs, updateActiveTab, addToRecent]);

  const handleFontSizeChange = useCallback((delta: number) => {
    setFontSize(s => Math.min(24, Math.max(10, s + delta)));
  }, []);

  // ── Exports ─────────────────────────────────────────────────────
  const handleExportHtml = useCallback(async () => {
    const base = fileName?.replace(/\.[^.]+$/, "") ?? "document";
    const doc = generateHtmlExport(html, base, theme === "dark", customCss);
    await exportFile(doc, base + ".html", [{ name: "HTML", extensions: ["html"] }]);
  }, [html, fileName, theme, customCss, exportFile]);

  const handleExportTxt = useCallback(async () => {
    const base = fileName?.replace(/\.[^.]+$/, "") ?? "document";
    await exportFile(content, base + ".txt", [{ name: "Text", extensions: ["txt"] }]);
  }, [content, fileName, exportFile]);

  const handleExportDocx = useCallback(async () => {
    const base = fileName?.replace(/\.[^.]+$/, "") ?? "document";
    const data = await generateDocxExport(html);
    await exportBinaryFile(data, base + ".docx", [{ name: "Word Document", extensions: ["docx"] }]);
  }, [html, fileName, exportBinaryFile]);

  const handlePrint = useCallback(() => { window.print(); }, []);

  // ── Panel toggles ────────────────────────────────────────────────
  const toggleEditor = useCallback(() => {
    if (editorVisible && !previewVisible) return;
    setEditorVisible(v => !v);
  }, [editorVisible, previewVisible]);

  const togglePreview = useCallback(() => {
    if (previewVisible && !editorVisible) return;
    setPreviewVisible(v => !v);
  }, [previewVisible, editorVisible]);

  // ── Keyboard shortcuts ───────────────────────────────────────────
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && !e.shiftKey && e.key === "s") {
        e.preventDefault(); handleSave();
      } else if (e.ctrlKey && e.shiftKey && e.key === "S") {
        e.preventDefault(); handleSaveAs();
      } else if (e.ctrlKey && e.key === "o") {
        e.preventDefault(); handleOpen();
      } else if (e.ctrlKey && e.key === "n") {
        e.preventDefault(); handleNew();
      } else if (e.ctrlKey && e.key === "t") {
        e.preventDefault(); handleNewTab();
      } else if (e.ctrlKey && e.key === "w") {
        e.preventDefault(); handleCloseTab(activeId);
      } else if (e.ctrlKey && e.key === "Tab") {
        e.preventDefault();
        setTabsState(s => {
          const idx = s.tabs.findIndex(t => t.id === s.activeId);
          const next = s.tabs[(idx + 1) % s.tabs.length];
          return { ...s, activeId: next.id };
        });
      } else if (e.ctrlKey && e.shiftKey && e.key === "Tab") {
        e.preventDefault();
        setTabsState(s => {
          const idx = s.tabs.findIndex(t => t.id === s.activeId);
          const prev = s.tabs[(idx - 1 + s.tabs.length) % s.tabs.length];
          return { ...s, activeId: prev.id };
        });
      } else if (e.ctrlKey && e.key === "f") {
        e.preventDefault();
        if (editorView) openSearchPanel(editorView);
      } else if (e.key === "F1") {
        e.preventDefault(); setHelpTab(t => t ? null : "shortcuts");
      } else if (e.key === "F11") {
        e.preventDefault(); setDistractionFree(v => !v);
      } else if (e.key === "Escape" && distractionFree) {
        setDistractionFree(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleSave, handleSaveAs, handleOpen, handleNew, handleNewTab, handleCloseTab, activeId, distractionFree, editorView]);

  return (
    <div className={`app${distractionFree ? " distraction-free" : ""}`}>
      <Toolbar
        onNew={handleNew}
        onOpen={handleOpen}
        onSave={handleSave}
        onSaveAs={handleSaveAs}
        onToggleTheme={toggleTheme}
        onToggleEditor={toggleEditor}
        onTogglePreview={togglePreview}
        onHelp={() => setHelpTab("shortcuts")}
        onToggleWordWrap={() => setWordWrap(v => !v)}
        onFontSizeChange={handleFontSizeChange}
        onToggleScrollSync={() => setScrollSync(v => !v)}
        onOpenRecent={handleOpenRecent}
        onExportHtml={handleExportHtml}
        onExportTxt={handleExportTxt}
        onExportDocx={handleExportDocx}
        onPrint={handlePrint}
        onFind={() => { if (editorView) openSearchPanel(editorView); }}
        onToggleAutoSave={() => setAutoSave(v => !v)}
        onOpenCustomCss={() => setCustomCssOpen(true)}
        onToggleSidebar={() => setSidebarVisible(v => !v)}
        theme={theme}
        editorVisible={editorVisible}
        previewVisible={previewVisible}
        sidebarVisible={sidebarVisible}
        wordWrap={wordWrap}
        scrollSync={scrollSync}
        autoSave={autoSave}
        fontSize={fontSize}
        isDirty={isDirty}
        recentFiles={recentFiles}
      />
      <div className="app-body">
        {sidebarVisible && <FolderSidebar onOpenFile={handleOpenFromSidebar} />}
        <div className="app-right">
          <TabBar
            tabs={tabs}
            activeTabId={activeId}
            onSelectTab={handleSelectTab}
            onCloseTab={handleCloseTab}
            onNewTab={handleNewTab}
          />
          <SplitPane
            leftVisible={editorVisible}
            rightVisible={previewVisible}
            left={
              <Editor
                content={content}
                isDark={theme === "dark"}
                wordWrap={wordWrap}
                onChange={setContent}
                onEditorCreated={setEditorView}
              />
            }
            right={<Preview ref={previewRef} html={html} />}
          />
        </div>
      </div>
      <StatusBar filePath={currentPath} content={content} isDirty={isDirty} autoSave={autoSave} />
      {helpTab && <HelpModal initialTab={helpTab} onClose={() => setHelpTab(null)} />}
      {customCssOpen && (
        <CustomCssModal
          initialCss={customCss}
          onSave={setCustomCss}
          onClose={() => setCustomCssOpen(false)}
        />
      )}
    </div>
  );
}
