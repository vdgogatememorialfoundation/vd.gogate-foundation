export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\u0900-\u097F]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 160);
}

export function isValidSlug(s: string): boolean {
  return /^[a-z0-9\u0900-\u097F]+(?:-[a-z0-9\u0900-\u097F]+)*$/.test(s);
}
