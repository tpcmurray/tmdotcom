import { redirect } from "next/navigation";
import Link from "next/link";
import { getAuthSession } from "@/lib/auth";
import ExportButton from "@/components/admin/ExportButton";

export default async function AdminExportPage() {
  const session = await getAuthSession();
  if (!session) redirect("/login");

  return (
    <div className="page-content py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-heading text-[28px] font-bold text-ink">
          Export Data
        </h1>
        <Link
          href="/admin"
          className="font-meta text-[13px] text-ink-muted hover:text-brown hover:no-underline"
        >
          ← Back to dashboard
        </Link>
      </div>

      <div className="bg-card rounded-lg px-5 py-5 border border-edge-light/60">
        <p className="font-body text-[15px] text-ink mb-4">
          Download all your site data as a JSON file. This includes all posts
          (with content, tags, and image references), and all tags.
        </p>
        <ExportButton />
      </div>
    </div>
  );
}
