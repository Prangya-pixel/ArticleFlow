import { api } from './api'

export const verificationService = {
  // Existing article verification APIs
  getPending: () => api('/verification/submissions'),

  approve: (id) =>
    api(`/verification/submissions/${id}/approve`, {
      method: 'PATCH',
      body: '{}'
    }),

  reject: (id, adminNote) =>
    api(`/verification/submissions/${id}/reject`, {
      method: 'PATCH',
      body: JSON.stringify({ adminNote })
    }),

  requestChanges: (id, adminNote) =>
    api(`/verification/submissions/${id}/request-changes`, {
      method: 'PATCH',
      body: JSON.stringify({ adminNote })
    }),

  // Spam content approval APIs
  getSpamApprovalQueue: () =>
    api('/spam-approval/queue'),

  approveSpamContent: (id) =>
    api(`/spam-approval/queue/${id}/approve`, {
      method: 'PATCH',
      body: '{}'
    }),

  rejectSpamContent: (id, adminNote) =>
    api(`/spam-approval/queue/${id}/reject`, {
      method: 'PATCH',
      body: JSON.stringify({ adminNote })
    })
}