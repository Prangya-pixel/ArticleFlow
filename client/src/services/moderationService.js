import { api } from './api';

export const moderationService = {
  /**
   * Fetch paginated moderation queue
   * @param {Object} [params] - { page, limit, category, riskBand, riskMin, riskMax, search, sortBy, order }
   */
  getQueue: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        query.append(key, val);
      }
    });
    const queryString = query.toString();
    return api(`/moderation/approval/queue${queryString ? `?${queryString}` : ''}`);
  },

  /**
   * Submit manual admin decision (approve or reject)
   */
  submitDecision: (contentId, decision, reason = '') =>
    api(`/moderation/approval/${contentId}/decision`, {
      method: 'PATCH',
      body: JSON.stringify({ decision, reason })
    }),

  /**
   * Fetch active threshold configuration
   */
  getThresholds: () => api('/moderation/approval/thresholds'),

  /**
   * Update active threshold configuration
   */
  updateThresholds: ({ lowMax, highMin }) =>
    api('/moderation/approval/thresholds', {
      method: 'PUT',
      body: JSON.stringify({ lowMax, highMin })
    }),

  /**
   * Fetch live statistics for dashboard summary widget and threshold simulation
   */
  getStats: () => api('/moderation/approval/stats'),

  /**
   * Evaluate a content item through the pipeline (or simulate with a forced score)
   */
  evaluate: (contentId, forceScore) =>
    api(`/moderation/approval/evaluate/${contentId}`, {
      method: 'POST',
      body: JSON.stringify({ forceScore })
    }),

  /**
   * Reinstate blocked content (supports Module 5 appeal flow)
   */
  reinstate: (contentId, reason = '') =>
    api(`/moderation/approval/reinstate/${contentId}`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    })
};
