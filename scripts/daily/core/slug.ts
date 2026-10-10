/** URL-safe slug from a title: "The Vanishing Promise" -> "the-vanishing-promise". */
export function slugify(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/[\s-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Canonical quest slug: "2026-10-07-the-vanishing-promise". */
export function questSlug(date: string, title: string): string {
  const base = slugify(title);
  if (base.length === 0) {
    throw new Error(`Cannot slugify title: "${title}"`);
  }
  return `${date}-${base}`;
}

/** Canonical quest id: "dq-2026-10-07". */
export function questId(date: string): string {
  return `dq-${date}`;
}
