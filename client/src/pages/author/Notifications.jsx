import { useEffect, useState } from 'react'
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '../../services/notificationService'

function notificationLabel(type) {
  if (type === 'APPROVED') return 'Article approved'
  if (type === 'REJECTED') return 'Article rejected'
  if (type === 'CHANGES_REQUESTED') return 'Changes requested'
  return 'Notification'
}

function notificationClass(type) {
  if (type === 'APPROVED') return 'notification-approved'
  if (type === 'REJECTED') return 'notification-rejected'
  if (type === 'CHANGES_REQUESTED') return 'notification-changes'
  return ''
}

export default function Notifications() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function loadNotifications() {
    try {
      setLoading(true)
      setError('')

      const data = await getNotifications()
      setNotifications(data)
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.message ||
        'Failed to load notifications.'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadNotifications()
  }, [])

  async function handleRead(id) {
    try {
      await markNotificationAsRead(id)

      setNotifications(current =>
        current.map(notification =>
          notification._id === id
            ? { ...notification, isRead: true }
            : notification
        )
      )
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.message ||
        'Failed to mark notification as read.'
      )
    }
  }

  async function handleMarkAllRead() {
    try {
      await markAllNotificationsAsRead()

      setNotifications(current =>
        current.map(notification => ({
          ...notification,
          isRead: true,
        }))
      )
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.message ||
        'Failed to mark notifications as read.'
      )
    }
  }

  const unreadCount = notifications.filter(
    notification => !notification.isRead
  ).length

  return (
    <div className="notifications-page">
      <div className="notifications-header">
        <div>
          <span className="eyebrow">Author workspace</span>
          <h1 className="notifications-title">Notifications.</h1>
          <p className="notifications-description">
            Stay updated on the review status of your articles.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            className="notification-read-all"
            type="button"
            onClick={handleMarkAllRead}
          >
            Mark all as read
          </button>
        )}
      </div>

      {error && (
        <div className="admin-review-error">
          <span>{error}</span>
          <button type="button" onClick={() => setError('')}>
            Dismiss
          </button>
        </div>
      )}

      {loading ? (
        <p className="loading">Loading notifications...</p>
      ) : notifications.length === 0 ? (
        <div className="admin-empty-state">
          <span>?</span>
          <h2>You're all caught up.</h2>
          <p>No notifications yet.</p>
        </div>
      ) : (
        <div className="notification-list">
          {notifications.map(notification => (
            <article
              key={notification._id}
              className={`notification-card ${
                notification.isRead ? 'read' : 'unread'
              }`}
            >
              <div className="notification-icon">
                {notification.type === 'APPROVED'
                  ? '?'
                  : notification.type === 'REJECTED'
                    ? '!'
                    : '?'}
              </div>

              <div className="notification-content">
                <div className="notification-top">
                  <span
                    className={`notification-type ${notificationClass(
                      notification.type
                    )}`}
                  >
                    {notificationLabel(notification.type)}
                  </span>

                  {!notification.isRead && (
                    <span className="notification-unread">
                      Unread
                    </span>
                  )}
                </div>

                <p className="notification-message">
                  {notification.message}
                </p>

                {notification.createdAt && (
                  <p className="notification-date">
                    {new Date(notification.createdAt).toLocaleString()}
                  </p>
                )}

                {!notification.isRead && (
                  <button
                    className="notification-read-button"
                    type="button"
                    onClick={() => handleRead(notification._id)}
                  >
                    Mark as read
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
