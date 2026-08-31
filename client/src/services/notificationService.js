import axios from 'axios'

const API = axios.create({
  baseURL: 'http://localhost:5000/api',
})

function authHeaders() {
  const token = localStorage.getItem('token')

  return {
    Authorization: `Bearer ${token}`,
  }
}

export async function getNotifications() {
  const response = await API.get('/notifications', {
    headers: authHeaders(),
  })

  return response.data
}

export async function markNotificationAsRead(id) {
  const response = await API.patch(
    `/notifications/${id}/read`,
    {},
    {
      headers: authHeaders(),
    }
  )

  return response.data
}

export async function markAllNotificationsAsRead() {
  const response = await API.patch(
    '/notifications/read-all',
    {},
    {
      headers: authHeaders(),
    }
  )

  return response.data
}
