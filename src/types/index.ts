export type Theme = "light" | "dark";

export interface Tab {
  id: string;
  content: string;
  savedContent: string;
  path: string | null;
  label?: string;
}
