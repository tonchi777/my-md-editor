import { useState, useEffect, useCallback } from "react";
import { Toolbar } from "./components/Toolbar";
import { Editor } from "./components/Editor";
import { Preview } from "./components/Preview";
import { SplitPane } from "./components/SplitPane";
import { StatusBar } from "./components/StatusBar";
import { HelpModal } from "./components/HelpModal";
import { useTheme } from "./hooks/useTheme";
import { useMarkdown } from "./hooks/useMarkdown";
import { useFileSystem } from "./hooks/useFileSystem";

const WELCOME = `# Welcome to MD Editor

Start writing Markdown here. The preview updates as you type.

## Features

- **Live preview** with syntax highlighting
- **File open/save** via native OS dialogs
- **Dark/light theme** following your OS preference
- Resizable split pane

\`\`\`typescript
const greeting = "Hello, MD Editor!";
console.log(greeting);
\`\`\`

> Tip: \`Ctrl+O\` to open, \`Ctrl+S\` to save, \`Ctrl+N\` for new.
`;

export default function App() {
  const [content, setContent] = useState(WELCOME);
  const [savedContent, setSavedContent] = useState(WELCOME);
  const [editorVisible, setEditorVisible] = useState(true);
  const [previewVisible, setPreviewVisible] = useState(true);
  const [helpOpen, setHelpOpen] = useState(false);

  const { theme, toggleTheme } = useTheme();
  const html = useMarkdown(content);
  const { currentPath, setCurrentPath, openFile, saveFile, saveFileAs } = useFileSystem();

  const isDirty = content !== savedContent;

  const handleNew = useCallback(() => {
    if (isDirty && !window.confirm("Discard unsaved changes?")) return;
    setContent("");
    setSavedContent("");
    setCurrentPath(null);
  }, [isDirty, setCurrentPath]);

  const handleOpen = useCallback(async () => {
    if (isDirty && !window.confirm("Discard unsaved changes?")) return;
    const result = await openFile();
    if (result) {
      setContent(result.content);
      setSavedContent(result.content);
    }
  }, [isDirty, openFile]);

  const handleSave = useCallback(async () => {
    if (!currentPath) {
      const path = await saveFileAs(content);
      if (path) setSavedContent(content);
    } else {
      const ok = await saveFile(content, currentPath);
      if (ok) setSavedContent(content);
    }
  }, [content, currentPath, saveFile, saveFileAs]);

  const handleSaveAs = useCallback(async () => {
    const path = await saveFileAs(content);
    if (path) setSavedContent(content);
  }, [content, saveFileAs]);

  const toggleEditor = useCallback(() => {
    if (editorVisible && !previewVisible) return;
    setEditorVisible(v => !v);
  }, [editorVisible, previewVisible]);

  const togglePreview = useCallback(() => {
    if (previewVisible && !editorVisible) return;
    setPreviewVisible(v => !v);
  }, [previewVisible, editorVisible]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && !e.shiftKey && e.key === "s") {
        e.preventDefault();
        handleSave();
      } else if (e.ctrlKey && e.shiftKey && e.key === "S") {
        e.preventDefault();
        handleSaveAs();
      } else if (e.ctrlKey && e.key === "o") {
        e.preventDefault();
        handleOpen();
      } else if (e.ctrlKey && e.key === "n") {
        e.preventDefault();
        handleNew();
      } else if (e.key === "F1") {
        e.preventDefault();
        setHelpOpen(v => !v);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleSave, handleSaveAs, handleOpen, handleNew]);

  useEffect(() => {
    if (isDirty) {
      window.onbeforeunload = () => "You have unsaved changes.";
    } else {
      window.onbeforeunload = null;
    }
    return () => {
      window.onbeforeunload = null;
    };
  }, [isDirty]);

  const fileName = currentPath ? currentPath.split(/[\\/]/).pop() ?? null : null;

  return (
    <div className="app">
      <Toolbar
        onNew={handleNew}
        onOpen={handleOpen}
        onSave={handleSave}
        onSaveAs={handleSaveAs}
        onToggleTheme={toggleTheme}
        onToggleEditor={toggleEditor}
        onTogglePreview={togglePreview}
        onHelp={() => setHelpOpen(true)}
        theme={theme}
        editorVisible={editorVisible}
        previewVisible={previewVisible}
        isDirty={isDirty}
        fileName={fileName}
      />
      <SplitPane
        leftVisible={editorVisible}
        rightVisible={previewVisible}
        left={<Editor content={content} isDark={theme === "dark"} onChange={setContent} />}
        right={<Preview html={html} />}
      />
      <StatusBar filePath={currentPath} content={content} isDirty={isDirty} />
      {helpOpen && <HelpModal onClose={() => setHelpOpen(false)} />}
    </div>
  );
}
