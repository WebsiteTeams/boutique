export default function Loading() {
  return (
    <div
      className="flex min-h-[70vh] flex-col items-center justify-center px-5 pt-24"
      role="status"
      aria-live="polite"
    >
      <span className="relative flex h-14 w-14 items-center justify-center">
        <span className="absolute inset-0 animate-spin rounded-full border border-clay border-t-gold" />
        <span className="font-serif text-xl text-charcoal">U</span>
      </span>
      <p className="eyebrow mt-6 text-gold-deep">Loading</p>
      <span className="sr-only">Loading page content</span>
    </div>
  );
}
