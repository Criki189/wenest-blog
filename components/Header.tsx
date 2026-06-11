import Link from "next/link";
import { BUCKETS } from "@/lib/buckets";

export default function Header() {
  return (
    <header className="border-b border-rule bg-background/85 backdrop-blur sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
        {/* Logo links to the main wenest.com.au site (not /blog) */}
        <a
          href="https://www.wenest.com.au"
          aria-label="Wenest — back to home"
          className="flex items-center"
        >
          {/* basePath /blog is auto-prefixed by Next when using <Image>;
              for plain <img> we must prepend it manually. */}
          <img
            src="/blog/wenest_logo_orange.svg"
            alt="Wenest"
            className="h-12 md:h-14 w-auto"
          />
        </a>

        <nav className="hidden md:flex items-center gap-7 text-[15px] text-ink/80">
          {BUCKETS.slice(0, 4).map((b) => (
            <Link
              key={b.slug}
              href={`/${b.slug}`}
              className="hover:text-gold transition-colors font-medium"
            >
              {b.name}
            </Link>
          ))}
          <Link href="/search" className="hover:text-gold transition-colors font-medium">
            Search
          </Link>
        </nav>

        <a
          href="https://www.wenest.com.au/pricing"
          className="text-sm bg-ink text-background px-5 py-2.5 rounded-full hover:bg-gold transition-colors font-medium"
        >
          Membership
        </a>
      </div>
    </header>
  );
}
