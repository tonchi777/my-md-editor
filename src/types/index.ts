export interface FileState {
  path: string | null;
  content: string;
  savedContent: string;
  isSaving: boolean;
}

export type Theme = "light" | "dark";
