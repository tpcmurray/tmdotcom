"use client";

import Button from "@/components/ui/Button";

interface SaveBarProps {
  status: "DRAFT" | "PUBLISHED";
  saveState: "idle" | "saving" | "saved" | "error";
  lastSaved: Date | null;
  isDirty: boolean;
  onSave: () => void;
  onPublish: () => void;
  onUnpublish: () => void;
  onPreview: () => void;
  postId: string | null;
}

function formatTimeSince(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 5) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  return date.toLocaleTimeString();
}

export default function SaveBar({
  status,
  saveState,
  lastSaved,
  isDirty,
  onSave,
  onPublish,
  onUnpublish,
  onPreview,
  postId,
}: SaveBarProps) {
  const statusLabel = status === "DRAFT" ? "Draft" : "Published";
  const statusClass = status === "DRAFT" ? "draft" : "published";

  let saveText = "";
  if (saveState === "saving") saveText = "Saving...";
  else if (saveState === "saved" && lastSaved)
    saveText = `Saved ${formatTimeSince(lastSaved)}`;
  else if (saveState === "error") saveText = "Save failed";
  else if (saveState === "idle" && lastSaved) saveText = "Unsaved changes";

  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <span className={`status-badge ${statusClass}`}>{statusLabel}</span>
        {saveText && (
          <span
            className={`font-meta text-[12px] ${
              saveState === "error" ? "text-red-600" : "text-ink-muted"
            }`}
          >
            {saveText}
          </span>
        )}
      </div>

      <div className="flex gap-2">
        <Button
          variant="ghost"
          onClick={onSave}
          disabled={!isDirty || saveState === "saving"}
          className="text-[13px] px-3 py-1.5"
        >
          Save
        </Button>
        <Button
          variant="ghost"
          onClick={onPreview}
          disabled={!postId}
          className="text-[13px] px-3 py-1.5"
        >
          Preview
        </Button>
        {status === "DRAFT" ? (
          <Button
            variant="primary"
            onClick={onPublish}
            className="text-[13px] px-3 py-1.5"
          >
            Publish
          </Button>
        ) : (
          <Button
            variant="ghost"
            onClick={onUnpublish}
            className="text-[13px] px-3 py-1.5"
          >
            Unpublish
          </Button>
        )}
      </div>
    </div>
  );
}
