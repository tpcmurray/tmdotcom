"use client";

import { useEffect, useRef, useState } from "react";

interface SearchInputProps {
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export default function SearchInput({
  onChange,
  placeholder = "Search posts…",
  className = "",
}: SearchInputProps) {
  const [value, setValue] = useState("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      onChange(value);
    }, 300);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [value, onChange]);

  return (
    <input
      type="search"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      placeholder={placeholder}
      className={`bg-card border border-edge rounded px-3 py-1.5 font-meta text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:border-brown w-48 ${className}`}
    />
  );
}
