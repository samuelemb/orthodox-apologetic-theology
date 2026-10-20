import type { Metadata } from "next";
import { FeedbackPageContent } from "@/components/feedback-page";

export const metadata: Metadata = { title: "Feedback" };
export default function FeedbackPage() { return <FeedbackPageContent />; }
