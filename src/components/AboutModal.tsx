import { X } from "lucide-react";

interface AboutModalProps {
  onClose: () => void;
}

export function AboutModal({ onClose }: AboutModalProps) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal about-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">About</span>
          <button className="toolbar-btn modal-close" onClick={onClose}>
            <X size={16} />
          </button>
        </div>
        <div className="modal-body about-body">
          <div className="about-icon-wrap">
            <img src="/app-icon.png" alt="Pasulong MD" className="about-icon" />
          </div>
          <div className="about-name">Pasulong MD</div>
          <div className="about-version">Version 0.1.0</div>
          <div className="about-tagline">A lightweight desktop Markdown editor.</div>
          <div className="about-stack">
            Built by Tonchi with Claude Code
          </div>
        </div>
      </div>
    </div>
  );
}
