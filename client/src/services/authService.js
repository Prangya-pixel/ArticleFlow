import { authRequest } from '../modules/auth/authenticationApi.js'
import { api } from './api.js'

export const authService = {
  login: (credentials) => authRequest('login', credentials),
  register: (account) => authRequest('register', account),
  getCurrentUser: (token) => authRequest('me', null, token),
  updateProfile: (profile) => api('/auth/me', { method: 'PATCH', body: JSON.stringify(profile) }),
  requestPasswordReset: (email) => authRequest('forgot-password', { email }),
  resetPassword: (token, password) => authRequest('reset-password', { token, password }),
}
