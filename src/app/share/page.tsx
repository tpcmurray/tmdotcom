import { redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth";
import ShareForm from "@/components/share/ShareForm";

export default async function SharePage({
  searchParams,
}: {
  searchParams: Promise<{ url?: string; title?: string }>;
}) {
  const session = await getAuthSession();
  if (!session) redirect("/login");

  const { url, title } = await searchParams;

  return (
    <div className="page-content py-8">
      <h1 className="font-heading text-[24px] font-bold text-ink mb-6">
        Log Content
      </h1>
      <ShareForm initialUrl={url || ""} initialTitle={title || ""} />
    </div>
  );
}
