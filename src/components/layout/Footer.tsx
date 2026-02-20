export default function Footer() {
  return (
    <footer className="border-t border-edge-light">
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
        <p className="font-meta text-sm text-ink-muted">
          &copy; {new Date().getFullYear()} Terry Murray
        </p>
        <div className="mt-3 flex gap-4">
          <a
            href="/feed/essays"
            className="font-meta text-sm text-ink-muted hover:text-brown"
          >
            Essays RSS
          </a>
          <a
            href="/feed/log"
            className="font-meta text-sm text-ink-muted hover:text-brown"
          >
            Reading Log RSS
          </a>
        </div>
      </div>
    </footer>
  );
}
