import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { moderationService } from '../../services/moderationService';
import Loading from '../../components/common/Loading';

export default function ModerationQueue() {
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Filters state
  const [contentType, setContentType] = useState('all');
  const [riskBand, setRiskBand] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [order, setOrder] = useState('desc');
  const [search, setSearch] = useState('');

  // Decision Modal State
  const [selectedItem, setSelectedItem] = useState(null);
  const [decisionType, setDecisionType] = useState(null); // 'approve' | 'reject'
  const [reason, setReason] = useState('');
  const [submittingDecision, setSubmittingDecision] = useState(false);

  // Content Preview Modal State
  const [previewItem, setPreviewItem] = useState(null);

  // Simulation Evaluation State
  const [simulating, setSimulating] = useState(false);
  const [simulateScore, setSimulateScore] = useState(55);

  const fetchQueue = useCallback(async (pageToLoad = 1) => {
    try {
      setLoading(true);
      setError('');
      const params = {
        page: pageToLoad,
        limit: 10,
        sortBy,
        order,
        search: search.trim() || undefined,
        riskBand: riskBand !== 'all' ? riskBand : undefined
      };
      const res = await moderationService.getQueue(params);
      setItems(res.items || []);
      setPagination(res.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 });
    } catch (err) {
      setError(err.message || 'Failed to fetch moderation queue');
    } finally {
      setLoading(false);
    }
  }, [sortBy, order, search, riskBand]);

  useEffect(() => {
    fetchQueue(1);
  }, [fetchQueue]);

  const openDecisionModal = (item, type) => {
    setSelectedItem(item);
    setDecisionType(type);
    setReason('');
    setError('');
    setSuccessMsg('');
  };

  const closeDecisionModal = () => {
    setSelectedItem(null);
    setDecisionType(null);
    setReason('');
  };

  const handleDecisionSubmit = async () => {
    if (!selectedItem || !decisionType) return;
    if (decisionType === 'reject' && !reason.trim()) {
      setError('Please provide a reason for rejecting this submission.');
      return;
    }

    try {
      setSubmittingDecision(true);
      setError('');
      await moderationService.submitDecision(
        selectedItem.id || selectedItem._id,
        decisionType,
        reason.trim()
      );
      setSuccessMsg(
        `"${selectedItem.title}" was successfully ${decisionType === 'approve' ? 'approved & published' : 'rejected'}.`
      );
      closeDecisionModal();
      fetchQueue(pagination.page);
    } catch (err) {
      setError(err.message || 'Failed to submit decision');
    } finally {
      setSubmittingDecision(false);
    }
  };

  const handleSimulateEvaluation = async (contentId) => {
    try {
      setSimulating(true);
      setError('');
      const res = await moderationService.evaluate(contentId, simulateScore);
      setSuccessMsg(`Simulated evaluation complete! New outcome: ${res.decision} (Risk Score: ${res.riskScore})`);
      fetchQueue(pagination.page);
    } catch (err) {
      setError(err.message || 'Failed to evaluate content');
    } finally {
      setSimulating(false);
    }
  };

  const getRiskPillClass = (score) => {
    if (score === null || score === undefined) return 'risk-pill-pending';
    if (score <= 30) return 'risk-pill-safe';
    if (score >= 70) return 'risk-pill-danger';
    return 'risk-pill-medium';
  };

  const getRiskLabel = (score) => {
    if (score === null || score === undefined) return 'Pending Score';
    if (score <= 30) return `Low (${score})`;
    if (score >= 70) return `High (${score})`;
    return `Medium (${score})`;
  };

  return (
    <div className="moderation-page">
      {/* Header */}
      <div className="moderation-header">
        <div>
          <span className="eyebrow">AI Moderation System · Module 2</span>
          <h1 className="moderation-title">Smart Content Approval Queue</h1>
          <p className="moderation-lead">
            Review and take administrative action on content routed to the human review bucket by the AI risk scoring engine.
          </p>
        </div>
        <div className="moderation-header-stats">
          <div className="header-stat-box">
            <span className="header-stat-num">{pagination.total}</span>
            <span className="header-stat-label">Pending Review</span>
          </div>
          <button
            type="button"
            className="button button-refresh"
            onClick={() => fetchQueue(pagination.page)}
            title="Refresh queue"
          >
            ↻ Refresh
          </button>
        </div>
      </div>

      {error && <div className="alert-box alert-error">{error}</div>}
      {successMsg && <div className="alert-box alert-success">{successMsg}</div>}

      {/* Filter and Search Bar */}
      <div className="moderation-filters-card">
        <div className="filters-grid">
          <div className="filter-field">
            <label htmlFor="searchFilter">Search Content</label>
            <input
              id="searchFilter"
              type="text"
              placeholder="Search by title, author, or keyword..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="filter-input"
            />
          </div>

          <div className="filter-field">
            <label htmlFor="riskFilter">Risk Band</label>
            <select
              id="riskFilter"
              value={riskBand}
              onChange={(e) => setRiskBand(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Risk Bands</option>
              <option value="medium">Medium Risk (Review Required: 31–69)</option>
            </select>
          </div>

          <div className="filter-field">
            <label htmlFor="sortFilter">Sort By</label>
            <select
              id="sortFilter"
              value={`${sortBy}-${order}`}
              onChange={(e) => {
                const [sb, ord] = e.target.value.split('-');
                setSortBy(sb);
                setOrder(ord);
              }}
              className="filter-select"
            >
              <option value="createdAt-desc">Submission Date (Newest first)</option>
              <option value="createdAt-asc">Submission Date (Oldest first)</option>
              <option value="riskScore-desc">Risk Score (Highest risk first)</option>
              <option value="riskScore-asc">Risk Score (Lowest risk first)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Queue Table */}
      {loading ? (
        <Loading />
      ) : items.length === 0 ? (
        <div className="empty-queue-card">
          <div className="empty-icon">✓</div>
          <h2>Moderation Queue is Clean</h2>
          <p>No content items are currently waiting for admin review.</p>
          <div className="empty-actions">
            <Link to="/admin/home" className="button button-secondary">
              Back to Dashboard
            </Link>
            <Link to="/admin/settings" className="button button-outline">
              Review Threshold Settings
            </Link>
          </div>
        </div>
      ) : (
        <div className="queue-table-card">
          <div className="queue-table-wrapper">
            <table className="queue-table">
              <thead>
                <tr>
                  <th>Content Item</th>
                  <th>Author</th>
                  <th>Content Type</th>
                  <th>Risk Score</th>
                  <th>Submitted</th>
                  <th className="th-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const itemId = item.id || item._id;
                  const score = item.moderation?.riskScore ?? item.riskScore;
                  return (
                    <tr key={itemId} className="queue-row">
                      <td className="td-title-cell">
                        <div className="item-title-group">
                          <button
                            type="button"
                            className="item-title-btn"
                            onClick={() => setPreviewItem(item)}
                            title="Click to preview article"
                          >
                            {item.title}
                          </button>
                          <p className="item-excerpt-preview">
                            {item.excerpt || (item.body ? item.body.slice(0, 110) + '...' : '')}
                          </p>
                        </div>
                      </td>
                      <td className="td-author">
                        <div className="author-badge">
                          <span className="author-avatar-initial">
                            {(item.authorName || 'U').charAt(0).toUpperCase()}
                          </span>
                          <span>{item.authorName}</span>
                        </div>
                      </td>
                      <td className="td-type">
                        <span className="type-pill">{item.category || 'Article'}</span>
                      </td>
                      <td className="td-risk">
                        <span className={`risk-pill ${getRiskPillClass(score)}`}>
                          <span className="risk-dot"></span>
                          {getRiskLabel(score)}
                        </span>
                      </td>
                      <td className="td-date">
                        {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Recent'}
                      </td>
                      <td className="td-actions">
                        <div className="action-buttons-group">
                          <button
                            type="button"
                            className="btn-action btn-preview"
                            onClick={() => setPreviewItem(item)}
                            title="Preview Content"
                          >
                            Inspect
                          </button>
                          <button
                            type="button"
                            className="btn-action btn-approve"
                            onClick={() => openDecisionModal(item, 'approve')}
                            title="Approve & Publish"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            className="btn-action btn-reject"
                            onClick={() => openDecisionModal(item, 'reject')}
                            title="Reject / Block"
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="pagination-bar">
            <span className="pagination-info">
              Showing {(pagination.page - 1) * pagination.limit + 1}–
              {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} pending submissions
            </span>
            <div className="pagination-controls">
              <button
                type="button"
                className="btn-page"
                disabled={pagination.page <= 1}
                onClick={() => fetchQueue(pagination.page - 1)}
              >
                Previous
              </button>
              <span className="page-indicator">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                type="button"
                className="btn-page"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchQueue(pagination.page + 1)}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Decision Confirmation Modal */}
      {selectedItem && (
        <div className="modal-backdrop" onClick={closeDecisionModal}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className={`modal-badge ${decisionType === 'approve' ? 'modal-badge-approve' : 'modal-badge-reject'}`}>
                {decisionType === 'approve' ? 'Manual Approve' : 'Manual Reject'}
              </span>
              <h2>{decisionType === 'approve' ? 'Approve & Publish Article' : 'Reject Article Submission'}</h2>
              <button type="button" className="btn-close" onClick={closeDecisionModal}>✕</button>
            </div>

            <div className="modal-body">
              <div className="modal-item-summary">
                <strong>{selectedItem.title}</strong>
                <p>By {selectedItem.authorName} · Category: {selectedItem.category}</p>
                <div className="modal-risk-metric">
                  <span>Current AI Risk Score:</span>
                  <span className={`risk-pill ${getRiskPillClass(selectedItem.moderation?.riskScore ?? selectedItem.riskScore)}`}>
                    {getRiskLabel(selectedItem.moderation?.riskScore ?? selectedItem.riskScore)}
                  </span>
                </div>
              </div>

              {decisionType === 'reject' ? (
                <div className="modal-input-group">
                  <label htmlFor="rejectReason">
                    <strong>Rejection Reason (Required)</strong>
                    <span className="input-hint">
                      This explanation will be recorded in the audit log and sent to the author.
                    </span>
                  </label>
                  <textarea
                    id="rejectReason"
                    rows="3"
                    placeholder="E.g. Contains unverified promotional links, violates community safety policies..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="modal-textarea"
                  />
                  <div className="reason-presets">
                    <span className="preset-label">Quick reasons:</span>
                    <button
                      type="button"
                      className="reason-tag"
                      onClick={() => setReason('Content violates community guidelines on spam and promotional material.')}
                    >
                      Spam / Promotion
                    </button>
                    <button
                      type="button"
                      className="reason-tag"
                      onClick={() => setReason('Content quality does not meet our publishing standards.')}
                    >
                      Quality Standards
                    </button>
                    <button
                      type="button"
                      className="reason-tag"
                      onClick={() => setReason('Potential copyright or unverified attribution issue.')}
                    >
                      Copyright / Attribution
                    </button>
                  </div>
                </div>
              ) : (
                <p className="modal-confirm-text">
                  Approving this submission will immediately publish it to readers, mark its moderation status as <em>published</em>, and record your admin decision in the audit log.
                </p>
              )}
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="button button-secondary"
                onClick={closeDecisionModal}
                disabled={submittingDecision}
              >
                Cancel
              </button>
              <button
                type="button"
                className={`button ${decisionType === 'approve' ? 'button-approve-action' : 'button-reject-action'}`}
                onClick={handleDecisionSubmit}
                disabled={submittingDecision || (decisionType === 'reject' && !reason.trim())}
              >
                {submittingDecision
                  ? 'Saving decision...'
                  : decisionType === 'approve'
                  ? 'Confirm & Publish'
                  : 'Confirm & Reject'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Content Preview Modal */}
      {previewItem && (
        <div className="modal-backdrop" onClick={() => setPreviewItem(null)}>
          <div className="modal-sheet modal-preview-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="eyebrow">Content Inspection</span>
              <h2>{previewItem.title}</h2>
              <button type="button" className="btn-close" onClick={() => setPreviewItem(null)}>✕</button>
            </div>
            <div className="modal-body preview-scrollable">
              <div className="preview-meta-bar">
                <span>Author: <strong>{previewItem.authorName}</strong></span>
                <span>Category: <strong>{previewItem.category}</strong></span>
                <span>Status: <strong>{previewItem.status}</strong></span>
                <span className={`risk-pill ${getRiskPillClass(previewItem.moderation?.riskScore ?? previewItem.riskScore)}`}>
                  Risk: {getRiskLabel(previewItem.moderation?.riskScore ?? previewItem.riskScore)}
                </span>
              </div>
              <div className="preview-excerpt-box">
                <strong>Excerpt:</strong> {previewItem.excerpt}
              </div>
              <div className="preview-body-content">
                <strong>Article Body:</strong>
                <p className="preview-body-text">{previewItem.body}</p>
              </div>

              {/* Simulation tools inside inspector */}
              <div className="simulation-box">
                <h4>Simulate AI Risk Score & Re-evaluate</h4>
                <div className="simulation-inputs">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={simulateScore}
                    onChange={(e) => setSimulateScore(Number(e.target.value))}
                    className="range-slider"
                  />
                  <span>Forced Score: <strong>{simulateScore}</strong></span>
                  <button
                    type="button"
                    className="button button-outline"
                    onClick={() => handleSimulateEvaluation(previewItem.id || previewItem._id)}
                    disabled={simulating}
                  >
                    {simulating ? 'Evaluating...' : 'Run Pipeline'}
                  </button>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="button button-secondary"
                onClick={() => setPreviewItem(null)}
              >
                Close
              </button>
              <button
                type="button"
                className="button button-approve-action"
                onClick={() => {
                  const item = previewItem;
                  setPreviewItem(null);
                  openDecisionModal(item, 'approve');
                }}
              >
                Approve
              </button>
              <button
                type="button"
                className="button button-reject-action"
                onClick={() => {
                  const item = previewItem;
                  setPreviewItem(null);
                  openDecisionModal(item, 'reject');
                }}
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
