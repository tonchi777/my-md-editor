import { useMemo } from "react";
import DOMPurify from "dompurify";
import { renderMarkdown } from "../lib/markdownRenderer";

export function useMarkdown(content: string): string {
  return useMemo(() => {
    const raw = renderMarkdown(content);
    return DOMPurify.sanitize(raw, {
      ADD_TAGS: [
        "math", "maction", "mfrac", "mi", "mn", "mo", "mover",
        "mphantom", "mrow", "ms", "mspace", "msqrt", "mstyle",
        "msub", "msubsup", "msup", "mtable", "mtd", "mtext",
        "mtr", "munder", "munderover", "semantics", "annotation",
      ],
      ADD_ATTR: ["encoding", "columnalign"],
    });
  }, [content]);
}
