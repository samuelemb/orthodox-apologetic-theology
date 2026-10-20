import {readPublishedTeachings} from "@/lib/public-teachings";
import type { Metadata } from "next";
import { HomePageContent } from "@/components/home/home-page";

export const metadata: Metadata = { title: "Home" };
export const dynamic='force-dynamic';
export default async function HomePage() { let teachings;try{teachings=await readPublishedTeachings();}catch{return <HomePageContent teachings={[]} error/>;}return <HomePageContent teachings={teachings}/>; }
