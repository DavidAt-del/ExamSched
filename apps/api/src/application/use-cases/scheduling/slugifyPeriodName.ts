// Slugify a Hebrew/English period name for use in an export filename. Keeps
// Hebrew letters (Unicode \p{L}) and digits, strips quotation marks / slashes,
// collapses whitespace and runs of dashes.
export function slugifyPeriodName(name: string): string {
  return name
    .replace(/[״׳"'`/\\]/gu, '')
    .replace(/\s+/gu, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}
