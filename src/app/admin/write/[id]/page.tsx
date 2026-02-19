import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import EditorPage from "@/components/editor/EditorPage";

type Params = Promise<{ id: string }>;

export default async function EditEssayPage({
  params,
}: {
  params: Params;
}) {
  const session = await getAuthSession();
  if (!session) notFound();

  const { id } = await params;
  const post = await prisma.post.findUnique({
    where: { id },
    include: { tags: { include: { tag: true } } },
  });

  if (!post) notFound();

  return (
    <EditorPage
      initialData={{
        id: post.id,
        title: post.title,
        content: post.content,
        contentMarkdown: post.contentMarkdown,
        status: post.status,
        tags: post.tags.map((pt: (typeof post.tags)[number]) => pt.tag),
      }}
    />
  );
}
