import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { invoke } from "@tauri-apps/api/core";
import { readTextFile } from "@tauri-apps/plugin-fs";
import { EditorView } from "@codemirror/view";
import { openSearchPanel } from "@codemirror/search";
import { Toolbar } from "./components/Toolbar";
import { TabBar } from "./components/TabBar";
import { Editor } from "./components/Editor";
import { Preview } from "./components/Preview";
import { SplitPane } from "./components/SplitPane";
import { StatusBar } from "./components/StatusBar";
import { HelpModal, type HelpTab } from "./components/HelpModal";
import { CustomCssModal } from "./components/CustomCssModal";
import { RenameModal } from "./components/RenameModal";
import { Sidebar, type SidebarTab } from "./components/Sidebar";
import { QuickOpenModal } from "./components/QuickOpenModal";
import { DiskChangeBanner } from "./components/DiskChangeBanner";
import { useTheme } from "./hooks/useTheme";
import { useMarkdown } from "./hooks/useMarkdown";
import { useFileSystem } from "./hooks/useFileSystem";
import { useExternalChanges, type DiskState } from "./hooks/useExternalChanges";
import { generateHtmlExport } from "./lib/exportHtml";
import { generateDocxExport } from "./lib/exportDocx";
import { parseHeadings } from "./lib/outline";
import { samePath } from "./lib/markdownFiles";
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
- **Folder sidebar** — browse and open \`.md\` files from a directory; the **Outline** tab lists this document's headings
- **Quick open** — \`Ctrl+P\` finds any file in the sidebar folder or your recent files
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
| \`Ctrl+P\` | Quick open |
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
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>("files");
  const [folderRoot, setFolderRoot] = useState<string | null>(null);
  const [quickOpen, setQuickOpen] = useState(false);
  const [helpTab, setHelpTab] = useState<HelpTab | null>(null);
  const [customCssOpen, setCustomCssOpen] = useState(false);
  const [renameTabId, setRenameTabId] = useState<string | null>(null);
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
  const outlineVisible = sidebarVisible && sidebarTab === "outline";
  const headings = useMemo(() => outlineVisible ? parseHeadings(content) : [], [content, outlineVisible]);

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

  // ── External changes ────────────────────────────────────────────
  // Clean tabs reload silently; tabs with unsaved edits get a Reload / Keep mine banner.
  const handleDiskChange = useCallback((path: string, disk: DiskState) => {
    setTabsState(s => ({
      ...s,
      tabs: s.tabs.map(t => {
        if (!t.path || !samePath(t.path, path)) return t;
        if ("deleted" in disk) {
          // Nothing is on disk any more, so any content counts as unsaved.
          return t.diskDeleted ? t : { ...t, savedContent: "", diskContent: undefined, diskDeleted: true };
        }
        const text = disk.content;
        const resolved = { diskContent: undefined, diskDeleted: false };
        if (text === t.savedContent) {
          return t.diskContent !== undefined || t.diskDeleted ? { ...t, ...resolved } : t;
        }
        if (text === t.content) return { ...t, ...resolved, savedContent: text };
        if (t.content === t.savedContent) return { ...t, ...resolved, content: text, savedContent: text };
        return { ...t, diskContent: text, diskDeleted: false };
      }),
    }));
  }, []);

  useExternalChanges(tabs, handleDiskChange);

  const handleReloadFromDisk = useCallback(() => {
    if (activeTab.diskContent === undefined) return;
    updateActiveTab({ content: activeTab.diskContent, savedContent: activeTab.diskContent, diskContent: undefined });
  }, [activeTab.diskContent, updateActiveTab]);

  const handleKeepMine = useCallback(() => {
    if (activeTab.diskContent === undefined) return;
    // Track the disk version as "saved" so the tab stays dirty until the user saves over it.
    updateActiveTab({ savedContent: activeTab.diskContent, diskContent: undefined });
  }, [activeTab.diskContent, updateActiveTab]);

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
      // Never auto-save over an unresolved external change; the user decides via the banner.
      if (tab?.path && tab.content !== tab.savedContent && tab.diskContent === undefined) {
        const ok = await saveFile(tab.content, tab.path);
        if (ok) updateActiveTab({ savedContent: tab.content, diskDeleted: false });
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

  const handleRenameTab = useCallback((id: string) => {
    setRenameTabId(id);
  }, []);

  const handleRenameSave = useCallback((label: string) => {
    setTabsState(s => ({
      ...s,
      tabs: s.tabs.map(t => (t.id === s.activeId ? { ...t, label } : t)),
    }));
    setRenameTabId(null);
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
    updateActiveTab({ content: "", savedContent: "", path: null, label: undefined, diskContent: undefined, diskDeleted: false });
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

  // Opens a path from the sidebar or quick open, switching to its tab if it's already open.
  const handleOpenPath = useCallback(async (path: string) => {
    const existing = tabs.find(t => t.path && samePath(t.path, path));
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
      const suggested = activeTab.label ?? `untitled.md`;
      const path = await saveFileAs(content, suggested);
      if (path) { updateActiveTab({ savedContent: content, path }); addToRecent(path); }
    } else {
      const ok = await saveFile(content, currentPath);
      if (ok) updateActiveTab({ savedContent: content, diskContent: undefined, diskDeleted: false });
    }
  }, [content, currentPath, saveFile, saveFileAs, updateActiveTab, addToRecent, activeTab.label]);

  const handleSaveAs = useCallback(async () => {
    const suggested = activeTab.label ?? fileName ?? "untitled.md";
    const path = await saveFileAs(content, suggested);
    if (path) { updateActiveTab({ savedContent: content, path, diskContent: undefined, diskDeleted: false }); addToRecent(path); }
  }, [content, saveFileAs, updateActiveTab, addToRecent, activeTab.label, fileName]);

  // ── Outline ─────────────────────────────────────────────────────
  const handleSelectHeading = useCallback((index: number) => {
    const heading = headings[index];
    if (!heading) return;
    if (editorVisible && editorView) {
      const doc = editorView.state.doc;
      const line = doc.line(Math.min(heading.line, doc.lines));
      editorView.dispatch({
        selection: { anchor: line.from },
        effects: EditorView.scrollIntoView(line.from, { y: "start", yMargin: 8 }),
      });
      editorView.focus();
    }
    // Scroll sync already moves the preview when the editor scrolls; otherwise jump it directly.
    // Only trust the index when the preview has the same headings the outline parsed.
    const preview = previewRef.current;
    if (preview && previewVisible && (!scrollSync || !editorVisible)) {
      const els = preview.querySelectorAll("h1, h2, h3, h4, h5, h6");
      if (els.length === headings.length) els[index].scrollIntoView({ block: "start" });
    }
  }, [headings, editorView, editorVisible, previewVisible, scrollSync]);

  const handleFontSizeChange = useCallback((delta: number) => {
    setFontSize(s => Math.min(24, Math.max(10, s + delta)));
  }, []);

  // ── Exports ─────────────────────────────────────────────────────
  const handleExportHtml = useCallback(async () => {
    const base = fileName?.replace(/\.[^.]+$/, "") ?? activeTab.label ?? "document";
    const doc = generateHtmlExport(html, base, theme === "dark", customCss);
    await exportFile(doc, base + ".html", [{ name: "HTML", extensions: ["html"] }]);
  }, [html, fileName, theme, customCss, exportFile, activeTab.label]);

  const handleExportTxt = useCallback(async () => {
    const base = fileName?.replace(/\.[^.]+$/, "") ?? activeTab.label ?? "document";
    await exportFile(content, base + ".txt", [{ name: "Text", extensions: ["txt"] }]);
  }, [content, fileName, exportFile, activeTab.label]);

  const handleExportDocx = useCallback(async () => {
    const base = fileName?.replace(/\.[^.]+$/, "") ?? activeTab.label ?? "document";
    const data = await generateDocxExport(html);
    await exportBinaryFile(data, base + ".docx", [{ name: "Word Document", extensions: ["docx"] }]);
  }, [html, fileName, exportBinaryFile, activeTab.label]);

  const handlePrint = useCallback(() => {
    const base = fileName?.replace(/\.[^.]+$/, "") ?? activeTab.label ?? "document";
    const prev = document.title;
    document.title = base;
    window.print();
    document.title = prev;
  }, [fileName, activeTab.label]);

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
      } else if (e.ctrlKey && !e.shiftKey && e.key.toLowerCase() === "p") {
        e.preventDefault(); setQuickOpen(v => !v);
      } else if (e.key === "F1") {
        e.preventDefault(); setHelpTab(t => t ? null : "shortcuts");
      } else if (e.key === "F2") {
        e.preventDefault(); setHelpTab(t => t === "reference" ? null : "reference");
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
        {sidebarVisible && (
          <Sidebar
            tab={sidebarTab}
            onTabChange={setSidebarTab}
            rootDir={folderRoot}
            onRootDirChange={setFolderRoot}
            onOpenFile={handleOpenPath}
            headings={headings}
            onSelectHeading={handleSelectHeading}
          />
        )}
        <div className="app-right">
          <TabBar
            tabs={tabs}
            activeTabId={activeId}
            onSelectTab={handleSelectTab}
            onCloseTab={handleCloseTab}
            onNewTab={handleNewTab}
            onRenameTab={handleRenameTab}
          />
          {(activeTab.diskContent !== undefined || activeTab.diskDeleted) && (
            <DiskChangeBanner
              kind={activeTab.diskContent !== undefined ? "changed" : "deleted"}
              onReload={handleReloadFromDisk}
              onKeepMine={handleKeepMine}
              onSave={handleSave}
              onDismiss={() => updateActiveTab({ diskDeleted: false })}
            />
          )}
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
      {quickOpen && (
        <QuickOpenModal
          rootDir={folderRoot}
          recentFiles={recentFiles}
          onOpen={handleOpenPath}
          onClose={() => setQuickOpen(false)}
        />
      )}
      {customCssOpen && (
        <CustomCssModal
          initialCss={customCss}
          onSave={setCustomCss}
          onClose={() => setCustomCssOpen(false)}
        />
      )}
      {renameTabId && (() => {
        const tab = tabs.find(t => t.id === renameTabId);
        if (!tab) return null;
        return (
          <RenameModal
            currentLabel={tab.label ?? (tab.path ? tab.path.split(/[\\/]/).pop() ?? "Untitled" : "Untitled")}
            onSave={handleRenameSave}
            onClose={() => setRenameTabId(null)}
          />
        );
      })()}
    </div>
  );
}
