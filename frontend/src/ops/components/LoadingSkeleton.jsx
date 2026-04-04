export default function LoadingSkeleton({ className = "" }) {
  return <div className={`animate-pulse rounded-xl bg-white/5 ${className}`} />;
}
