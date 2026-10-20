import type { Dictionary } from "@/i18n/en";
import { en } from "@/i18n/en";
import { am } from "@/i18n/am";

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
  status: "sample";
  slug: string;
  translationSlug?: string;
  sections: readonly { id: string; heading: string; paragraphs?: readonly string[]; video?: { id?: string; title: string } }[];
}

export interface SampleTeaching {
  id: string;
  topic: Topic;
  status: "sample";
  versions: readonly TeachingVersion[];
}

// Design fixtures from the approved mockup, not published articles.
// Draft article fixtures; no publication dates, authors, or approved video IDs.
const records = [
  { id: "sample-repentance", topic: "repentance", language: "en", ...en.home.samples.repentance, status: "sample" },
  { id: "sample-sacraments", topic: "sacraments", language: "en", ...en.home.samples.sacraments, status: "sample" },
  { id: "sample-fathers", topic: "fathers", language: "en", ...en.home.samples.fathers, status: "sample" },
  { id: "sample-repentance-am", topic: "repentance", language: "am", ...am.home.samples.repentance, status: "sample" },
  { id: "sample-tradition", topic: "apologetics", language: "en", title: "Faith and sacred tradition", description: "Explore the relationship between faith and sacred tradition in the life of the Church.", status: "sample" },
  { id: "sample-confession", topic: "repentance", language: "en", title: "Preparing for confession", description: "Practical guidance on how to prepare for confession and approach this sacrament with a humble and sincere heart.", status: "sample" },
  { id: "sample-sacraments-am", topic: "sacraments", language: "am", ...am.home.samples.sacraments, status: "sample" },
  { id: "sample-fathers-am", topic: "fathers", language: "am", ...am.home.samples.fathers, status: "sample" },
  { id: "sample-tradition-am", topic: "apologetics", language: "am", title: "እምነትና ቅዱስ ትውፊት", description: "በቤተ ክርስቲያን ሕይወት ውስጥ በእምነትና በቅዱስ ትውፊት መካከል ያለውን ግንኙነት ይወቁ።", status: "sample" },
  { id: "sample-baptism", topic: "sacraments", language: "en", title: "An introduction to baptism", description: "A sample introduction to baptism and life in the Church.", status: "sample" },
  { id: "sample-confession-am", topic: "repentance", language: "am", title: "ለንስሐ መዘጋጀት", description: "ለንስሐ በትሕትናና በቅን ልቦና ስለ መዘጋጀት የትምህርት ናሙና።", status: "sample" },
  { id: "sample-baptism-am", topic: "sacraments", language: "am", title: "ስለ ጥምቀት መግቢያ", description: "ስለ ጥምቀትና ስለ ቤተ ክርስቲያን ሕይወት የትምህርት ናሙና።", status: "sample" },
];

const slugs: Record<string, string> = { "sample-repentance": "what-is-repentance", "sample-repentance-am": "repentance-am", "sample-sacraments": "understanding-the-sacraments", "sample-fathers": "learning-from-the-church-fathers", "sample-confession": "preparing-for-confession" };
// Existing repentance links and client-confirmed translation pairs establish shared identities.
// Other similarly named/topic records remain independent until explicitly linked.
const linkedTeachingIds: Record<string, string> = {
  "what-is-repentance": "sample-repentance",
  "repentance-am": "sample-repentance",
  "preparing-for-confession": "sample-confession",
  "confession-am": "sample-confession",
  "understanding-the-sacraments": "sample-sacraments",
  "sacraments-am": "sample-sacraments",
  "baptism": "sample-baptism",
  "baptism-am": "sample-baptism",
  "learning-from-the-church-fathers": "sample-fathers",
  "fathers-am": "sample-fathers",
  "tradition": "sample-tradition",
  "tradition-am": "sample-tradition",
};
export const sampleTeachingVersions: readonly TeachingVersion[] = records.map(record => {
  const language = record.language as "en" | "am";
  const repentance = record.id === "sample-repentance" || record.id === "sample-repentance-am";
  const sections: TeachingVersion["sections"] = repentance ? (language === "en" ? [
    { id: "introduction", heading: "Introduction", paragraphs: ["Repentance is a turning of the heart toward God. It invites us to examine our lives, acknowledge our failings, and seek renewal through His grace."] },
    { id: "watch-the-teaching", heading: "Watch the teaching", video: { title: "What is repentance?" } },
    { id: "a-life-of-repentance", heading: "A life of repentance", paragraphs: ["This sample teaching explores how prayer, confession, and daily choices can shape a life of repentance."] },
  ] : [
    { id: "introduction", heading: "መግቢያ", paragraphs: ["ንስሐ ልብን ወደ እግዚአብሔር መመለስ ነው። ሕይወታችንን እንድንመረምር፣ ስህተታችንን እንድንቀበልና በጸጋው እንድንታደስ ይጋብዘናል።"] },
    { id: "a-life-of-repentance", heading: "የንስሐ ሕይወት", paragraphs: ["ይህ የናሙና ትምህርት ጸሎት፣ ንስሐና የዕለት ተዕለት ምርጫዎች የንስሐ ሕይወትን እንዴት እንደሚቀርጹ ያስተዋውቃል።"] },
  ]) : language === "en" ? [
    { id: "introduction", heading: "Introduction", paragraphs: [record.description] },
    { id: "reflection", heading: "Reflection and daily life", paragraphs: ["This draft invites readers to consider this topic through prayer, careful study, and conversation with their priest. The final teaching and supporting sources will be supplied and reviewed by the client."] },
  ] : [
    { id: "introduction", heading: "መግቢያ", paragraphs: [record.description] },
    { id: "reflection", heading: "ማሰላሰልና የዕለት ተዕለት ሕይወት", paragraphs: ["ይህ ረቂቅ ርዕሱን በጸሎት፣ በጥናትና ከካህን ጋር በውይይት እንድናሰላስል ይጋብዘናል። የመጨረሻው ትምህርትና ምንጮች በደንበኛው ይቀርባሉ።"] },
  ];
  const slug = slugs[record.id] ?? record.id.replace("sample-", "");
  return { ...record, teachingId: linkedTeachingIds[slug] ?? record.id, topic: record.topic as Topic, language, status: "sample", slug, translationSlug: Object.keys(linkedTeachingIds).find(otherSlug => otherSlug !== slug && linkedTeachingIds[otherSlug] === linkedTeachingIds[slug]), sections };
});

export function groupTeachingVersions(versions: readonly TeachingVersion[]): readonly SampleTeaching[] {
  const groups = new Map<string, SampleTeaching>();
  for (const version of versions) {
    const previous = groups.get(version.teachingId);
    groups.set(version.teachingId, {
      id: version.teachingId, topic: version.topic, status: version.status,
      versions: previous ? [...previous.versions, version] : [version],
    });
  }
  return [...groups.values()];
}

export const sampleTeachings = groupTeachingVersions(sampleTeachingVersions);

export function preferredVersion(versions: readonly TeachingVersion[], language: TeachingLanguage): TeachingVersion {
  return versions.find(version => version.language === language) ?? versions[0];
}

export function teachingUrl(teaching: TeachingVersion, library = "/teachings") {
  return `/teachings/${teaching.slug}${library !== "/teachings" ? `?library=${encodeURIComponent(library)}` : ""}`;
}
