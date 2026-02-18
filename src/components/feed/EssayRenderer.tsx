interface EssayRendererProps {
  content: string | null;
}

export default function EssayRenderer({ content }: EssayRendererProps) {
  if (!content) return null;

  return (
    <div
      className="essay-body"
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}
