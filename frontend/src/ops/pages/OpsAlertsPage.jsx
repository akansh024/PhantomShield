import OpsPlaceholderPage from "./OpsPlaceholderPage";

export default function OpsAlertsPage() {
  return (
    <OpsPlaceholderPage
      title="Suspicious Activity Alerts"
      description="Operational triage stream for anomalous session behavior and decoy-triggered events."
      phaseFocus="Phase 5 will introduce refresh orchestration, alert scoring, and analyst-focused filtering controls."
      deliverables={[
        "High-risk session queue with escalation context",
        "Decoy-triggered behavior digest",
        "Credential abuse and burst-action alert detectors",
        "Manual and auto-refresh controls with feed health status",
      ]}
    />
  );
}
