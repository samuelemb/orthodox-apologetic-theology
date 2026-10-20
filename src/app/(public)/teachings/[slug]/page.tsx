import { notFound } from "next/navigation";
import {readPublishedTeachings,readPublishedArticle} from "@/lib/public-teachings";
import {PublicTeachingError} from "@/components/public-teaching-error";
export const dynamic="force-dynamic";
import { TeachingDetails } from "@/components/teaching-details";
import { libraryUrl, readFilters } from "@/lib/teaching-filters";
export default async function TeachingPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ library?: string | string[] }> }) {
 const { slug } = await params;
 let teaching,teachings;try{[teaching,teachings]=await Promise.all([readPublishedArticle(slug),readPublishedTeachings()]);}catch{return <PublicTeachingError/>;}
 if (!teaching) notFound();
 const { library } = await searchParams;
 let back = "/teachings";
 if (typeof library === "string" && library.startsWith("/teachings?")) back = libraryUrl(readFilters(new URLSearchParams(library.split("?")[1])));
 return <TeachingDetails teaching={teaching} library={back} teachings={teachings} />;
}
