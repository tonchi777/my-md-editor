import { AlertTriangle } from "lucide-react";

interface DiskChangeBannerProps {
  kind: "changed" | "deleted";
  onReload: () => void;
  onKeepMine: () => void;
  onSave: () => void;
  onDismiss: () => void;
}

export function DiskChangeBanner({ kind, onReload, onKeepMine, onSave, onDismiss }: DiskChangeBannerProps) {
  return (
    <div className="disk-banner" role="alert">
      <AlertTriangle size={14} className="disk-banner-icon" />
      {kind === "changed" ? (
        <>
          <span className="disk-banner-text">This file was changed on disk, and you have unsaved edits.</span>
          <button className="modal-btn" onClick={onKeepMine} title="Keep your edits; saving will overwrite the file on disk">
            Keep mine
          </button>
          <button className="modal-btn modal-btn-primary" onClick={onReload} title="Discard your edits and load the version on disk">
            Reload
          </button>
        </>
      ) : (
        <>
          <span className="disk-banner-text">This file was deleted or moved on disk.</span>
          <button className="modal-btn" onClick={onDismiss}>Dismiss</button>
          <button className="modal-btn modal-btn-primary" onClick={onSave} title="Write the file back to its original location">
            Save to restore
          </button>
        </>
      )}
    </div>
  );
}
