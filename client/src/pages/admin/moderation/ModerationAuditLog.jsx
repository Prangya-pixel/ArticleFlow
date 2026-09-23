import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../../services/api'
import './moderation.css'

const targetTypes = ['ALL', 'ARTICLE', 'QUIZ', 'COMMENT', 'USER', 'REPORT', 'APPEAL']
const statuses = [
  'ALL',
  'AUTO_APPROVED',
  'ADMIN_REVIEWED',
  'PENDING_REVIEW',
  'AUTO_BLOCKED',
  'ADMIN_BLOCKED',
  'APPEALED',
  'DISMISSED',
]

function formatLabel(value) {
  return value
    .toLowerCase()
    .split('_')
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(' ')
}

function getRiskClass(level) {
  return level?.toLowerCase() || 'unknown'
}

export default function ModerationAuditLog() {
  const [events, setEvents] = useState([])
  const [search, setSearch] = useState('')
  const [targetType, setTargetType] = useState('ALL')
  const [status, setStatus] = useState('ALL')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadAuditEvents() {
      try {
        setLoading(true)
        setError('')
        const data = await api('/moderation/audit')
        setEvents(data.events || [])
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    loadAuditEvents()
  }, [])

  const filteredEvents = useMemo(() => {
    const searchText = search.trim().toLowerCase()

    return events.filter((event) => {
      const matchesSearch =
        !searchText ||
        event.targetId?.toLowerCase().includes(searchText) ||
        event.eventType?.toLowerCase().includes(searchText) ||
        event.reason?.toLowerCase().includes(searchText)
      const matchesType = targetType === 'ALL' || event.targetType === targetType
      const matchesStatus = status === 'ALL' || event.status === status

      return matchesSearch && matchesType && matchesStatus
    })
  }, [events, search, targetType, status])

  return (
    <section className="moderation-page">
      <div className="moderation-review-header">
        <div>
          <Link className="moderation-back-link" to="/admin/moderation">
            ← Moderation dashboard
          </Link>
          <span className="eyebrow">Moderation history</span>
          <h1 className="browse-page-title">Audit log.</h1>
          <p className="moderation-subtitle">
            Append-only history of AI, system, admin, and user actions.
          </p>
        </div>
      </div>

      {error && <p className="error">{error}</p>}

      <div className="moderation-toolbar">
        <input
          type="search"
          placeholder="Search audit events..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <select value={targetType} onChange={(event) => setTargetType(event.target.value)}>
          {targetTypes.map((value) => (
            <option key={value} value={value}>
              {value === 'ALL' ? 'All content types' : formatLabel(value)}
            </option>
          ))}
        </select>
        <select value={status} onChange={(event) => setStatus(event.target.value)}>
          {statuses.map((value) => (
            <option key={value} value={value}>
              {value === 'ALL' ? 'All statuses' : formatLabel(value)}
            </option>
          ))}
        </select>
      </div>

      <div className="moderation-section">
        <div className="moderation-section-header">
          <div>
            <span className="eyebrow">Audit trail</span>
            <h2>Moderation events</h2>
          </div>
          <span className="moderation-count">{filteredEvents.length} event{filteredEvents.length === 1 ? '' : 's'}</span>
        </div>

        {loading ? (
          <p className="moderation-empty">Loading audit history…</p>
        ) : filteredEvents.length === 0 ? (
          <div className="moderation-empty">
            <h3>No audit events found.</h3>
            <p>Events will appear after content is analyzed or reviewed.</p>
          </div>
        ) : (
          <div className="moderation-table-wrapper">
            <table className="moderation-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Content</th>
                  <th>Type</th>
                  <th>Risk</th>
                  <th>Status</th>
                  <th>Action</th>
                  <th>Reason</th>
                </tr>
              </thead>
              <tbody>
                {filteredEvents.map((event) => (
                  <tr key={event._id}>
                    <td>{new Date(event.createdAt).toLocaleString()}</td>
                    <td>{event.targetId}</td>
                    <td>{formatLabel(event.targetType)}</td>
                    <td>
                      <span className={`risk-badge ${getRiskClass(event.riskLevel)}`}>
                        {event.riskLevel ? `${event.riskLevel} ${Math.round(event.riskScore * 100)}%` : 'Not scored'}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${getRiskClass(event.riskLevel)}`}>
                        {formatLabel(event.status)}
                      </span>
                    </td>
                    <td>{formatLabel(event.eventType)}</td>
                    <td>{event.reason || 'No reason provided.'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  )
}
