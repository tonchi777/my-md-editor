import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useMarkdown } from "../hooks/useMarkdown";
import changelogRaw from "../../CHANGELOG.md?raw";
import pkg from "../../package.json";

interface HelpModalProps {
  initialTab?: HelpTab;
  onClose: () => void;
}

export type HelpTab = "shortcuts" | "reference" | "changelog" | "about";

const TABS: { id: HelpTab; label: string }[] = [
  { id: "shortcuts", label: "Shortcuts" },
  { id: "reference", label: "Markdown" },
  { id: "changelog", label: "Changelog" },
  { id: "about",     label: "About" },
];

const SHORTCUTS = [
  { key: "Ctrl+O",         action: "Open file" },
  { key: "Ctrl+S",         action: "Save" },
  { key: "Ctrl+Shift+S",   action: "Save As" },
  { key: "Ctrl+N",         action: "New file (in active tab)" },
  { key: "Ctrl+T",         action: "New tab" },
  { key: "Ctrl+W",         action: "Close tab" },
  { key: "Ctrl+Tab",       action: "Next tab" },
  { key: "Ctrl+Shift+Tab", action: "Previous tab" },
  { key: "Ctrl+F",         action: "Find & Replace" },
  { key: "F1",             action: "This help modal" },
  { key: "F11",            action: "Toggle distraction-free mode" },
  { key: "Esc",            action: "Exit distraction-free mode" },
];

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
      { syntax: "- item",     result: "Unordered list (also * or +)" },
      { syntax: "1. item",    result: "Ordered list" },
      { syntax: "  - item",   result: "Nested list (indent 2 spaces)" },
      { syntax: "- [ ] task", result: "Task list (unchecked)" },
      { syntax: "- [x] task", result: "Task list (checked)" },
    ],
  },
  {
    title: "Links & Images",
    items: [
      { syntax: "[text](url)",           result: "Hyperlink" },
      { syntax: "[text](url \"title\")", result: "Link with tooltip" },
      { syntax: "![alt](url)",           result: "Image" },
      { syntax: "<https://url>",         result: "Auto-link" },
    ],
  },
  {
    title: "Code",
    items: [
      { syntax: "`inline code`",     result: "Inline code" },
      { syntax: "```js\ncode\n```",  result: "Fenced code block" },
      { syntax: "    indented line", result: "Code block (4 spaces)" },
    ],
  },
  {
    title: "Blockquote & Rule",
    items: [
      { syntax: "> quoted text", result: "Blockquote" },
      { syntax: ">> nested",     result: "Nested blockquote" },
      { syntax: "---",           result: "Horizontal rule (also *** or ___)" },
    ],
  },
  {
    title: "Tables",
    items: [
      { syntax: "| A | B |\n|---|---|\n| 1 | 2 |", result: "Table (header | separator | rows)" },
      { syntax: ":---",  result: "Left-align column" },
      { syntax: ":---:", result: "Center-align column" },
      { syntax: "---:",  result: "Right-align column" },
    ],
  },
  {
    title: "Miscellaneous",
    items: [
      { syntax: "\\*escaped\\*",    result: "Escape special characters with \\" },
      { syntax: "<!-- comment -->", result: "HTML comment (hidden)" },
      { syntax: "text  ",           result: "Line break (two trailing spaces)" },
      { syntax: "&amp; &lt; &gt;",  result: "HTML entities" },
    ],
  },
];

export function HelpModal({ initialTab = "shortcuts", onClose }: HelpModalProps) {
  const [activeTab, setActiveTab] = useState<HelpTab>(initialTab);
  const changelogHtml = useMarkdown(changelogRaw);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal help-modal"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Help"
      >
        <div className="modal-header">
          <span className="modal-title">Help</span>
          <button className="modal-close toolbar-btn" onClick={onClose} title="Close (Esc)">
            <X size={16} />
          </button>
        </div>

        <div className="modal-tab-bar">
          {TABS.map(tab => (
            <button
              key={tab.id}
              className={`modal-tab${activeTab === tab.id ? " modal-tab-active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="modal-body">
          {activeTab === "shortcuts" && (
            <table className="help-table">
              <tbody>
                {SHORTCUTS.map(s => (
                  <tr key={s.key}>
                    <td className="help-syntax"><pre>{s.key}</pre></td>
                    <td className="help-result">{s.action}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeTab === "reference" && SECTIONS.map(section => (
            <section key={section.title} className="help-section">
              <h3 className="help-section-title">{section.title}</h3>
              <table className="help-table">
                <tbody>
                  {section.items.map(item => (
                    <tr key={item.syntax}>
                      <td className="help-syntax"><pre>{item.syntax}</pre></td>
                      <td className="help-result">{item.result}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          ))}

          {activeTab === "changelog" && (
            <div
              className="modal-md"
              dangerouslySetInnerHTML={{ __html: changelogHtml }}
            />
          )}

          {activeTab === "about" && (
            <div className="about-tab">
              <div className="about-icon-wrap">
                <img src="/app-icon.png" alt="Pasulong MD" className="about-icon" />
              </div>
              <div className="about-name">Pasulong MD</div>
              <div className="about-version">Version {pkg.version}</div>
              <div className="about-tagline">A lightweight desktop Markdown editor.</div>
              <div className="about-stack">Built by Tonchi with Claude Code</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
