import { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost";
}

export default function Button({
  variant = "primary",
  className = "",
  children,
  ...props
}: ButtonProps) {
  const base =
    "font-meta text-sm font-medium px-5 py-2 rounded transition-colors cursor-pointer disabled:opacity-50";
  const variants = {
    primary: "bg-brown text-white hover:bg-brown-light",
    ghost: "bg-parchment-deep text-ink border border-edge hover:bg-parchment",
  };

  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}
