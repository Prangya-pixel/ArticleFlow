import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { moderationService } from '../../services/moderationService';

export default function ModerationSummaryWidget() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function loadStats() {
      try {
        const data = await moderationService.getStats();
        if (active) setStats(data);
      } catch (err) {
        console.error('Failed to load moderation stats:', err);
      } finally {
        if (active) setLoading(false);
      }
    }
    loadStats();
    return () => { active = false; };
  }, []);

  if (loading) {
    return (
      <div className="moderation-widget-card loading-widget">
        <span>Loading AI Moderation summary...</span>
      </div>
    );
  }

  const safe = stats?.counts?.safe || 0;
  const needsReview = stats?.counts?.needsReview || 0;
  const blocked = stats?.counts?.blocked || 0;
  const total = (safe + needsReview + blocked) || 1;

  const safePct = Math.round((safe / total) * 100);
  const reviewPct = Math.round((needsReview / total) * 100);
  const blockedPct = Math.max(0, 100 - safePct - reviewPct);

  return (
    <section className="dashboard-section moderation-summary-section">
      <div className="dashboard-section-heading">
        <div>
          <h2>AI Moderation Summary</h2>
          <p className="section-subtext">Live content breakdown by risk band and approval routing</p>
        </div>
        <Link to="/admin/moderation" className="view-queue-link">
          Open Moderation Queue →
        </Link>
      </div>

      <div className="moderation-summary-widget">
        {/* Composite Progress Bar */}
        <div className="summary-composite-bar" role="progressbar" aria-valuenow={100} aria-valuemin={0} aria-valuemax={100}>
          <div
            className="composite-segment segment-safe"
            style={{ width: `${safePct}%` }}
            title={`Safe: ${safe} (${safePct}%)`}
          />
          <div
            className="composite-segment segment-review"
            style={{ width: `${reviewPct}%` }}
            title={`Needs Review: ${needsReview} (${reviewPct}%)`}
          />
          <div
            className="composite-segment segment-blocked"
            style={{ width: `${blockedPct}%` }}
            title={`Blocked: ${blocked} (${blockedPct}%)`}
          />
        </div>

        {/* 3 Metric Cards */}
        <div className="summary-metrics-grid">
          <div className="summary-metric-card metric-safe">
            <div className="metric-header">
              <span className="metric-dot dot-safe"></span>
              <span className="metric-label">Safe (Auto-Approved)</span>
              <span className="metric-percentage">{safePct}%</span>
            </div>
            <strong className="metric-value">{safe}</strong>
            <span className="metric-threshold">Risk Score ≤ {stats?.thresholds?.lowMax ?? 30}</span>
          </div>

          <div className="summary-metric-card metric-review">
            <div className="metric-header">
              <span className="metric-dot dot-review"></span>
              <span className="metric-label">Needs Review</span>
              <span className="metric-percentage">{reviewPct}%</span>
            </div>
            <strong className="metric-value">{needsReview}</strong>
            <span className="metric-threshold">
              {stats?.thresholds?.lowMax ?? 30} &lt; Score &lt; {stats?.thresholds?.highMin ?? 70}
            </span>
          </div>

          <div className="summary-metric-card metric-blocked">
            <div className="metric-header">
              <span className="metric-dot dot-blocked"></span>
              <span className="metric-label">Blocked</span>
              <span className="metric-percentage">{blockedPct}%</span>
            </div>
            <strong className="metric-value">{blocked}</strong>
            <span className="metric-threshold">Risk Score ≥ {stats?.thresholds?.highMin ?? 70}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
