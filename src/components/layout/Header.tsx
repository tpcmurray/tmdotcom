import Link from "next/link";

export default function Header() {
  return (
    <header className="border-b border-edge bg-parchment-deep">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4 sm:px-6">
        <Link
          href="/"
          className="font-heading text-2xl font-semibold text-ink hover:no-underline"
        >
          Terry Murray
        </Link>

        <nav className="flex items-center gap-6 font-meta text-sm text-ink-soft">
          <Link href="/" className="hover:text-brown">
            Home
          </Link>
          {/* Admin link — wired up in Phase 4 once auth is in place */}
          <Link href="/admin" className="hover:text-brown">
            Admin
          </Link>
        </nav>
      </div>
    </header>
  );
}
