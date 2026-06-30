import { useState } from "react";
import { open, save } from "@tauri-apps/plugin-dialog";
import { readTextFile, writeTextFile, writeFile } from "@tauri-apps/plugin-fs";

const MD_FILTERS = [{ name: "Markdown", extensions: ["md", "markdown", "txt"] }];
const RECENT_KEY = "md-editor-recent";
const MAX_RECENT = 10;

function loadRecent(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function useFileSystem() {
  const [recentFiles, setRecentFiles] = useState<string[]>(loadRecent);

  const addToRecent = (path: string) => {
    setRecentFiles(prev => {
      const next = [path, ...prev.filter(p => p !== path)].slice(0, MAX_RECENT);
      localStorage.setItem(RECENT_KEY, JSON.stringify(next));
      return next;
    });
  };

  const openFile = async (): Promise<{ path: string; content: string } | null> => {
    const result = await open({ multiple: false, filters: MD_FILTERS });
    const selected = typeof result === "string" ? result : null;
    if (!selected) return null;
    const content = await readTextFile(selected);
    return { path: selected, content };
  };

  const openFilePath = async (path: string): Promise<string | null> => {
    try {
      return await readTextFile(path);
    } catch {
      return null;
    }
  };

  const saveFile = async (content: string, path: string): Promise<boolean> => {
    try {
      await writeTextFile(path, content);
      return true;
    } catch {
      return false;
    }
  };

  const saveFileAs = async (content: string, defaultPath?: string): Promise<string | null> => {
    const result = await save({ filters: MD_FILTERS, defaultPath: defaultPath ?? "untitled.md" });
    if (!result) return null;
    await writeTextFile(result, content);
    return result;
  };

  const exportFile = async (
    content: string,
    defaultPath: string,
    filters: { name: string; extensions: string[] }[]
  ): Promise<boolean> => {
    const result = await save({ filters, defaultPath });
    if (!result) return false;
    try { await writeTextFile(result, content); return true; } catch { return false; }
  };

  const exportBinaryFile = async (
    data: Uint8Array,
    defaultPath: string,
    filters: { name: string; extensions: string[] }[]
  ): Promise<boolean> => {
    const result = await save({ filters, defaultPath });
    if (!result) return false;
    try { await writeFile(result, data); return true; } catch { return false; }
  };

  return { openFile, openFilePath, saveFile, saveFileAs, exportFile, exportBinaryFile, recentFiles, addToRecent };
}
