"use client";

import { useState, useRef, useEffect, useCallback } from "react";

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
}

interface TagSuggestion {
  id: string;
  name: string;
}

export default function TagInput({ tags, onChange }: TagInputProps) {
  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState<TagSuggestion[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const addTag = useCallback(
    (name: string) => {
      const normalized = name.trim().toLowerCase();
      if (normalized && !tags.includes(normalized)) {
        onChange([...tags, normalized]);
      }
      setInput("");
      setSuggestions([]);
      setShowDropdown(false);
      setActiveIndex(-1);
    },
    [tags, onChange]
  );

  const removeTag = useCallback(
    (index: number) => {
      onChange(tags.filter((_, i) => i !== index));
    },
    [tags, onChange]
  );

  useEffect(() => {
    if (!input.trim()) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/tags/autocomplete?q=${encodeURIComponent(input.trim())}`
        );
        if (res.ok) {
          const data: TagSuggestion[] = await res.json();
          const filtered = data.filter((s) => !tags.includes(s.name));
          setSuggestions(filtered);
          setShowDropdown(filtered.length > 0);
          setActiveIndex(-1);
        }
      } catch {
        // Silently fail autocomplete
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [input, tags]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      if (activeIndex >= 0 && suggestions[activeIndex]) {
        addTag(suggestions[activeIndex].name);
      } else if (input.trim()) {
        addTag(input);
      }
    } else if (e.key === "Backspace" && !input && tags.length > 0) {
      removeTag(tags.length - 1);
    } else if (e.key === "ArrowDown" && showDropdown) {
      e.preventDefault();
      setActiveIndex((prev) => Math.min(prev + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp" && showDropdown) {
      e.preventDefault();
      setActiveIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Escape") {
      setShowDropdown(false);
      setActiveIndex(-1);
    }
  };

  return (
    <div className="mt-5" ref={containerRef}>
      <label className="font-meta text-[12px] font-semibold text-ink-muted uppercase tracking-wide block mb-1.5">
        Tags
      </label>
      <div className="relative">
        <div className="flex flex-wrap gap-1.5 p-2 px-3 border border-edge rounded bg-card items-center">
          {tags.map((tag, i) => (
            <span
              key={tag}
              className="font-meta text-[12px] font-medium px-2 py-0.5 rounded-full bg-chip text-chip-ink flex items-center gap-1"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(i)}
                className="text-[14px] leading-none opacity-60 hover:opacity-100"
              >
                &times;
              </button>
            </span>
          ))}
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={tags.length === 0 ? "Add tag..." : ""}
            className="font-meta text-[13px] border-none bg-transparent outline-none text-ink min-w-[120px] flex-1 placeholder:text-ink-muted"
          />
        </div>

        {showDropdown && (
          <div className="absolute left-0 right-0 top-full mt-1 bg-card border border-edge rounded shadow-sm z-10 max-h-40 overflow-y-auto">
            {suggestions.map((s, i) => (
              <button
                key={s.id}
                type="button"
                onClick={() => addTag(s.name)}
                className={`w-full text-left px-3 py-1.5 font-meta text-[13px] text-ink hover:bg-parchment-deep ${
                  i === activeIndex ? "bg-parchment-deep" : ""
                }`}
              >
                {s.name}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
