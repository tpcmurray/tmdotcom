"use client";

import SearchInput from "@/components/ui/SearchInput";

type FilterType = "all" | "LOG" | "ESSAY";

interface FilterBarProps {
  activeType: FilterType;
  onTypeChange: (type: FilterType) => void;
  onSearchChange: (search: string) => void;
}

const TYPE_LABELS: { value: FilterType; label: string }[] = [
  { value: "all", label: "All" },
  { value: "LOG", label: "Reading Log" },
  { value: "ESSAY", label: "Essays" },
];

export default function FilterBar({
  activeType,
  onTypeChange,
  onSearchChange,
}: FilterBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2.5 border-b border-edge/50 py-3">
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

      {/* Search — pushed right */}
      <SearchInput
        onChange={onSearchChange}
        className="order-first sm:order-last sm:ml-auto w-full sm:w-48"
      />
    </div>
  );
}
