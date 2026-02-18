/**
 * Sanitizes a user-supplied search term for use with PostgreSQL plainto_tsquery.
 * plainto_tsquery handles spaces naturally (treats them as AND),
 * so we just need to remove characters that could cause issues.
 */
export function sanitizeSearchTerm(term: string): string {
  return term
    .trim()
    .replace(/[^\w\s]/g, " ") // remove non-word, non-space chars
    .replace(/\s+/g, " ")
    .trim();
}
