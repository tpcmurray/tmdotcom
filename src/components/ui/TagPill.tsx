interface TagPillProps {
  name: string;
  active?: boolean;
  onClick?: () => void;
}

export default function TagPill({ name, active = false, onClick }: TagPillProps) {
  return (
    <span
      onClick={onClick}
      className={[
        "inline-block rounded-full px-2.5 py-0.5 font-meta text-xs font-medium transition-all duration-150",
        "border",
        active
          ? "bg-brown text-white border-transparent"
          : "bg-chip text-chip-ink border-transparent",
        onClick && !active ? "hover:border-edge" : "",
        onClick ? "cursor-pointer" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {name}
    </span>
  );
}
