"use client";

import { useEffect, useRef } from "react";
import { common, createLowlight } from "lowlight";

const lowlight = createLowlight(common);

interface EssayRendererProps {
  content: string | null;
}

export default function EssayRenderer({ content }: EssayRendererProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;

    const codeBlocks = ref.current.querySelectorAll("pre code");
    codeBlocks.forEach((block) => {
      const text = block.textContent || "";

      // Try to detect language from class (e.g. "language-js")
      const langClass = Array.from(block.classList).find((c) =>
        c.startsWith("language-")
      );
      const lang = langClass?.replace("language-", "") || undefined;

      try {
        const result = lang
          ? lowlight.highlight(lang, text)
          : lowlight.highlightAuto(text);
        block.innerHTML = nodesToHtml(result.children);
        if (result.data?.language) {
          block.classList.add(`language-${result.data.language}`);
        }
      } catch {
        // If highlighting fails, leave the block as-is
      }
    });
  }, [content]);

  if (!content) return null;

  return (
    <>
      <div
        ref={ref}
        className="essay-body"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </>
  );
}

// Convert lowlight HAST nodes to HTML string
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function nodesToHtml(nodes: any[]): string {
  return nodes
    .map((node: any) => {
      if (node.type === "text") {
        return escapeHtml(node.value);
      }
      if (node.type === "element") {
        const classes = node.properties?.className;
        const classAttr =
          classes && Array.isArray(classes) && classes.length > 0
            ? ` class="${classes.join(" ")}"`
            : "";
        const children = nodesToHtml(node.children);
        return `<${node.tagName}${classAttr}>${children}</${node.tagName}>`;
      }
      return "";
    })
    .join("");
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
