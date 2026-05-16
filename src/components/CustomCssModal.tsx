import { useEffect, useState } from "react";
import { X } from "lucide-react";

interface CustomCssModalProps {
  initialCss: string;
  onSave: (css: string) => void;
  onClose: () => void;
}

export function CustomCssModal({ initialCss, onSave, onClose }: CustomCssModalProps) {
  const [value, setValue] = useState(initialCss);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Custom Preview CSS"
      >
        <div className="modal-header">
          <span className="modal-title">Custom Preview CSS</span>
          <button className="modal-close toolbar-btn" onClick={onClose} title="Close (Esc)">
            <X size={16} />
          </button>
        </div>
        <div className="modal-body">
          <p className="custom-css-hint">
            CSS applied on top of the preview pane. Also included in HTML exports.
            Target the container with <code>.preview-pane</code>.
          </p>
          <textarea
            className="custom-css-textarea"
            value={value}
            onChange={e => setValue(e.target.value)}
            placeholder={`.preview-pane {\n  font-family: Georgia, serif;\n}\n.preview-pane h1 {\n  color: #e53e3e;\n}`}
            spellCheck={false}
          />
        </div>
        <div className="modal-footer">
          <button className="modal-btn" onClick={onClose}>Cancel</button>
          <button className="modal-btn modal-btn-primary" onClick={() => { onSave(value); onClose(); }}>
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
