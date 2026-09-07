const API_URL = 'http://localhost:5000/api/chat'

function getToken() {
  return localStorage.getItem('articleflow_token')
}

async function request(url, options = {}) {
  const response = await fetch(`${API_URL}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
      ...(options.headers || {})
    }
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message || 'Something went wrong.')
  }

  return data
}

export const chatService = {
  getUsers: () => request('/users'),

  getConversation: (userId) => request(`/${userId}`),

  sendMessage: (userId, text) =>
    request(`/${userId}`, {
      method: 'POST',
      body: JSON.stringify({ text })
    })
}