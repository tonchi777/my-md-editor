import CodeMirror from "@uiw/react-codemirror";
import type { EditorView } from "@codemirror/view";
import { oneDark } from "@codemirror/theme-one-dark";
import { getExtensions } from "../lib/codemirrorSetup";

interface EditorProps {
  content: string;
  isDark: boolean;
  wordWrap: boolean;
  onChange: (value: string) => void;
  onEditorCreated?: (view: EditorView) => void;
}

export function Editor({ content, isDark, wordWrap, onChange, onEditorCreated }: EditorProps) {
  return (
    <div className="editor-pane">
      <CodeMirror
        value={content}
        theme={isDark ? oneDark : "light"}
        onChange={onChange}
        extensions={getExtensions(wordWrap)}
        basicSetup={false}
        height="100%"
        style={{ height: "100%", overflow: "hidden" }}
        onCreateEditor={onEditorCreated}
      />
    </div>
  );
}
