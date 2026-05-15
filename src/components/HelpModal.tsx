import { useEffect } from "react";
import { X } from "lucide-react";

interface HelpModalProps {
  onClose: () => void;
}

const SECTIONS = [
  {
    title: "Headings",
    items: [
      { syntax: "# Heading 1",   result: "Largest heading" },
      { syntax: "## Heading 2",  result: "Second level" },
      { syntax: "### Heading 3", result: "Third level" },
    ],
  },
  {
    title: "Emphasis",
    items: [
      { syntax: "**bold**",          result: "Bold text" },
      { syntax: "*italic*",          result: "Italic text" },
      { syntax: "~~strikethrough~~", result: "Strikethrough" },
      { syntax: "**_bold italic_**", result: "Bold + italic" },
    ],
  },
  {
    title: "Lists",
    items: [
      { syntax: "- item",    result: "Unordered list (also * or +)" },
      { syntax: "1. item",   result: "Ordered list" },
      { syntax: "  - item",  result: "Nested list (indent 2 spaces)" },
      { syntax: "- [ ] task", result: "Task list (unchecked)" },
      { syntax: "- [x] task", result: "Task list (checked)" },
    ],
  },
  {
    title: "Links & Images",
    items: [
      { syntax: "[text](url)",          result: "Hyperlink" },
      { syntax: "[text](url \"title\")", result: "Link with tooltip" },
      { syntax: "![alt](url)",          result: "Image" },
      { syntax: "<https://url>",        result: "Auto-link" },
    ],
  },
  {
    title: "Code",
    items: [
      { syntax: "`inline code`",         result: "Inline code" },
      { syntax: "```js\ncode\n```",      result: "Fenced code block" },
      { syntax: "    indented line",     result: "Code block (4 spaces)" },
    ],
  },
  {
    title: "Blockquote & Rule",
    items: [
      { syntax: "> quoted text",  result: "Blockquote" },
      { syntax: ">> nested",      result: "Nested blockquote" },
      { syntax: "---",            result: "Horizontal rule (also *** or ___)" },
    ],
  },
  {
    title: "Tables",
    items: [
      {
        syntax: "| A | B |\n|---|---|\n| 1 | 2 |",
        result: "Table (header | separator | rows)",
      },
      { syntax: ":---",  result: "Left-align column" },
      { syntax: ":---:", result: "Center-align column" },
      { syntax: "---:",  result: "Right-align column" },
    ],
  },
  {
    title: "Miscellaneous",
    items: [
      { syntax: "\\*escaped\\*",       result: "Escape special characters with \\" },
      { syntax: "<!-- comment -->",    result: "HTML comment (hidden)" },
      { syntax: "text  ",              result: "Line break (two trailing spaces)" },
      { syntax: "&amp; &lt; &gt;",     result: "HTML entities" },
    ],
  },
];

export function HelpModal({ onClose }: HelpModalProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Markdown Reference">
        <div className="modal-header">
          <span className="modal-title">Markdown Reference</span>
          <button className="modal-close toolbar-btn" onClick={onClose} title="Close (Esc)">
            <X size={16} />
          </button>
        </div>
        <div className="modal-body">
          {SECTIONS.map(section => (
            <section key={section.title} className="help-section">
              <h3 className="help-section-title">{section.title}</h3>
              <table className="help-table">
                <tbody>
                  {section.items.map(item => (
                    <tr key={item.syntax}>
                      <td className="help-syntax">
                        <pre>{item.syntax}</pre>
                      </td>
                      <td className="help-result">{item.result}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
