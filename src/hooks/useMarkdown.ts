import { useMemo } from "react";
import DOMPurify from "dompurify";
import { renderMarkdown } from "../lib/markdownRenderer";

export function useMarkdown(content: string): string {
  return useMemo(() => {
    const raw = renderMarkdown(content);
    return DOMPurify.sanitize(raw);
  }, [content]);
}
