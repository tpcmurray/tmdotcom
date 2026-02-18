export default function Footer() {
  return (
    <footer className="border-t border-edge bg-parchment-deep">
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
        <p className="font-meta text-sm text-ink-muted">
          &copy; {new Date().getFullYear()} Terry Murray
        </p>
      </div>
    </footer>
  );
}
