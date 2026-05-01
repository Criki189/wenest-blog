"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { bucketName } from "@/lib/buckets";

type Item = {
  slug: string;
  title: string;
  description: string;
  bucket: string;
};

export default function SearchClient({ index }: { index: Item[] }) {
  const [q, setQ] = useState("");

  const results = useMemo(() => {
    if (!q.trim()) return index;
    const needle = q.toLowerCase();
    return index.filter(
      (i) =>
        i.title.toLowerCase().includes(needle) ||
        i.description.toLowerCase().includes(needle)
    );
  }, [q, index]);

  return (
    <div className="mt-10">
      <input
        type="search"
        placeholder="Try 'blocked sink' or 'spring checklist'…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        aria-label="Search articles"
        className="w-full border border-rule rounded-full px-6 py-4 text-lg outline-none focus:border-accent focus:ring-2 focus:ring-accent-soft"
      />
      <p className="text-sm text-muted mt-3">
        {results.length} {results.length === 1 ? "article" : "articles"}
      </p>

      <ul className="mt-8 divide-y divide-rule border-t border-rule">
        {results.map((r) => (
          <li key={r.slug}>
            <Link
              href={`/${r.slug}`}
              className="block py-6 group"
            >
              <p className="text-xs uppercase tracking-wider text-accent font-medium mb-2">
                {bucketName(r.bucket)}
              </p>
              <p className="text-ink text-xl font-bold group-hover:text-accent transition-colors">
                {r.title}
              </p>
              <p className="text-body mt-1 text-sm">{r.description}</p>
            </Link>
          </li>
        ))}
        {results.length === 0 && (
          <li className="py-12 text-muted">No articles match "{q}".</li>
        )}
      </ul>
    </div>
  );
}
