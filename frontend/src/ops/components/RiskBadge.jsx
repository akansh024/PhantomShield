export default function RiskBadge({ score = 0 }) {
  const value = Number(score);
  const pct = `${Math.max(0, Math.min(100, Math.round(value * 100)))}%`;

  let style = "bg-emerald-500/15 text-emerald-300 border border-emerald-500/40";
  if (value >= 0.75) style = "bg-red-500/15 text-red-300 border border-red-500/40";
  else if (value >= 0.4) style = "bg-amber-500/15 text-amber-300 border border-amber-500/40";

  return <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${style}`}>{pct}</span>;
}
