import { topics, preferredVersion, type Teaching, type TeachingLanguage, type TeachingVersion, type Topic } from "@/lib/teaching-model";

export const pageSize = 6;
export function readFilters(params: Pick<URLSearchParams, "get">) {
  const topic = params.get("topic") ?? "";
  const language = params.get("language") ?? "";
  const limit = Number(params.get("limit"));
  return {
    q: (params.get("q") ?? "").trim(),
    topic: topics.includes(topic as Topic) ? topic as Topic : "" as const,
    language: language === "en" || language === "am" ? language as TeachingLanguage : "" as const,
    limit: Number.isSafeInteger(limit) && limit >= pageSize ? limit : pageSize,
  };
}
export type TeachingFilters = ReturnType<typeof readFilters>;

export function libraryUrl(filters: TeachingFilters) {
  const params = new URLSearchParams();
  if (filters.q.trim()) params.set("q", filters.q.trim());
  if (filters.topic) params.set("topic", filters.topic);
  if (filters.language) params.set("language", filters.language);
  if (filters.limit > pageSize) params.set("limit", String(filters.limit));
  return `/teachings${params.size ? `?${params}` : ""}`;
}

export type TeachingMatch = { teaching: Teaching; version: TeachingVersion };

export function filterTeachings(data: readonly Teaching[], filters: TeachingFilters, interfaceLanguage: TeachingLanguage): TeachingMatch[] {
  const terms = filters.q.normalize("NFKC").toLocaleLowerCase().split(/\s+/u).filter(Boolean);
  return data.flatMap(teaching => {
    if (filters.topic && teaching.topic !== filters.topic) return [];
    const matchingVersions = teaching.versions.filter(version => {
      if (filters.language && version.language !== filters.language) return false;
      const text = `${version.title} ${version.description}`.normalize("NFKC").toLocaleLowerCase();
      return terms.every(term => text.includes(term));
    });
    return matchingVersions.length ? [{ teaching, version: preferredVersion(matchingVersions, interfaceLanguage) }] : [];
  });
}
