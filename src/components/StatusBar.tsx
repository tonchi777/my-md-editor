interface StatusBarProps {
  filePath: string | null;
  content: string;
  isDirty: boolean;
  autoSave: boolean;
}

function wordCount(text: string): number {
  return text.trim() === "" ? 0 : text.trim().split(/\s+/).length;
}

function baseName(path: string): string {
  return path.split(/[\\/]/).pop() ?? path;
}

export function StatusBar({ filePath, content, isDirty, autoSave }: StatusBarProps) {
  const label = filePath ? baseName(filePath) : "Untitled";
  return (
    <footer className="status-bar">
      <span className="status-item" title={filePath ?? undefined}>
        {label}
        {isDirty ? " (unsaved)" : ""}
      </span>
      <span className="status-item">{wordCount(content)} words</span>
      <span className="status-item">{content.length} chars</span>
      {autoSave && <span className="status-item status-autosave">Auto-save on</span>}
    </footer>
  );
}
