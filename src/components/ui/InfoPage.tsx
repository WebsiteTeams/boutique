import type { ReactNode } from "react";

interface InfoPageProps {
  eyebrow: string;
  title: string;
  intro?: string;
  children: ReactNode;
}

export function InfoPage({ eyebrow, title, intro, children }: InfoPageProps) {
  return (
    <>
      <header className="border-b border-clay/50 bg-cream/50">
        <div className="mx-auto max-w-3xl px-5 pb-12 pt-32 text-center sm:px-8 lg:pt-40">
          <p className="eyebrow mb-3 text-gold-deep">{eyebrow}</p>
          <h1 className="type-display-lg text-charcoal">{title}</h1>
          {intro && (
            <p className="mx-auto mt-4 max-w-xl type-body leading-relaxed text-mist">{intro}</p>
          )}
        </div>
      </header>
      <div className="mx-auto max-w-3xl px-5 py-14 sm:px-8 lg:py-16">{children}</div>
    </>
  );
}
