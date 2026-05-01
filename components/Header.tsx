import Link from "next/link";
import { BUCKETS } from "@/lib/buckets";

export default function Header() {
  return (
    <header className="border-b border-rule bg-white sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="text-ink font-bold text-lg tracking-tight">
          Wenest <span className="text-muted font-normal">Journal</span>
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm text-body">
          {BUCKETS.slice(0, 4).map((b) => (
            <Link
              key={b.slug}
              href={`/category/${b.slug}`}
              className="hover:text-accent transition-colors"
            >
              {b.name}
            </Link>
          ))}
          <Link href="/search" className="hover:text-accent transition-colors">
            Search
          </Link>
        </nav>
        <a
          href="https://wenest.com.au/membership"
          className="text-sm bg-ink text-white px-4 py-2 rounded-full hover:bg-accent transition-colors"
        >
          Membership
        </a>
      </div>
    </header>
  );
}
