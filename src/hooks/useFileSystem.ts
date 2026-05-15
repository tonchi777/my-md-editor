import { useState } from "react";
import { open, save } from "@tauri-apps/plugin-dialog";
import { readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";

const MD_FILTERS = [{ name: "Markdown", extensions: ["md", "markdown", "txt"] }];

export function useFileSystem() {
  const [currentPath, setCurrentPath] = useState<string | null>(null);

  const openFile = async (): Promise<{ path: string; content: string } | null> => {
    const result = await open({ multiple: false, filters: MD_FILTERS });
    const selected = typeof result === "string" ? result : null;
    if (!selected) return null;
    const content = await readTextFile(selected);
    setCurrentPath(selected);
    return { path: selected, content };
  };

  const saveFile = async (content: string, path: string): Promise<boolean> => {
    try {
      await writeTextFile(path, content);
      return true;
    } catch {
      return false;
    }
  };

  const saveFileAs = async (content: string): Promise<string | null> => {
    const result = await save({ filters: MD_FILTERS, defaultPath: "untitled.md" });
    if (!result) return null;
    await writeTextFile(result, content);
    setCurrentPath(result);
    return result;
  };

  return { currentPath, setCurrentPath, openFile, saveFile, saveFileAs };
}
