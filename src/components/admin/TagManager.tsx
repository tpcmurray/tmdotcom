"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface Tag {
  id: string;
  name: string;
  count: number;
}

export default function TagManager({ tags: initialTags }: { tags: Tag[] }) {
  const router = useRouter();
  const [tags, setTags] = useState(initialTags);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [mergingId, setMergingId] = useState<string | null>(null);
  const [mergeTargetId, setMergeTargetId] = useState("");
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function startEdit(tag: Tag) {
    setEditingId(tag.id);
    setEditName(tag.name);
    setMergingId(null);
    setError(null);
  }

  function startMerge(tag: Tag) {
    setMergingId(tag.id);
    setMergeTargetId("");
    setEditingId(null);
    setError(null);
  }

  function cancel() {
    setEditingId(null);
    setMergingId(null);
    setError(null);
  }

  async function handleRename(id: string) {
    if (!editName.trim()) return;

    setLoading(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/tags/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to rename tag.");
        return;
      }

      const updated = await res.json();
      setTags(tags.map((t) => (t.id === id ? { ...t, name: updated.name } : t)));
      setEditingId(null);
      router.refresh();
    } catch {
      setError("Failed to rename tag.");
    } finally {
      setLoading(null);
    }
  }

  async function handleMerge(sourceId: string) {
    if (!mergeTargetId) return;

    const source = tags.find((t) => t.id === sourceId);
    const target = tags.find((t) => t.id === mergeTargetId);
    if (!source || !target) return;

    if (!confirm(`Merge "${source.name}" into "${target.name}"? This will delete "${source.name}".`)) {
      return;
    }

    setLoading(sourceId);
    setError(null);
    try {
      const res = await fetch("/api/admin/tags/merge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceId, targetId: mergeTargetId }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to merge tags.");
        return;
      }

      setTags(tags.filter((t) => t.id !== sourceId));
      setMergingId(null);
      router.refresh();
    } catch {
      setError("Failed to merge tags.");
    } finally {
      setLoading(null);
    }
  }

  async function handleDelete(tag: Tag) {
    if (!confirm(`Delete tag "${tag.name}"?`)) return;

    setLoading(tag.id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/tags/${tag.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to delete tag.");
        return;
      }

      setTags(tags.filter((t) => t.id !== tag.id));
      router.refresh();
    } catch {
      setError("Failed to delete tag.");
    } finally {
      setLoading(null);
    }
  }

  if (tags.length === 0) {
    return (
      <p className="font-meta text-[14px] text-ink-muted py-8 text-center">
        No tags found.
      </p>
    );
  }

  return (
    <div>
      {error && (
        <div className="font-meta text-[13px] text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2 mb-4">
          {error}
        </div>
      )}

      <ul className="list-none">
        {tags.map((tag) => (
          <li
            key={tag.id}
            className="flex items-center justify-between py-3 border-b border-edge/50"
          >
            <div className="flex-1 min-w-0">
              {editingId === tag.id ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleRename(tag.id);
                      if (e.key === "Escape") cancel();
                    }}
                    className="font-meta text-[14px] border border-edge rounded px-2 py-1 bg-card text-ink w-48"
                    autoFocus
                  />
                  <button
                    onClick={() => handleRename(tag.id)}
                    disabled={loading === tag.id}
                    className="font-meta text-[12px] px-2.5 py-1 rounded border border-edge bg-card text-brown hover:text-brown-light cursor-pointer disabled:opacity-50"
                  >
                    Save
                  </button>
                  <button
                    onClick={cancel}
                    className="font-meta text-[12px] px-2.5 py-1 rounded border border-edge bg-card text-ink-soft hover:text-ink cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              ) : mergingId === tag.id ? (
                <div className="flex items-center gap-2">
                  <span className="font-meta text-[14px] text-ink">{tag.name}</span>
                  <span className="font-meta text-[12px] text-ink-muted">→ merge into</span>
                  <select
                    value={mergeTargetId}
                    onChange={(e) => setMergeTargetId(e.target.value)}
                    className="font-meta text-[13px] border border-edge rounded px-2 py-1 bg-card text-ink"
                  >
                    <option value="">Select tag...</option>
                    {tags
                      .filter((t) => t.id !== tag.id)
                      .map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} ({t.count})
                        </option>
                      ))}
                  </select>
                  <button
                    onClick={() => handleMerge(tag.id)}
                    disabled={!mergeTargetId || loading === tag.id}
                    className="font-meta text-[12px] px-2.5 py-1 rounded border border-edge bg-card text-brown hover:text-brown-light cursor-pointer disabled:opacity-50"
                  >
                    Merge
                  </button>
                  <button
                    onClick={cancel}
                    className="font-meta text-[12px] px-2.5 py-1 rounded border border-edge bg-card text-ink-soft hover:text-ink cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="font-meta text-[14px] font-medium text-ink">
                    {tag.name}
                  </span>
                  <span className="font-meta text-[12px] text-ink-muted">
                    {tag.count} {tag.count === 1 ? "post" : "posts"}
                  </span>
                </div>
              )}
            </div>

            {editingId !== tag.id && mergingId !== tag.id && (
              <div className="flex gap-2 ml-4 shrink-0">
                <button
                  onClick={() => startEdit(tag)}
                  disabled={loading === tag.id}
                  className="font-meta text-[12px] px-2.5 py-1 rounded border border-edge bg-card text-ink-soft hover:text-ink cursor-pointer disabled:opacity-50"
                >
                  Rename
                </button>
                <button
                  onClick={() => startMerge(tag)}
                  disabled={loading === tag.id}
                  className="font-meta text-[12px] px-2.5 py-1 rounded border border-edge bg-card text-ink-soft hover:text-ink cursor-pointer disabled:opacity-50"
                >
                  Merge
                </button>
                <button
                  onClick={() => handleDelete(tag)}
                  disabled={tag.count > 0 || loading === tag.id}
                  title={tag.count > 0 ? "Cannot delete a tag with posts" : "Delete tag"}
                  className="font-meta text-[12px] px-2.5 py-1 rounded border border-edge bg-card text-ink-soft hover:text-red-700 hover:border-red-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Delete
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
