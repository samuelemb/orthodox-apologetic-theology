import type { Topic } from "@/lib/teaching-model";

export function TopicIcon({ topic }: { topic: Topic }) {
  return (
    <svg className="topic-icon" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {topic === "repentance" && <><path d="M30 6c-3-2-5 1-6 5l-7 16-1 15L5 51l10 7 15-10V6ZM34 6c3-2 5 1 6 5l7 16 1 15 11 9-10 7-15-10V6Z" /></>}
      {topic === "sacraments" && <><path d="M14 7h36v8c0 13-8 20-18 20S14 28 14 15V7ZM16 13h11m17 0h4M29 35v14l-10 8v2h26v-2l-10-8V35M29 41h6" /></>}
      {topic === "fathers" && <><path d="M8 10c8-4 16-4 24 0 8-4 16-4 24 0v43c-8-4-16-4-24 0-8-4-16-4-24 0V10ZM32 10v43M8 13H4v44h56V13h-4M8 53v4m48-4v4" /></>}
      {topic === "apologetics" && <><path d="M10 58h44M14 58V39c0-8 4-12 10-16 5-3 8-6 8-13 0 7 3 10 8 13 6 4 10 8 10 16v19M32 4v12m-5-8h10M26 58V46a6 6 0 0 1 12 0v12M14 44h-4v14m40-14h4v14" /></>}
    </svg>
  );
}
