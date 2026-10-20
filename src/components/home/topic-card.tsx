import type { Topic } from "@/lib/teaching-model";
import { TopicIcon } from "./topic-icon";
import Link from "next/link";

export function TopicCard({ topic, label }: { topic: Topic; label: string }) {
  return (
    <Link href={`/teachings?topic=${topic}`} className="topic-card">
      <TopicIcon topic={topic} /><span>{label}</span><span className="topic-arrow" aria-hidden="true">→</span>
    </Link>
  );
}
