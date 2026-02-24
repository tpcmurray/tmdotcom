"use client";

import { useState } from "react";

interface TagWithCount {
  id: string;
  name: string;
  count: number;
}

interface MobileBioBarProps {
  tags: TagWithCount[];
  activeTag: string | null;
  onTagChange: (tag: string | null) => void;
}

export default function MobileBioBar({
  tags,
  activeTag,
  onTagChange,
}: MobileBioBarProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="md:hidden">
      {/* Collapsed bar */}
      <div className="mobile-bio-bar" onClick={() => setExpanded((v) => !v)}>
        <div className="mobile-bio-avatar">TM</div>
        <div className="mobile-bio-summary">
          <div className="mobile-bio-name">Terry Murray</div>
        </div>
        <div className="mobile-bio-expand">
          About {expanded ? "\u25B4" : "\u25BE"}
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="mobile-bio-expanded">
          <div className="mobile-bio-expanded-text">
            Building with LLMs since ChatGPT launched in November 2022, and I
            haven&apos;t shut up about them since.
          </div>
          <div className="mobile-bio-expanded-text">
            What I&apos;m reading, watching, and thinking about in AI. I log it
            all here with my notes. Sometimes I write longer pieces when an idea
            won&apos;t leave me alone.
          </div>
          <div className="mobile-bio-expanded-tagline">
            If you work with me, this is the answer to &ldquo;what should I be
            reading?&rdquo;
          </div>
        </div>
      )}

      {/* Mobile tag row */}
      {tags.length > 0 && (
        <div
          className="flex gap-1.5 overflow-x-auto py-3 border-b border-edge/50"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {tags.map((tag) => (
            <span
              key={tag.id}
              className={`sidebar-tag whitespace-nowrap${activeTag === tag.name ? " active" : ""}`}
              onClick={() =>
                onTagChange(activeTag === tag.name ? null : tag.name)
              }
            >
              {tag.name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
