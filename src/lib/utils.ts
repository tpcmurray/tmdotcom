/**
 * Extracts the bare hostname from a URL.
 * e.g. "https://arxiv.org/abs/2301.12345" → "arxiv.org"
 */
export function extractDomain(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

/**
 * Strips HTML tags from a string.
 * Used server-side for search index population and excerpt generation.
 */
export function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

/**
 * Calculates estimated reading time in minutes.
 * Uses ~200 words per minute as the standard reading speed.
 * Accepts either HTML or plain text content.
 */
export function calculateReadingTime(content: string | null | undefined): number {
  if (!content) return 0;
  const text = stripHtml(content);
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  return Math.ceil(wordCount / 200);
}
