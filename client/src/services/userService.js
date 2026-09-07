import { api } from './api'

export const userService = {
  getFollowStatus: (userId) => api(`/users/${userId}/follow`),
  toggleFollow: (userId) => api(`/users/${userId}/follow`, { method: 'PATCH', body: '{}' }),
}