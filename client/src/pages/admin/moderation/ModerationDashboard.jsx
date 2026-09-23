import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import './moderation.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

function getToken() {
  return localStorage.getItem('articleflow_token')
}

function getStatus(result) {
  if (result.riskLevel === 'HIGH') return 'Blocked'
  if (result.riskLevel === 'MEDIUM') return 'Needs Review'
  return 'Safe'
}

function getRiskClass(level) {
  return level?.toLowerCase() || 'low'
}

export default function ModerationDashboard() {
  const [results, setResults] = useState([])
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('All')
  const [riskFilter, setRiskFilter] = useState('All')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadResults() {
      try {
        setLoading(true)
        setError('')

        const response = await fetch(`${API_URL}/api/moderation`, {
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.message || 'Unable to load moderation results.')
        }

        setResults(data.results || [])
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    loadResults()
  }, [])

  const stats = useMemo(() => {
    return {
      total: results.length,
      safe: results.filter((item) => item.riskLevel === 'LOW').length,
      review: results.filter((item) => item.riskLevel === 'MEDIUM').length,
      blocked: results.filter((item) => item.riskLevel === 'HIGH').length,
    }
  }, [results])

  const filteredResults = useMemo(() => {
    const searchText = search.trim().toLowerCase()

    return results.filter((item) => {
      const matchesSearch =
        !searchText ||
        item.title?.toLowerCase().includes(searchText) ||
        item.content?.toLowerCase().includes(searchText) ||
        item.authorName?.toLowerCase().includes(searchText)

      const matchesType =
        typeFilter === 'All' || item.contentType === typeFilter

      const matchesRisk =
        riskFilter === 'All' || item.riskLevel === riskFilter

      return matchesSearch && matchesType && matchesRisk
    })
  }, [results, search, typeFilter, riskFilter])

  return (
    <section className="moderation-page">
      <div className="moderation-header">
        <div>
          <span className="eyebrow">AI Content Moderation</span>
          <h1 className="browse-page-title">Moderation dashboard.</h1>
          <p className="moderation-subtitle">
            Review AI-generated risk analysis for submitted content.
          </p>
        </div>
      </div>

      {error && <p className="error">{error}</p>}

      <div className="moderation-stats">
        <div className="moderation-stat-card">
          <span>Total Scanned</span>
          <strong>{stats.total}</strong>
        </div>

        <div className="moderation-stat-card safe">
          <span>Safe</span>
          <strong>{stats.safe}</strong>
        </div>

        <div className="moderation-stat-card review">
          <span>Needs Review</span>
          <strong>{stats.review}</strong>
        </div>

        <div className="moderation-stat-card blocked">
          <span>Blocked</span>
          <strong>{stats.blocked}</strong>
        </div>
      </div>

      <div className="moderation-toolbar">
        <input
          type="search"
          placeholder="Search content or author..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />

        <select
          value={typeFilter}
          onChange={(event) => setTypeFilter(event.target.value)}
        >
          <option value="All">All content</option>
          <option value="Article">Articles</option>
          <option value="Quiz">Quizzes</option>
          <option value="Comment">Comments</option>
        </select>

        <select
          value={riskFilter}
          onChange={(event) => setRiskFilter(event.target.value)}
        >
          <option value="All">All risks</option>
          <option value="LOW">Low risk</option>
          <option value="MEDIUM">Medium risk</option>
          <option value="HIGH">High risk</option>
        </select>
      </div>

      <div className="moderation-section">
        <div className="moderation-section-header">
          <div>
            <span className="eyebrow">Moderation Queue</span>
            <h2>Content analysis</h2>
          </div>

          <span className="moderation-count">
            {filteredResults.length} result
            {filteredResults.length === 1 ? '' : 's'}
          </span>
        </div>

        {loading ? (
          <p>Loading moderation results…</p>
        ) : filteredResults.length === 0 ? (
          <div className="moderation-empty">
            <h3>No moderation results found.</h3>
            <p>
              Results will appear here after content has been analyzed.
            </p>
          </div>
        ) : (
          <div className="moderation-table-wrapper">
            <table className="moderation-table">
              <thead>
                <tr>
                  <th>Content</th>
                  <th>Type</th>
                  <th>Author</th>
                  <th>AI Risk</th>
                  <th>Status</th>
                  <th>View</th>
                </tr>
              </thead>

              <tbody>
                {filteredResults.map((item) => (
                  <tr key={item._id}>
                    <td>
                      <div className="moderation-content-cell">
                        <strong>
                          {item.title || 'Untitled content'}
                        </strong>

                        <span>
                          {item.content
                            ? `${item.content.slice(0, 70)}${
                                item.content.length > 70 ? '…' : ''
                              }`
                            : 'No preview available'}
                        </span>
                      </div>
                    </td>

                    <td>{item.contentType}</td>

                    <td>{item.authorName || 'Unknown'}</td>

                    <td>
                      <span
                        className={`risk-badge ${getRiskClass(
                          item.riskLevel
                        )}`}
                      >
                        {Math.round(item.riskScore * 100)}%
                      </span>
                    </td>

                    <td>
                      <span
                        className={`status-badge ${getRiskClass(
                          item.riskLevel
                        )}`}
                      >
                        {getStatus(item)}
                      </span>
                    </td>

                    <td>
                      <Link
                        className="button moderation-view-button"
                        to={`/admin/moderation/${item._id}`}
                      >
                        View
                      </Link>
                    </td>
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