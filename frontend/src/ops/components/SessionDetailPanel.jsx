import { 
  Activity, 
  ArrowRight, 
  Clock, 
  Package, 
  ShieldAlert, 
  ShoppingCart, 
  Trash2, 
  User, 
  X,
  CreditCard
} from "lucide-react";
import { useEffect, useState } from "react";
import { dashboardApi, toApiError } from "../api/dashboardApi";
import LoadingSkeleton from "./LoadingSkeleton";
import ModeBadge from "./ModeBadge";
import RiskBadge from "./RiskBadge";

function TimelineEvent({ event }) {
  const isDecoy = event.mode === "DECOY";
  
  const getIcon = (action) => {
    if (action.includes("cart")) return <ShoppingCart size={14} />;
    if (action.includes("order") || action.includes("checkout")) return <Package size={14} />;
    if (action.includes("wishlist")) return <Activity size={14} />;
    if (action.includes("login") || action.includes("signup")) return <User size={14} />;
    return <ArrowRight size={14} />;
  };

  return (
    <div className="relative pl-8 pb-8 last:pb-0">
      <div className="absolute left-[11px] top-6 bottom-0 w-px bg-white/10" />
      <div className={`absolute left-0 top-1.5 flex h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-[#0f1426] text-gray-400 z-10 
        ${isDecoy ? "text-red-400 border-red-500/20" : "text-cyan-400 border-cyan-500/20"}`}>
        {getIcon(event.action)}
      </div>

      <div className="rounded-xl border border-white/5 bg-white/5 p-4 transition-all hover:bg-white/10">
        <div className="flex items-start justify-between gap-2">
          <div>
             <h4 className="text-sm font-semibold text-white capitalize">{event.action.replace(/_/g, " ")}</h4>
             <p className="mt-1 font-mono text-[10px] text-gray-500">{event.route}</p>
          </div>
          <span className="shrink-0 text-[10px] tabular-nums text-gray-500">
            {new Date(event.timestamp).toLocaleTimeString()}
          </span>
        </div>
        
        {event.payload && Object.keys(event.payload).length > 0 && (
          <div className="mt-3 overflow-x-auto rounded-lg border border-black/20 bg-black/30 p-3">
             <pre className="text-[10px] text-gray-400">{JSON.stringify(event.payload, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SessionDetailPanel({ session, isOpen, onClose }) {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen || !session) return;

    async function fetchEvents() {
      setLoading(true);
      setError("");
      try {
        const data = await dashboardApi.getSessionDetails(session.session_id);
        setDetails(data);
      } catch (err) {
        setError(toApiError(err, "Detailed intelligence unavailable."));
      } finally {
        setLoading(false);
      }
    }

    fetchEvents();
  }, [isOpen, session]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-2xl border-l border-white/10 bg-[#070b17] shadow-2xl animate-in slide-in-from-right duration-300">
      <div className="flex h-full flex-col">
        <header className="flex items-center justify-between border-b border-white/10 p-6 bg-[#0f1426]">
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-cyan-500/20 p-2 text-cyan-400">
              <ShieldAlert size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Deep Intelligence Frame</h2>
              <p className="mt-1 text-xs text-gray-400 truncate max-w-sm font-mono">{session?.session_id}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 hover:bg-white/5 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-white/10 space-y-6">
          {/* Metadata Grid */}
          <section className="grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-white/5 bg-white/5 p-4">
               <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Subject Identity</p>
               <div className="flex items-center gap-3">
                 <User size={16} className="text-cyan-400" />
                 <span className="text-sm text-white">{details?.user_id || session?.user_id || "Anonymous Client"}</span>
               </div>
            </div>
            <div className="rounded-xl border border-white/5 bg-white/5 p-4">
               <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Routing State</p>
               <div className="flex items-center gap-3">
                 <ModeBadge mode={details?.mode || session?.routing_state} />
                 <RiskBadge score={details?.risk_score || session?.risk_score} />
               </div>
            </div>
          </section>

          {loading ? (
             <LoadingSkeleton className="h-40" />
          ) : error ? (
             <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-6 text-center text-red-500">
                <Trash2 size={24} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">{error}</p>
             </div>
          ) : details ? (
            <>
              {/* Commerce Highlights */}
              <div className="grid grid-cols-3 gap-4">
                <div className="rounded-xl border border-white/5 bg-[#0e1426] p-4 text-center flex flex-col items-center">
                  <ShoppingCart size={18} className="text-blue-400 mb-2" />
                  <span className="text-xl font-bold text-white">{details.cart_activity?.length || 0}</span>
                  <span className="text-[10px] text-gray-500 uppercase">Cart Items</span>
                </div>
                <div className="rounded-xl border border-white/5 bg-[#0e1426] p-4 text-center flex flex-col items-center">
                  <Activity size={18} className="text-pink-400 mb-2" />
                  <span className="text-xl font-bold text-white">{details.wishlist_activity?.length || 0}</span>
                  <span className="text-[10px] text-gray-500 uppercase">Wishlist</span>
                </div>
                <div className="rounded-xl border border-white/5 bg-[#0e1426] p-4 text-center flex flex-col items-center">
                  <CreditCard size={18} className="text-emerald-400 mb-2" />
                  <span className="text-xl font-bold text-white">{details.orders?.length || 0}</span>
                  <span className="text-[10px] text-gray-500 uppercase">Orders</span>
                </div>
              </div>

              {/* Order Logs if any exist */}
              {details.orders?.length > 0 && (
                <section>
                   <h3 className="mb-4 text-sm font-bold uppercase tracking-widest text-white flex items-center gap-2">
                     <Package size={14} className="text-emerald-400" /> Confirmed Orders
                   </h3>
                   <div className="space-y-3">
                     {details.orders.map(o => (
                       <div key={o.order_id} className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 flex justify-between items-center">
                          <div>
                             <p className="text-sm font-mono text-emerald-400">{o.order_id}</p>
                             <p className="text-xs text-gray-400">Total: ${o.total_value?.toFixed(2)} | Items: {o.items?.length}</p>
                          </div>
                       </div>
                     ))}
                   </div>
                </section>
              )}

              {/* Timeline */}
              <section>
                <h3 className="mb-6 text-sm font-bold uppercase tracking-widest text-white flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-500" />
                   Chronological Forensics ({details.timeline?.length} actions)
                </h3>
  
                {details.timeline?.length === 0 ? (
                  <div className="py-12 text-center text-gray-500 border border-dashed border-white/10 rounded-2xl">
                     <p className="text-sm">No trace telemetry for this session.</p>
                  </div>
                ) : (
                  <div className="mt-4">
                    {details.timeline.map((event, idx) => (
                      <TimelineEvent key={`${event.timestamp}-${idx}`} event={event} />
                    ))}
                  </div>
                )}
              </section>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
