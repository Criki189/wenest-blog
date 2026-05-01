import Link from "next/link";
import { BUCKETS } from "@/lib/buckets";

export default function Footer() {
  return (
    <footer className="border-t border-rule mt-24">
      <div className="max-w-6xl mx-auto px-6 py-12 grid gap-8 md:grid-cols-3 text-sm">
        <div>
          <p className="text-ink font-bold">Wenest</p>
          <p className="text-muted mt-2 max-w-xs">
            A premium home concierge for Sydney. We coordinate the trades you'd
            otherwise have to vet, chase, and pay.
          </p>
        </div>
        <div>
          <p className="text-ink font-semibold mb-2">Categories</p>
          <ul className="space-y-1 text-muted">
            {BUCKETS.map((b) => (
              <li key={b.slug}>
                <Link
                  href={`/category/${b.slug}`}
                  className="hover:text-ink transition-colors"
                >
                  {b.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-ink font-semibold mb-2">Wenest</p>
          <ul className="space-y-1 text-muted">
            <li><a href="https://wenest.com.au" className="hover:text-ink">wenest.com.au</a></li>
            <li><a href="https://wenest.com.au/membership" className="hover:text-ink">Membership</a></li>
            <li><Link href="/" className="hover:text-ink">Journal home</Link></li>
          </ul>
          <p className="text-muted mt-4 text-xs">
            © {new Date().getFullYear()} Wenest Pty Ltd · Sydney
          </p>
        </div>
      </div>
    </footer>
  );
}
