import { useEffect, useState } from 'react';
import { moderationService } from '../../services/moderationService';

export default function ThresholdSettings() {
  const [lowMax, setLowMax] = useState(30);
  const [highMin, setHighMin] = useState(70);
  const [originalSettings, setOriginalSettings] = useState({ lowMax: 30, highMin: 70 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [stats, setStats] = useState(null);

  useEffect(() => {
    let active = true;
    async function loadData() {
      try {
        setLoading(true);
        const [thresholdData, statsData] = await Promise.all([
          moderationService.getThresholds(),
          moderationService.getStats()
        ]);
        if (active) {
          const l = thresholdData.lowMax ?? 30;
          const h = thresholdData.highMin ?? 70;
          setLowMax(l);
          setHighMin(h);
          setOriginalSettings({ lowMax: l, highMin: h });
          setStats(statsData);
        }
      } catch (err) {
        if (active) setError(err.message || 'Failed to load thresholds');
      } finally {
        if (active) setLoading(false);
      }
    }
    loadData();
    return () => { active = false; };
  }, []);

  const isValid = Number(lowMax) >= 0 && Number(highMin) <= 100 && Number(lowMax) < Number(highMin);
  const hasChanges = lowMax !== originalSettings.lowMax || highMin !== originalSettings.highMin;

  // Calculate live preview percentages
  const safeWidth = Math.max(0, Math.min(100, lowMax));
  const reviewWidth = Math.max(0, Math.min(100, highMin - lowMax));
  const blockedWidth = Math.max(0, Math.min(100, 100 - highMin));

  const handlePreset = (presetLow, presetHigh) => {
    setLowMax(presetLow);
    setHighMin(presetHigh);
    setError('');
    setSuccessMsg('');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!isValid) {
      setError('Low-risk threshold must be strictly less than high-risk threshold (0-100).');
      return;
    }

    try {
      setSaving(true);
      setError('');
      setSuccessMsg('');
      const res = await moderationService.updateThresholds({
        lowMax: Number(lowMax),
        highMin: Number(highMin)
      });
      setOriginalSettings({
        lowMax: res.thresholds.lowMax,
        highMin: res.thresholds.highMin
      });
      setSuccessMsg('Thresholds updated successfully! Future content will be routed using these new bounds.');
      // Refresh stats preview
      const refreshedStats = await moderationService.getStats();
      setStats(refreshedStats);
    } catch (err) {
      setError(err.message || 'Failed to update thresholds');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="threshold-card"><p>Loading moderation thresholds...</p></div>;
  }

  return (
    <div className="threshold-container">
      <div className="threshold-card">
        <div className="threshold-header">
          <div>
            <span className="eyebrow">Module 2 Configuration</span>
            <h2 className="threshold-title">Risk Band Thresholds</h2>
            <p className="threshold-subtitle">
              Configure cutoff boundaries for automated approval, human review, and auto-blocking.
            </p>
          </div>
          <div className="threshold-presets">
            <span className="preset-label">Presets:</span>
            <button
              type="button"
              className="preset-btn"
              onClick={() => handlePreset(30, 70)}
            >
              Balanced (30 / 70)
            </button>
            <button
              type="button"
              className="preset-btn"
              onClick={() => handlePreset(15, 60)}
            >
              Strict (15 / 60)
            </button>
            <button
              type="button"
              className="preset-btn"
              onClick={() => handlePreset(45, 85)}
            >
              Permissive (45 / 85)
            </button>
          </div>
        </div>

        {error && <div className="alert-box alert-error">{error}</div>}
        {successMsg && <div className="alert-box alert-success">{successMsg}</div>}

        <form onSubmit={handleSave} className="threshold-form">
          {/* Visual Spectrum Bar */}
          <div className="spectrum-wrapper">
            <div className="spectrum-labels">
              <span className="spectrum-label-safe">0 (Safe)</span>
              <span className="spectrum-label-cut">{lowMax}</span>
              <span className="spectrum-label-cut">{highMin}</span>
              <span className="spectrum-label-block">100 (Critical)</span>
            </div>
            <div className="spectrum-bar">
              <div
                className="spectrum-seg spectrum-seg-safe"
                style={{ width: `${safeWidth}%` }}
                title={`Auto-Approve: 0 to ${lowMax}`}
              >
                <span>Auto-Approve (0–{lowMax})</span>
              </div>
              <div
                className="spectrum-seg spectrum-seg-review"
                style={{ width: `${reviewWidth}%` }}
                title={`Admin Review: ${lowMax} to ${highMin}`}
              >
                <span>Review Queue ({lowMax}–{highMin})</span>
              </div>
              <div
                className="spectrum-seg spectrum-seg-block"
                style={{ width: `${blockedWidth}%` }}
                title={`Auto-Block: ${highMin} to 100`}
              >
                <span>Auto-Block ({highMin}–100)</span>
              </div>
            </div>
          </div>

          <div className="threshold-inputs-grid">
            <div className="input-group">
              <label htmlFor="lowMaxInput">
                <strong>Low-Risk Cutoff (Auto-Approve Max)</strong>
                <span className="input-hint">Content with risk score ≤ this value publishes immediately.</span>
              </label>
              <div className="slider-control">
                <input
                  id="lowMaxInput"
                  type="range"
                  min="0"
                  max="99"
                  value={lowMax}
                  onChange={(e) => setLowMax(Number(e.target.value))}
                  className="range-slider slider-safe"
                />
                <input
                  type="number"
                  min="0"
                  max="99"
                  value={lowMax}
                  onChange={(e) => setLowMax(Number(e.target.value))}
                  className="number-input"
                />
              </div>
            </div>

            <div className="input-group">
              <label htmlFor="highMinInput">
                <strong>High-Risk Cutoff (Auto-Block Min)</strong>
                <span className="input-hint">Content with risk score ≥ this value is rejected immediately.</span>
              </label>
              <div className="slider-control">
                <input
                  id="highMinInput"
                  type="range"
                  min="1"
                  max="100"
                  value={highMin}
                  onChange={(e) => setHighMin(Number(e.target.value))}
                  className="range-slider slider-block"
                />
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={highMin}
                  onChange={(e) => setHighMin(Number(e.target.value))}
                  className="number-input"
                />
              </div>
            </div>
          </div>

          {/* Live Preview of % of content in each band */}
          <div className="preview-card">
            <div className="preview-card-header">
              <h3>Live Distribution Simulation</h3>
              <span className="preview-badge">Real-time projection</span>
            </div>
            <p className="preview-desc">
              Based on the risk scores of recent content, here is how submissions are routed with these thresholds:
            </p>
            <div className="distribution-grid">
              <div className="dist-item dist-safe">
                <span className="dist-label">Auto-Approved (Safe)</span>
                <strong className="dist-value">
                  {stats?.distribution ? `${stats.distribution.safePct}%` : `${safeWidth}%`}
                </strong>
                <span className="dist-sub">Scores 0 to {lowMax}</span>
              </div>
              <div className="dist-item dist-review">
                <span className="dist-label">Admin Review Queue</span>
                <strong className="dist-value">
                  {stats?.distribution ? `${stats.distribution.reviewPct}%` : `${reviewWidth}%`}
                </strong>
                <span className="dist-sub">Scores {lowMax + 1} to {highMin - 1}</span>
              </div>
              <div className="dist-item dist-block">
                <span className="dist-label">Auto-Blocked</span>
                <strong className="dist-value">
                  {stats?.distribution ? `${stats.distribution.blockedPct}%` : `${blockedWidth}%`}
                </strong>
                <span className="dist-sub">Scores {highMin} to 100</span>
              </div>
            </div>
          </div>

          <div className="threshold-actions">
            <button
              type="submit"
              disabled={!isValid || saving || !hasChanges}
              className="button button-primary"
            >
              {saving ? 'Saving changes...' : hasChanges ? 'Save Threshold Changes' : 'Saved (No Changes)'}
            </button>
            {hasChanges && (
              <button
                type="button"
                onClick={() => {
                  setLowMax(originalSettings.lowMax);
                  setHighMin(originalSettings.highMin);
                  setError('');
                }}
                className="button button-secondary"
              >
                Reset to current
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
