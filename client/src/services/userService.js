import { api } from './api.js';

export const userService = {
  getPublicProfile: async (userId) => {
    return api(`/users/${userId}/profile`);
  },
};