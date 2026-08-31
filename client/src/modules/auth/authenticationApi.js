// Vite proxies this path to the Express API in development. Set VITE_API_URL
// when the frontend and API are deployed on different domains.
const API_URL = import.meta.env.VITE_API_URL || '/api';

export async function authRequest(path, data, token) {
  const response = await fetch(`${API_URL}/auth/${path}`, {
    method: data ? 'POST' : 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(data ? { body: JSON.stringify(data) } : {}),
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.message || 'Request failed.');
  return payload;
}
