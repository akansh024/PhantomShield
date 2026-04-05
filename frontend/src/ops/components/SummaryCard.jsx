export default function SummaryCard({ label, value = "--", hint, tone = "neutral" }) {
  const toneClasses = {
    neutral: "border-cyan-500/20",
    trusted: "border-emerald-500/30",
    suspicious: "border-red-500/30",
    warning: "border-amber-500/30",
  };

  return (
    <article
      className={`rounded-xl border bg-[#11172b] p-4 ${toneClasses[tone] || toneClasses.neutral}`}
    >
      <p className="text-xs uppercase tracking-wider text-gray-400">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
      {hint ? <p className="mt-1 text-xs text-gray-500">{hint}</p> : null}
    </article>
  );
}
