import CodeMirror from "@uiw/react-codemirror";
import { getExtensions } from "../lib/codemirrorSetup";

interface EditorProps {
  content: string;
  isDark: boolean;
  onChange: (value: string) => void;
}

export function Editor({ content, isDark, onChange }: EditorProps) {
  return (
    <div className="editor-pane">
      <CodeMirror
        value={content}
        onChange={onChange}
        extensions={getExtensions(isDark)}
        basicSetup={false}
        height="100%"
        style={{ height: "100%", overflow: "hidden" }}
      />
    </div>
  );
}
