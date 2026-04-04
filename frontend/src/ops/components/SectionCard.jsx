export default function SectionCard({ title, subtitle, children, className = "" }) {
  return (
    <section className={`rounded-2xl border border-white/10 bg-[#0f1322] ${className}`}>
      <header className="border-b border-white/10 px-5 py-4">
        <h3 className="text-sm font-semibold tracking-wide text-white">{title}</h3>
        {subtitle ? <p className="mt-1 text-xs text-gray-400">{subtitle}</p> : null}
      </header>
      <div className="px-5 py-4">{children}</div>
    </section>
  );
}
