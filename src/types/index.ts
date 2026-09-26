export type Theme = "light" | "dark";

export interface Tab {
  id: string;
  content: string;
  savedContent: string;
  path: string | null;
  label?: string;
  /** Newer on-disk content that conflicts with unsaved edits, awaiting Reload / Keep mine. */
  diskContent?: string;
  /** The file was deleted or moved on disk while open. */
  diskDeleted?: boolean;
}
