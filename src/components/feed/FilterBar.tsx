"use client";

import { useEffect, useState } from "react";
import TagPill from "@/components/ui/TagPill";
import SearchInput from "@/components/ui/SearchInput";

type FilterType = "all" | "LOG" | "ESSAY";

interface TagWithCount {
  id: string;
  name: string;
  count: number;
}

interface FilterBarProps {
  activeType: FilterType;
  activeTag: string | null;
  onTypeChange: (type: FilterType) => void;
  onTagChange: (tag: string | null) => void;
  onSearchChange: (search: string) => void;
}

const TYPE_LABELS: { value: FilterType; label: string }[] = [
  { value: "all", label: "All" },
  { value: "LOG", label: "Reading Log" },
  { value: "ESSAY", label: "Essays" },
];

export default function FilterBar({
  activeType,
  activeTag,
  onTypeChange,
  onTagChange,
  onSearchChange,
}: FilterBarProps) {
  const [tags, setTags] = useState<TagWithCount[]>([]);

  useEffect(() => {
    fetch("/api/tags")
      .then((r) => r.json())
      .then((data: TagWithCount[]) => setTags(data.filter((t) => t.count > 0)))
      .catch(() => {});
  }, []);

  return (
    <div className="flex flex-wrap items-center gap-2.5 border-t border-b border-edge/50 py-3">
      {/* Search — first on mobile */}
      <SearchInput
        onChange={onSearchChange}
        className="order-first sm:order-last sm:ml-auto w-full sm:w-48"
      />

      {/* Type toggle group */}
      <div className="flex gap-1 bg-parchment-deep rounded p-0.5">
        {TYPE_LABELS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => onTypeChange(value)}
            className={[
              "font-meta text-[13px] font-medium px-3.5 py-1 rounded transition-all duration-150",
              activeType === value
                ? "bg-card text-ink shadow-sm"
                : "text-ink-soft hover:text-ink",
            ].join(" ")}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tag pills */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <TagPill
              key={tag.id}
              name={tag.name}
              active={activeTag === tag.name}
              onClick={() =>
                onTagChange(activeTag === tag.name ? null : tag.name)
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
