/** Phase 3A JSON contract. Render strings as React text; never HTML or MDX. */
export type ArticleContent = {
  version: 1;
  sections: { id: string; heading: string; paragraphs?: string[]; video?: { title: string } }[];
};
function object(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function text(value: unknown, max: number): value is string {
  return typeof value === "string" && value.trim().length > 0 && [...value.trim()].length <= max;
}
function keys(value: Record<string, unknown>, allowed: string[]) {
  return Object.keys(value).every(key => allowed.includes(key));
}
export function isArticleContent(value: unknown): value is ArticleContent {
  if (!object(value) || !keys(value, ["version", "sections"]) || value.version !== 1 || !Array.isArray(value.sections) || value.sections.length < 1 || value.sections.length > 100) return false;
  const ids = new Set<string>();
  let videos = 0;
  for (const section of value.sections) {
    if (!object(section) || !keys(section, ["id", "heading", "paragraphs", "video"]) || typeof section.id !== "string" || !/^[a-z][a-z0-9-]{0,79}$/.test(section.id) || ids.has(section.id) || !text(section.heading, 300)) return false;
    ids.add(section.id);
    if ("paragraphs" in section && (!Array.isArray(section.paragraphs) || section.paragraphs.length < 1 || section.paragraphs.length > 200 || !section.paragraphs.every(p => text(p, 10000)))) return false;
    if ("video" in section) {
      videos++;
      if (!object(section.video) || !keys(section.video, ["title"]) || !text(section.video.title, 300)) return false;
    }
    if (!("paragraphs" in section || "video" in section)) return false;
  }
  return videos <= 1;
}
