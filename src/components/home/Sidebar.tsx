interface TagWithCount {
  id: string;
  name: string;
  count: number;
}

interface SidebarProps {
  tags: TagWithCount[];
  activeTag: string | null;
  onTagChange: (tag: string | null) => void;
}

export default function Sidebar({ tags, activeTag, onTagChange }: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="sidebar-bio-name">Terry Murray</div>
      <div className="sidebar-bio-text">
        Senior Director of AI at Verafin (Nasdaq). Building with LLMs since
        ChatGPT launched in November 2022.
      </div>
      <div className="sidebar-bio-text">
        What I&apos;m reading, watching, and thinking about in AI. Sometimes I
        write longer pieces when an idea won&apos;t leave me alone.
      </div>
      <div className="sidebar-bio-tagline">
        If you work with me, this is the answer to &ldquo;what should I be
        reading?&rdquo;
      </div>

      {tags.length > 0 && (
        <>
          <div className="sidebar-section-label">Topics</div>
          <div className="sidebar-tags">
            {tags.map((tag) => (
              <span
                key={tag.id}
                className={`sidebar-tag${activeTag === tag.name ? " active" : ""}`}
                onClick={() =>
                  onTagChange(activeTag === tag.name ? null : tag.name)
                }
              >
                {tag.name}
              </span>
            ))}
          </div>
        </>
      )}
    </aside>
  );
}
