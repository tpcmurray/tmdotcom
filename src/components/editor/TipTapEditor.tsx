"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Typography from "@tiptap/extension-typography";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { common, createLowlight } from "lowlight";
import { Markdown } from "tiptap-markdown";
import { useCallback, useEffect, useState } from "react";

const lowlight = createLowlight(common);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getMarkdownFromEditor(editor: any): string {
  return editor.storage.markdown.getMarkdown();
}

interface TipTapEditorProps {
  content: string;
  onUpdate: (html: string) => void;
  onMarkdownUpdate?: (md: string) => void;
  onImageUpload?: (file: File) => Promise<string>;
}

function ToolbarButton({
  onClick,
  active,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`editor-toolbar-btn${active ? " active" : ""}`}
    >
      {children}
    </button>
  );
}

function ToolbarDivider() {
  return <div className="editor-toolbar-divider" />;
}

export default function TipTapEditor({
  content,
  onUpdate,
  onMarkdownUpdate,
  onImageUpload,
}: TipTapEditorProps) {
  const [showMarkdown, setShowMarkdown] = useState(false);
  const [markdownSource, setMarkdownSource] = useState("");

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        codeBlock: false, // replaced by CodeBlockLowlight
      }),
      CodeBlockLowlight.configure({
        lowlight,
        defaultLanguage: "plaintext",
      }),
      Image,
      Link.configure({
        openOnClick: false,
        autolink: true,
      }),
      Placeholder.configure({
        placeholder: "Start writing...",
      }),
      Typography,
      Markdown.configure({
        html: true,
        transformPastedText: false,
        transformCopiedText: false,
      }),
    ],
    content,
    onUpdate: ({ editor: e }) => {
      onUpdate(e.getHTML());
      if (onMarkdownUpdate) {
        onMarkdownUpdate(getMarkdownFromEditor(e));
      }
    },
    editorProps: {
      handleDrop: (view, event, _slice, moved) => {
        if (moved || !onImageUpload) return false;
        const files = event.dataTransfer?.files;
        if (!files?.length) return false;

        const imageFile = Array.from(files).find((f) =>
          f.type.startsWith("image/")
        );
        if (!imageFile) return false;

        event.preventDefault();
        onImageUpload(imageFile).then((url) => {
          const { schema } = view.state;
          const node = schema.nodes.image.create({ src: url });
          const pos = view.posAtCoords({
            left: event.clientX,
            top: event.clientY,
          });
          if (pos) {
            const tr = view.state.tr.insert(pos.pos, node);
            view.dispatch(tr);
          }
        });
        return true;
      },
      handlePaste: (_view, event) => {
        if (!onImageUpload) return false;
        const items = event.clipboardData?.items;
        if (!items) return false;

        const imageItem = Array.from(items).find((item) =>
          item.type.startsWith("image/")
        );
        if (!imageItem) return false;

        const file = imageItem.getAsFile();
        if (!file) return false;

        event.preventDefault();
        onImageUpload(file).then((url) => {
          if (editor) {
            editor.chain().focus().setImage({ src: url }).run();
          }
        });
        return true;
      },
    },
  });

  // Sync content when initialData changes (e.g., navigating to edit page)
  useEffect(() => {
    if (editor && content && editor.getHTML() !== content) {
      editor.commands.setContent(content);
    }
    // Only run when content prop changes from parent (initial load)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor]);

  const handleLink = useCallback(() => {
    if (!editor) return;
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("Enter URL:", previousUrl || "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
    } else {
      editor
        .chain()
        .focus()
        .extendMarkRange("link")
        .setLink({ href: url })
        .run();
    }
  }, [editor]);

  const handleImage = useCallback(() => {
    if (!editor) return;
    if (onImageUpload) {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/jpeg,image/png,image/gif,image/webp";
      input.onchange = async () => {
        const file = input.files?.[0];
        if (!file) return;
        const url = await onImageUpload(file);
        editor.chain().focus().setImage({ src: url }).run();
      };
      input.click();
    } else {
      const url = window.prompt("Enter image URL:", "https://");
      if (url) {
        editor.chain().focus().setImage({ src: url }).run();
      }
    }
  }, [editor, onImageUpload]);

  const toggleMarkdown = useCallback(() => {
    if (!editor) return;
    if (!showMarkdown) {
      // Switching to markdown view
      setMarkdownSource(getMarkdownFromEditor(editor));
      setShowMarkdown(true);
    } else {
      // Switching back to WYSIWYG — apply markdown edits
      editor.commands.setContent(markdownSource);
      onUpdate(editor.getHTML());
      if (onMarkdownUpdate) {
        onMarkdownUpdate(markdownSource);
      }
      setShowMarkdown(false);
    }
  }, [editor, showMarkdown, markdownSource, onUpdate, onMarkdownUpdate]);

  if (!editor) return null;

  return (
    <div>
      <div className="editor-toolbar">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive("bold")}
        >
          B
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive("italic")}
        >
          I
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          active={editor.isActive("strike")}
        >
          S
        </ToolbarButton>

        <ToolbarDivider />

        <ToolbarButton
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 1 }).run()
          }
          active={editor.isActive("heading", { level: 1 })}
        >
          H1
        </ToolbarButton>
        <ToolbarButton
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          active={editor.isActive("heading", { level: 2 })}
        >
          H2
        </ToolbarButton>
        <ToolbarButton
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
          active={editor.isActive("heading", { level: 3 })}
        >
          H3
        </ToolbarButton>

        <ToolbarDivider />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive("bulletList")}
        >
          &bull; List
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive("orderedList")}
        >
          1. List
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive("blockquote")}
        >
          &ldquo; Quote
        </ToolbarButton>

        <ToolbarDivider />

        <ToolbarButton onClick={handleLink} active={editor.isActive("link")}>
          Link
        </ToolbarButton>
        <ToolbarButton onClick={handleImage}>Image</ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          active={editor.isActive("codeBlock")}
        >
          {"{ } Code"}
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
        >
          &mdash; Rule
        </ToolbarButton>

        <ToolbarDivider />

        <ToolbarButton onClick={toggleMarkdown} active={showMarkdown}>
          {showMarkdown ? "WYSIWYG" : "Markdown"}
        </ToolbarButton>
      </div>

      {showMarkdown ? (
        <textarea
          value={markdownSource}
          onChange={(e) => setMarkdownSource(e.target.value)}
          className="editor-markdown-textarea"
          spellCheck={false}
        />
      ) : (
        <div className="editor-body">
          <EditorContent editor={editor} />
        </div>
      )}
    </div>
  );
}
