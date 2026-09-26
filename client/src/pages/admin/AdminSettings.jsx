import ThresholdSettings from '../../components/admin/ThresholdSettings';

export default function AdminSettings() {
  return (
    <div className="admin-settings-page">
      <div className="settings-page-header">
        <span className="eyebrow">Platform Settings</span>
        <h1 className="settings-page-title">Moderation & Platform Configuration</h1>
        <p className="settings-page-desc">
          Manage system-level thresholds, automated routing rules, and platform moderation preferences.
        </p>
      </div>

      <div className="settings-sections">
        {/* Module 2: Smart Content Approval Thresholds */}
        <section className="settings-section">
          <ThresholdSettings />
        </section>

        {/* Informational Card about AI Moderation Pipeline */}
        <div className="pipeline-info-card">
          <div className="info-card-header">
            <h3>AI Moderation End-to-End Architecture</h3>
            <span className="info-badge">Team Workflow</span>
          </div>
          <p className="info-card-text">
            <code>User submits content → Module 1: AI checks & Risk Score → Module 2: Smart Content Approval (Auto-Approve / Admin Review / Auto-Block) → Notifications → Module 5: Appeals</code>
          </p>
          <div className="info-grid">
            <div className="info-grid-item">
              <strong>Module 1: Risk Engine</strong>
              <span>Computes 0–100 risk score on submission</span>
            </div>
            <div className="info-grid-item">
              <strong>Module 2: Approval Engine</strong>
              <span>Applies threshold pure function & routes content</span>
            </div>
            <div className="info-grid-item">
              <strong>Module 7: Audit Logs</strong>
              <span>Consumes <code>ModerationAuditLog</code> records emitted by this module</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
