export default function ModeBadge({ mode }) {
  const normalized = String(mode || "REAL").toUpperCase() === "DECOY" ? "DECOY" : "REAL";
  const style =
    normalized === "DECOY"
      ? "bg-red-500/15 text-red-300 border border-red-500/40"
      : "bg-emerald-500/15 text-emerald-300 border border-emerald-500/40";

  return <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${style}`}>{normalized}</span>;
}
