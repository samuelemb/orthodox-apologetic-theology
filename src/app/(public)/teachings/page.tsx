import {readPublishedTeachings} from "@/lib/public-teachings";
import type { Metadata } from "next";
import { Suspense } from "react";
import { TeachingsLibrary, LibraryLoading } from "@/components/teachings-library";

export const metadata: Metadata = { title: "Teachings" };
export const dynamic='force-dynamic';
export default async function TeachingsPage() { let teachings;let error=false;try{teachings=await readPublishedTeachings();}catch{teachings=[];error=true;}return <Suspense fallback={<LibraryLoading />}><TeachingsLibrary teachings={teachings} error={error}/></Suspense>; }
