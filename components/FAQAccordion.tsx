"use client";

import { useState } from "react";

type Item = { question: string; answer: string };

export default function FAQAccordion({ items }: { items: Item[] }) {
  const [open, setOpen] = useState<number | null>(0);
  if (!items?.length) return null;

  return (
    <section className="mt-16" aria-labelledby="faq-heading">
      <h2 id="faq-heading" className="text-2xl font-bold text-ink mb-6">
        Frequently asked
      </h2>
      <ul className="divide-y divide-rule border-y border-rule">
        {items.map((item, i) => {
          const isOpen = open === i;
          return (
            <li key={i}>
              <button
                onClick={() => setOpen(isOpen ? null : i)}
                aria-expanded={isOpen}
                className="w-full text-left flex items-center justify-between py-5 gap-6 group"
              >
                <span className="text-ink font-semibold text-lg group-hover:text-accent transition-colors">
                  {item.question}
                </span>
                <span
                  aria-hidden
                  className={`text-accent text-2xl leading-none transition-transform ${
                    isOpen ? "rotate-45" : ""
                  }`}
                >
                  +
                </span>
              </button>
              {isOpen && (
                <div className="pb-6 text-body leading-body whitespace-pre-line">
                  {item.answer}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
