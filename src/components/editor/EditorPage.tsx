"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import TipTapEditor from "./TipTapEditor";
import TagInput from "./TagInput";
import SaveBar from "./SaveBar";

interface InitialData {
  id: string;
  title: string;
  content: string | null;
  contentMarkdown: string | null;
  status: "DRAFT" | "PUBLISHED";
  tags: { id: string; name: string }[];
}

interface EditorPageProps {
  initialData?: InitialData;
}

type SaveState = "idle" | "saving" | "saved" | "error";

const AUTO_SAVE_INTERVAL = 30_000; // 30 seconds

export default function EditorPage({ initialData }: EditorPageProps) {
  const router = useRouter();
  const [postId, setPostId] = useState<string | null>(
    initialData?.id ?? null
  );
  const [title, setTitle] = useState(initialData?.title ?? "");
  const [content, setContent] = useState(initialData?.content ?? "");
  const [tags, setTags] = useState<string[]>(
    initialData?.tags.map((t) => t.name) ?? []
  );
  const [status, setStatus] = useState<"DRAFT" | "PUBLISHED">(
    initialData?.status ?? "DRAFT"
  );
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  // Refs for auto-save to avoid stale closures
  const titleRef = useRef(title);
  const contentRef = useRef(content);
  const tagsRef = useRef(tags);
  const statusRef = useRef(status);
  const postIdRef = useRef(postId);
  const isDirtyRef = useRef(isDirty);
  const markdownRef = useRef<string | null>(initialData?.contentMarkdown ?? null);

  titleRef.current = title;
  contentRef.current = content;
  tagsRef.current = tags;
  statusRef.current = status;
  postIdRef.current = postId;
  isDirtyRef.current = isDirty;

  const save = useCallback(
    async (overrideStatus?: "DRAFT" | "PUBLISHED") => {
      const currentTitle = titleRef.current.trim();
      if (!currentTitle) return;

      const saveStatus = overrideStatus ?? statusRef.current;
      setSaveState("saving");

      try {
        const body = {
          type: "ESSAY" as const,
          title: currentTitle,
          content: contentRef.current,
          contentMarkdown: markdownRef.current,
          status: saveStatus,
          tags: tagsRef.current,
        };

        let res: Response;
        if (postIdRef.current) {
          res = await fetch(`/api/posts/${postIdRef.current}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });
        } else {
          res = await fetch("/api/posts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });
        }

        if (!res.ok) {
          throw new Error(`Save failed: ${res.status}`);
        }

        const data = await res.json();

        if (!postIdRef.current && data.id) {
          setPostId(data.id);
          postIdRef.current = data.id;
          router.replace(`/admin/write/${data.id}`);
        }

        if (overrideStatus) {
          setStatus(overrideStatus);
          statusRef.current = overrideStatus;
        }

        setIsDirty(false);
        isDirtyRef.current = false;
        setSaveState("saved");
        setLastSaved(new Date());
      } catch (error) {
        console.error("Save error:", error);
        setSaveState("error");
      }
    },
    [router]
  );

  // Auto-save interval
  useEffect(() => {
    const interval = setInterval(() => {
      if (isDirtyRef.current && titleRef.current.trim()) {
        save();
      }
    }, AUTO_SAVE_INTERVAL);

    return () => clearInterval(interval);
  }, [save]);

  // Mark dirty on changes
  const handleTitleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setTitle(e.target.value);
      setIsDirty(true);
      if (saveState === "saved") setSaveState("idle");
    },
    [saveState]
  );

  const handleContentUpdate = useCallback(
    (html: string) => {
      setContent(html);
      setIsDirty(true);
      if (saveState === "saved") setSaveState("idle");
    },
    [saveState]
  );

  const handleMarkdownUpdate = useCallback(
    (md: string) => {
      contentRef.current = content; // keep HTML in sync via ref
      // Store markdown for saving
      markdownRef.current = md;
      setIsDirty(true);
      if (saveState === "saved") setSaveState("idle");
    },
    [saveState, content]
  );

  const handleTagsChange = useCallback(
    (newTags: string[]) => {
      setTags(newTags);
      setIsDirty(true);
      if (saveState === "saved") setSaveState("idle");
    },
    [saveState]
  );

  const handleSave = useCallback(() => save(), [save]);
  const handlePublish = useCallback(() => save("PUBLISHED"), [save]);
  const handleUnpublish = useCallback(() => save("DRAFT"), [save]);

  const handlePreview = useCallback(() => {
    if (postId) {
      window.open(`/post/${postId}`, "_blank");
    }
  }, [postId]);

  const handleImageUpload = useCallback(async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });
    if (!res.ok) {
      throw new Error("Upload failed");
    }
    const data = await res.json();
    return data.url;
  }, []);

  // Update lastSaved display every 10s
  const [, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 10_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="page-content py-8">
      <SaveBar
        status={status}
        saveState={saveState}
        lastSaved={lastSaved}
        isDirty={isDirty}
        onSave={handleSave}
        onPublish={handlePublish}
        onUnpublish={handleUnpublish}
        onPreview={handlePreview}
        postId={postId}
      />

      <input
        type="text"
        value={title}
        onChange={handleTitleChange}
        placeholder="Essay title..."
        className="editor-title-input"
      />

      <TipTapEditor
        content={content}
        onUpdate={handleContentUpdate}
        onMarkdownUpdate={handleMarkdownUpdate}
        onImageUpload={handleImageUpload}
      />

      <TagInput tags={tags} onChange={handleTagsChange} />
    </div>
  );
}
