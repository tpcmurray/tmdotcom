import Link from "next/link";
import { getAuthSession } from "@/lib/auth";

export default async function Header() {
  const session = await getAuthSession();

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
          {session ? (
            <>
              <Link href="/admin" className="hover:text-brown">
                Admin
              </Link>
              <Link href="/admin/write" className="hover:text-brown">
                New Essay
              </Link>
              <Link
                href="/api/auth/signout"
                className="text-ink-muted hover:text-brown"
              >
                Sign Out
              </Link>
            </>
          ) : (
            <Link href="/login" className="hover:text-brown">
              Sign In
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
