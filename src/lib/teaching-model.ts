import type { Dictionary } from "@/i18n/en";
export type Topic = keyof Dictionary["home"]["topics"];
export const topics: readonly Topic[] = ["repentance", "sacraments", "fathers", "apologetics"];

export type TeachingLanguage = "en" | "am";

export interface TeachingVersion {
  id: string;
  teachingId: string;
  topic: Topic;
  language: TeachingLanguage;
  title: string;
  description: string;
  status: "sample" | "published";
  slug: string;
  translationSlug?: string;
  publishedAt?: string;
  sections: readonly { id: string; heading: string; paragraphs?: readonly string[]; video?: { id?: string; title: string } }[];
}

export interface Teaching {
  id: string;
  topic: Topic;
  status: "sample" | "published";
  versions: readonly TeachingVersion[];
}

export function groupTeachingVersions(versions: readonly TeachingVersion[]): readonly Teaching[] {
  const groups = new Map<string, Teaching>();
  for (const version of versions) {
    const previous = groups.get(version.teachingId);
    groups.set(version.teachingId, {
      id: version.teachingId, topic: version.topic, status: version.status,
      versions: previous ? [...previous.versions, version] : [version],
    });
  }
  return [...groups.values()];
}

export function preferredVersion(versions: readonly TeachingVersion[], language: TeachingLanguage): TeachingVersion {
  return versions.find(version => version.language === language) ?? versions[0];
}

export function teachingUrl(teaching: TeachingVersion, library = "/teachings") {
  return `/teachings/${teaching.slug}${library !== "/teachings" ? `?library=${encodeURIComponent(library)}` : ""}`;
}
