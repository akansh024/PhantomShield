import EmptyState from "../components/EmptyState";
import SectionCard from "../components/SectionCard";

export default function OpsPlaceholderPage({ title, description, phaseFocus, deliverables = [] }) {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">{title}</h1>
        <p className="mt-2 text-sm text-gray-400">{description}</p>
      </header>

      <SectionCard
        title="Phase Roadmap Alignment"
        subtitle="This page is intentionally scaffolded in Phase 1 and will be activated in upcoming phases."
      >
        <p className="text-sm text-gray-300">{phaseFocus}</p>
      </SectionCard>

      <SectionCard title="Upcoming Deliverables" subtitle="Committed scope for the next implementation phases.">
        {deliverables.length ? (
          <ul className="space-y-2 text-sm text-gray-300">
            {deliverables.map((item) => (
              <li key={item} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                {item}
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            title="No deliverables listed yet"
            description="Phase targets will appear here as we advance implementation."
          />
        )}
      </SectionCard>
    </div>
  );
}
