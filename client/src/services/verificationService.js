import { api } from './api'

export const verificationService = {
  getPending: () => api('/verification/submissions'),
  approve: (id) => api(`/verification/submissions/${id}/approve`, { method: 'PATCH', body: '{}' }),
  reject: (id, adminNote) => api(`/verification/submissions/${id}/reject`, { method: 'PATCH', body: JSON.stringify({ adminNote }) }),
  requestChanges: (id, adminNote) => api(`/verification/submissions/${id}/request-changes`, { method: 'PATCH', body: JSON.stringify({ adminNote }) }),
}
