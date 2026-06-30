import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

interface RenameModalProps {
  currentLabel: string;
  onSave: (label: string) => void;
  onClose: () => void;
}

export function RenameModal({ currentLabel, onSave, onClose }: RenameModalProps) {
  const [name, setName] = useState(currentLabel);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Enter" && name.trim()) onSave(name.trim());
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [name, onSave, onClose]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal"
        style={{ maxWidth: 360 }}
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Rename tab"
      >
        <div className="modal-header">
          <span className="modal-title">Rename tab</span>
          <button className="modal-close toolbar-btn" onClick={onClose} title="Close (Esc)">
            <X size={16} />
          </button>
        </div>
        <div className="modal-body" style={{ gap: 12 }}>
          <input
            ref={inputRef}
            className="rename-input"
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Tab name"
          />
          <div className="modal-footer" style={{ padding: "0 0 4px" }}>
            <button className="modal-btn" onClick={onClose}>Cancel</button>
            <button
              className="modal-btn modal-btn-primary"
              disabled={!name.trim()}
              onClick={() => { if (name.trim()) onSave(name.trim()); }}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
