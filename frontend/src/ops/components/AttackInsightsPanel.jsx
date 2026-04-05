import { ShieldAlert, Crosshair, AlertTriangle, AlertOctagon } from "lucide-react";
import SectionCard from "./SectionCard";

export default function AttackInsightsPanel({ attacks }) {
  if (!attacks) return null;

  return (
    <SectionCard title="Attack Intelligence" subtitle="Live threat vectors and burst activity">
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="flex flex-col gap-1 rounded-xl border border-red-500/20 bg-red-500/5 p-4">
          <div className="flex items-center gap-2 text-red-400">
            <AlertTriangle size={16} />
            <span className="text-[10px] font-bold uppercase tracking-widest">404 Probes</span>
          </div>
          <span className="text-2xl font-bold text-white">{(attacks.not_found_rate * 100).toFixed(1)}%</span>
        </div>
        <div className="flex flex-col gap-1 rounded-xl border border-orange-500/20 bg-orange-500/5 p-4">
          <div className="flex items-center gap-2 text-orange-400">
            <ShieldAlert size={16} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Suspicious Routes Hit</span>
          </div>
          <span className="text-2xl font-bold text-white">{attacks.suspicious_routes_hit}</span>
        </div>
        <div className="flex flex-col gap-1 rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4">
          <div className="flex items-center gap-2 text-yellow-500">
            <AlertOctagon size={16} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Canary Triggers</span>
          </div>
          <span className="text-2xl font-bold text-white">{attacks.canary_triggers}</span>
        </div>
      </div>

      <div className="rounded-xl border border-white/5 bg-white/5 p-4">
        <h4 className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">
          <Crosshair size={14} className="text-red-400" />
          Burst Attack Sources
        </h4>
        <div className="space-y-2">
          {attacks.repeated_hits?.length === 0 ? (
            <p className="text-xs text-gray-500">No burst activity detected.</p>
          ) : (
            attacks.repeated_hits?.map((hit, idx) => (
              <div key={idx} className="flex items-center justify-between text-sm">
                <span className="text-gray-300 truncate mr-2 font-mono text-[11px]">{hit.route}</span>
                <span className="font-mono text-red-400 font-semibold">{hit.count} hits</span>
              </div>
            ))
          )}
        </div>
      </div>
    </SectionCard>
  );
}
