export default function CTABox() {
  return (
    <aside className="mt-16 rounded-lg bg-accent-soft border border-rule p-8">
      <p className="text-xs uppercase tracking-wider text-accent font-semibold mb-3">
        Wenest membership
      </p>
      <h3 className="text-ink text-2xl font-bold leading-heading mb-3">
        Rather not deal with this yourself?
      </h3>
      <p className="text-body mb-5">
        That's literally what we do. Wenest members get a vetted plumber,
        electrician, gardener, HVAC tech, and pool tech on call — coordinated by
        us, billed transparently. A monthly fee covers vetting and scheduling;
        jobs are quoted separately, 50% upfront and 50% on completion.
      </p>
      <a
        href="https://wenest.com.au/pricing"
        rel="noopener noreferrer"
        target="_blank"
        className="inline-block bg-ink text-white px-6 py-3 rounded-full text-sm font-medium hover:bg-accent transition-colors"
      >
        See how membership works
      </a>
    </aside>
  );
}
