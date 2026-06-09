import Link from "next/link";

export default function CategoryCard({
  slug,
  name,
  blurb,
  count,
}: {
  slug: string;
  name: string;
  blurb: string;
  count: number;
}) {
  return (
    <Link
      href={`/${slug}`}
      className="group block border border-rule rounded-lg p-6 hover:border-accent hover:bg-accent-soft transition-all"
    >
      <p className="text-xs uppercase tracking-wider text-muted font-medium">
        {count} {count === 1 ? "article" : "articles"}
      </p>
      <h3 className="text-ink text-xl font-bold mt-2 group-hover:text-accent transition-colors">
        {name}
      </h3>
      <p className="text-body text-sm mt-2">{blurb}</p>
    </Link>
  );
}
