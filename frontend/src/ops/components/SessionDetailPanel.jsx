import {
  Activity,
  Clock,
  CreditCard,
  Package,
  ShieldAlert,
  ShoppingCart,
  User,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { dashboardApi, toApiError } from "../api/dashboardApi";
import LoadingSkeleton from "./LoadingSkeleton";
import ModeBadge from "./ModeBadge";
import RiskBadge from "./RiskBadge";

function formatDateTime(value) {
  if (!value) return "--";
  const parsed = new Date(typeof value === "string" && !value.endsWith("Z") ? `${value}Z` : value);
  return parsed.toLocaleString();
}

function TimelineEvent({ event }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-white">{event.action_label || event.action}</p>
          <p className="text-[10px] uppercase tracking-widest text-cyan-300">{event.category || "Browsing"}</p>
          <p className="mt-1 text-xs text-gray-400">{event.description || "Telemetry event"}</p>
          {event.route ? <p className="mt-1 font-mono text-[10px] text-gray-500">{event.route}</p> : null}
        </div>
        <div className="text-right text-[10px] text-gray-500">
          <p>{formatDateTime(event.timestamp)}</p>
          {event.suspicious ? (
            <span className="inline-flex rounded-full bg-red-500/10 px-2 py-0.5 text-[9px] uppercase tracking-widest text-red-300">
              Suspicious
            </span>
          ) : (
            <span className="inline-flex rounded-full bg-emerald-500/10 px-2 py-0.5 text-[9px] uppercase tracking-widest text-emerald-300">
              Normal
            </span>
          )}
        </div>
      </div>
      {event.payload && Object.keys(event.payload).length > 0 ? (
        <div className="mt-3 overflow-x-auto rounded-lg border border-black/30 bg-black/30 p-3">
          <pre className="text-[10px] text-gray-400">{JSON.stringify(event.payload, null, 2)}</pre>
        </div>
      ) : null}
    </div>
  );
}

export default function SessionDetailPanel({ session, isOpen, onClose }) {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen || !session) return;

    async function fetchDetails() {
      setLoading(true);
      setError("");
      try {
        const data = await dashboardApi.getSessionDetails(session.session_id);
        setDetails(data);
        localStorage.setItem(
          "ops_focus_session",
          JSON.stringify({
            session_id: data.session_id,
            user_name: data.user_name,
            user_email: data.user_email,
            routing_state: data.mode,
            authenticated_at: data.authenticated_at,
            session_type: data.session_type,
          }),
        );
        window.dispatchEvent(new Event("ops:focus-session"));
      } catch (err) {
        setError(toApiError(err, "Detailed session intelligence unavailable."));
      } finally {
        setLoading(false);
      }
    }

    fetchDetails();
  }, [isOpen, session]);

  const identity = useMemo(() => {
    const subject = details || session;
    if (!subject) {
      return {
        name: "Guest",
        email: "Not signed in",
        sessionId: "--",
      };
    }
    return {
      name: subject.user_name || (subject.user_email ? subject.user_email.split("@")[0] : "Guest"),
      email: subject.user_email || "Not signed in",
      sessionId: subject.session_id,
    };
  }, [details, session]);

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-0 right-0 top-16 z-50 w-full max-w-2xl animate-in border-l border-white/10 bg-[#070b17] shadow-2xl slide-in-from-right duration-300">
      <div className="flex h-full flex-col">
        <header className="flex items-center justify-between border-b border-white/10 bg-[#0f1426] p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-cyan-500/20 p-2 text-cyan-300">
              <ShieldAlert size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Session Intelligence</h2>
              <p className="font-mono text-[10px] text-gray-500">{identity.sessionId}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X size={18} />
          </button>
        </header>

        <div className="flex-1 space-y-6 overflow-y-auto p-6">
          <section className="grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-[10px] uppercase tracking-widest text-gray-500">User Identity</p>
              <div className="mt-2 flex items-center gap-2">
                <User size={15} className="text-cyan-300" />
                <div>
                  <p className="text-sm font-semibold text-white">{identity.name}</p>
                  <p className="text-xs text-gray-400">{identity.email}</p>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-[10px] uppercase tracking-widest text-gray-500">Current State</p>
              <div className="mt-2 flex items-center gap-2">
                <ModeBadge mode={details?.mode || session?.routing_state} />
                <RiskBadge score={details?.risk_score ?? session?.risk_score ?? 0} />
              </div>
              <p className="mt-2 text-xs text-gray-400">{details?.state_label || session?.state_label || "--"}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-[10px] uppercase tracking-widest text-gray-500">Session Context</p>
              <p className="mt-2 text-xs text-gray-300">
                Type: <span className="font-semibold text-white">{details?.session_type || session?.session_type || "guest"}</span>
              </p>
              <p className="text-xs text-gray-300">
                Status: <span className="font-semibold text-white">{details?.status || session?.status || "--"}</span>
              </p>
              <p className="text-xs text-gray-300">
                Environment: <span className="font-semibold text-white">{details?.environment || session?.environment || "production"}</span>
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-[10px] uppercase tracking-widest text-gray-500">Login / Signup Time</p>
              <p className="mt-2 text-xs text-gray-300">
                Login: <span className="text-white">{formatDateTime(details?.authenticated_at || session?.authenticated_at)}</span>
              </p>
              <p className="text-xs text-gray-300">
                Signup: <span className="text-white">{formatDateTime(details?.signup_at || session?.signup_at)}</span>
              </p>
            </div>
          </section>

          {loading ? <LoadingSkeleton className="h-44 w-full" /> : null}
          {!loading && error ? (
            <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-300">{error}</div>
          ) : null}

          {!loading && !error && details ? (
            <>
              <section className="grid grid-cols-3 gap-4">
                <div className="rounded-xl border border-white/10 bg-[#0e1426] p-4 text-center">
                  <ShoppingCart size={16} className="mx-auto mb-2 text-blue-300" />
                  <p className="text-xl font-bold text-white">{details.cart_activity?.length || 0}</p>
                  <p className="text-[10px] uppercase tracking-widest text-gray-500">Cart Actions</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-[#0e1426] p-4 text-center">
                  <Activity size={16} className="mx-auto mb-2 text-pink-300" />
                  <p className="text-xl font-bold text-white">{details.wishlist_activity?.length || 0}</p>
                  <p className="text-[10px] uppercase tracking-widest text-gray-500">Wishlist Actions</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-[#0e1426] p-4 text-center">
                  <CreditCard size={16} className="mx-auto mb-2 text-emerald-300" />
                  <p className="text-xl font-bold text-white">{details.orders?.length || 0}</p>
                  <p className="text-[10px] uppercase tracking-widest text-gray-500">Orders</p>
                </div>
              </section>

              <section className="rounded-xl border border-white/10 bg-[#0e1426] p-4">
                <div className="mb-3 flex items-center gap-2">
                  <Clock size={14} className="text-amber-300" />
                  <h3 className="text-sm font-semibold text-white">Risk History</h3>
                </div>
                {details.risk_history?.length ? (
                  <div className="space-y-2">
                    {details.risk_history.slice(-8).reverse().map((item, idx) => (
                      <div key={`${item.timestamp}-${idx}`} className="rounded-lg border border-white/10 bg-white/5 p-3 text-xs">
                        <p className="text-gray-200">{formatDateTime(item.timestamp)}</p>
                        <p className="text-gray-400">
                          Risk: {item.score_before ?? 0} → <span className="font-semibold text-white">{item.score_after}</span>
                        </p>
                        <p className="text-gray-500">{item.reason || "security update"}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500">No risk updates recorded yet.</p>
                )}
              </section>

              <section className="rounded-xl border border-white/10 bg-[#0e1426] p-4">
                <h3 className="mb-3 text-sm font-semibold text-white">Recent Actions</h3>
                {details.recent_actions?.length ? (
                  <div className="space-y-2">
                    {details.recent_actions.map((event, idx) => (
                      <TimelineEvent key={`${event.timestamp}-${idx}`} event={event} />
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500">No recent actions captured.</p>
                )}
              </section>

              <section className="rounded-xl border border-white/10 bg-[#0e1426] p-4">
                <div className="mb-3 flex items-center gap-2">
                  <Package size={14} className="text-cyan-300" />
                  <h3 className="text-sm font-semibold text-white">Full Forensic Timeline</h3>
                </div>
                {details.timeline?.length ? (
                  <div className="space-y-2">
                    {details.timeline.slice(-40).reverse().map((event, idx) => (
                      <TimelineEvent key={`${event.timestamp}-${idx}`} event={event} />
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500">No timeline events available.</p>
                )}
              </section>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
