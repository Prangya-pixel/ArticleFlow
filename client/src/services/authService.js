import { authRequest } from '../modules/auth/authenticationApi.js'

export const authService = {
  login: (credentials) => authRequest('login', credentials),
  register: (account) => authRequest('register', account),
  getCurrentUser: (token) => authRequest('me', null, token),
}
