import EmptyState from "./EmptyState";
import LoadingSkeleton from "./LoadingSkeleton";
import SectionCard from "./SectionCard";

export default function ChartCard({
  title,
  subtitle,
  loading = false,
  error = "",
  hasData = true,
  emptyTitle = "No data available",
  emptyDescription = "No telemetry has been recorded for this chart yet.",
  children,
  className = "",
}) {
  return (
    <SectionCard title={title} subtitle={subtitle} className={className}>
      {loading ? (
        <LoadingSkeleton className="h-[260px] w-full" />
      ) : error ? (
        <EmptyState title="Chart unavailable" description={error} />
      ) : hasData ? (
        <div className="h-[260px]">{children}</div>
      ) : (
        <EmptyState title={emptyTitle} description={emptyDescription} />
      )}
    </SectionCard>
  );
}
