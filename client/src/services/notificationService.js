import { api } from './api'

export const getNotifications = () => api('/notifications')

export const markNotificationAsRead = (id) => api(`/notifications/${id}/read`, { method: 'PATCH', body: '{}' })

export const markAllNotificationsAsRead = () => api('/notifications/read-all', { method: 'PATCH', body: '{}' })
