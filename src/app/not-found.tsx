import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <h1 className="font-heading text-6xl font-bold text-ink mb-4">404</h1>
      <p className="font-body text-lg text-ink-soft mb-8">
        This page doesn&apos;t exist — or it wandered off.
      </p>
      <Link
        href="/"
        className="font-meta text-sm font-semibold text-brown hover:text-brown-light hover:no-underline"
      >
        ← Back to the feed
      </Link>
    </div>
  );
}
