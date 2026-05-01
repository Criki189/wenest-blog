import type { Metadata } from "next";
import { getSearchIndex } from "@/lib/content";
import SearchClient from "./SearchClient";

export const metadata: Metadata = {
  title: "Search",
  description: "Search every article in the Wenest Journal.",
};

export const revalidate = 60;

export default async function SearchPage() {
  const index = await getSearchIndex();
  return (
    <div className="max-w-3xl mx-auto px-6 py-20">
      <h1 className="text-ink text-4xl md:text-5xl font-bold leading-heading">
        Search
      </h1>
      <p className="text-body text-lg mt-3">
        Search every article in the Journal.
      </p>
      <SearchClient index={index} />
    </div>
  );
}
