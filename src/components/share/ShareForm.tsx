"use client";

import { useState, useEffect, useCallback } from "react";
import TagInput from "@/components/editor/TagInput";
import Button from "@/components/ui/Button";

interface ShareFormProps {
  initialUrl: string;
  initialTitle: string;
}

export default function ShareForm({ initialUrl, initialTitle }: ShareFormProps) {
  const [url] = useState(initialUrl);
  const [title, setTitle] = useState(initialTitle);
  const [notes, setNotes] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [postId, setPostId] = useState<string | null>(null);
  const [fetchingTitle, setFetchingTitle] = useState(false);

  // Auto-fetch title if not provided
  useEffect(() => {
    if (initialTitle || !initialUrl) return;

    setFetchingTitle(true);
    fetch(`/api/title?url=${encodeURIComponent(initialUrl)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.title) setTitle(data.title);
      })
      .catch(() => {
        // Leave title empty on error
      })
      .finally(() => setFetchingTitle(false));
  }, [initialUrl, initialTitle]);

  const handleSave = useCallback(async () => {
    if (!title.trim()) return;

    setSaving(true);
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "LOG",
          title: title.trim(),
          url: url || null,
          content: notes.trim() || null,
          status: "PUBLISHED",
          tags,
        }),
      });

      if (!res.ok) throw new Error("Save failed");

      const post = await res.json();
      setPostId(post.id);
      setSaved(true);
    } catch {
      alert("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  }, [title, url, notes, tags]);

  if (saved) {
    return (
      <div className="share-success">
        <div className="share-success-icon">&#10003;</div>
        <div className="share-success-title">Saved</div>
        <p className="share-success-text">Added to your reading log</p>
        <div className="share-success-actions">
          <a href={`/post/${postId}`} className="share-success-link">
            View on site
          </a>
          <a href="/" className="share-success-link">
            Back to feed
          </a>
        </div>
      </div>
    );
  }

  return (
    <div>
      {url && (
        <div className="share-form-group">
          <label className="share-form-label">URL</label>
          <div className="share-url-display">{url}</div>
        </div>
      )}

      <div className="share-form-group">
        <label className="share-form-label">Title</label>
        {fetchingTitle ? (
          <div className="share-form-input text-ink-muted">
            Fetching title...
          </div>
        ) : (
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter a title..."
            className="share-form-input"
          />
        )}
      </div>

      <div className="share-form-group">
        <label className="share-form-label">Notes (optional)</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Quick thoughts on this article..."
          className="share-form-textarea"
          rows={4}
        />
      </div>

      <TagInput tags={tags} onChange={setTags} />

      <div className="mt-6">
        <Button
          onClick={handleSave}
          disabled={saving || !title.trim()}
        >
          {saving ? "Saving..." : "Save to Reading Log"}
        </Button>
      </div>
    </div>
  );
}
