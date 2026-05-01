import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { SITE, absoluteBlogUrl } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: `${SITE.name} Journal · ${SITE.tagline}`, template: `%s · ${SITE.name} Journal` },
  description: SITE.description,
  alternates: { canonical: absoluteBlogUrl() },
  openGraph: {
    type: "website",
    locale: SITE.locale,
    url: absoluteBlogUrl(),
    siteName: `${SITE.name} Journal`,
    title: `${SITE.name} Journal`,
    description: SITE.description,
  },
  twitter: {
    card: "summary_large_image",
    site: SITE.twitter,
    title: `${SITE.name} Journal`,
    description: SITE.description,
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-AU">
      <body className="min-h-screen flex flex-col bg-white">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
