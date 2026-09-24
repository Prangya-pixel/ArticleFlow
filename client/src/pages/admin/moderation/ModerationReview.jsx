import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import './moderation.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

function getToken() {
  return localStorage.getItem('articleflow_token')
}

function formatScore(score) {
  return `${Math.round((score || 0) * 100)}%`
}

export default function ModerationReview() {
  const { id } = useParams()

  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadResult() {
      try {
        setLoading(true)
        setError('')

        const response = await fetch(
          `${API_URL}/api/moderation/${id}`,
          {
            headers: {
              Authorization: `Bearer ${getToken()}`,
            },
          }
        )

        const data = await response.json()

        if (!response.ok) {
          throw new Error(
            data.message || 'Unable to load moderation result.'
          )
        }

        setResult(data.result)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    loadResult()
  }, [id])

  if (loading) {
    return (
      <section className="moderation-page">
        <p>Loading moderation analysis…</p>
      </section>
    )
  }

  if (error) {
    return (
      <section className="moderation-page">
        <p className="error">{error}</p>

        <Link
          className="button"
          to="/admin/moderation"
        >
          Back to moderation
        </Link>
      </section>
    )
  }

  if (!result) {
    return (
      <section className="moderation-page">
        <p>Moderation result not found.</p>

        <Link
          className="button"
          to="/admin/moderation"
        >
          Back to moderation
        </Link>
      </section>
    )
  }

  const categoryScores = [
    {
      label: 'Spam',
      value: result.categoryScores?.spam,
      flag: result.flags?.spam,
    },
    {
      label: 'Harassment',
      value: result.categoryScores?.harassment,
      flag: result.flags?.toxic,
    },
    {
      label: 'Hate Speech',
      value: result.categoryScores?.hateSpeech,
      flag: result.flags?.hateSpeech,
    },
    {
      label: 'Violence',
      value: result.categoryScores?.violence,
      flag: result.flags?.violence,
    },
    {
      label: 'Adult Content',
      value: result.categoryScores?.adultContent,
      flag: result.flags?.inappropriate,
    },
  ]

  return (
    <section className="moderation-page">
      <div className="moderation-review-header">
        <div>
          <Link
            className="moderation-back-link"
            to="/admin/moderation"
          >
            ← Back to moderation
          </Link>

          <span className="eyebrow">Moderation Review</span>

          <h1 className="browse-page-title">
            {result.title || 'Untitled content'}
          </h1>

          <p className="moderation-subtitle">
            By {result.authorName || 'Unknown'} · {result.contentType}
          </p>
        </div>

        <span
          className={`status-badge ${
            result.riskLevel?.toLowerCase() || 'low'
          }`}
        >
          {result.riskLevel}
        </span>
      </div>

      <div className="moderation-review-grid">
        <div className="moderation-review-main">
          <div className="moderation-card">
            <div className="moderation-card-header">
              <h2>Content Preview</h2>
            </div>

            <div className="moderation-content-preview">
              {result.content}
            </div>
          </div>

          <div className="moderation-card">
            <div className="moderation-card-header">
              <h2>AI Moderation Analysis</h2>
            </div>

            <div className="moderation-analysis-grid">
              <div>
                <span>Risk Score</span>
                <strong>
                  {formatScore(result.riskScore)}
                </strong>
              </div>

              <div>
                <span>Risk Level</span>
                <strong>{result.riskLevel}</strong>
              </div>

              <div>
                <span>Recommendation</span>
                <strong>{result.recommendation}</strong>
              </div>

              <div>
                <span>AI Flagged</span>
                <strong>
                  {result.aiFlagged ? 'Yes' : 'No'}
                </strong>
              </div>
            </div>
          </div>

          <div className="moderation-card">
            <div className="moderation-card-header">
              <h2>Category Scores</h2>
            </div>

            <div className="moderation-category-list">
              {categoryScores.map((category) => (
                <div
                  className="moderation-category-row"
                  key={category.label}
                >
                  <div>
                    <strong>{category.label}</strong>

                    {category.flag && (
                      <span className="moderation-flag">
                        Flagged
                      </span>
                    )}
                  </div>

                  <div className="moderation-category-value">
                    <div className="moderation-progress">
                      <div
                        className="moderation-progress-bar"
                        style={{
                          width: `${Math.min(
                            (category.value || 0) * 100,
                            100
                          )}%`,
                        }}
                      />
                    </div>

                    <span>
                      {formatScore(category.value)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside className="moderation-review-side">
          <div className="moderation-card">
            <div className="moderation-card-header">
              <h2>Detected Signals</h2>
            </div>

            <div className="moderation-signal-list">
              <div>
                <span>Spam</span>
                <strong>
                  {result.flags?.spam ? 'Detected' : 'Not detected'}
                </strong>
              </div>

              <div>
                <span>Suspicious Links</span>
                <strong>
                  {result.flags?.suspiciousLinks
                    ? 'Detected'
                    : 'Not detected'}
                </strong>
              </div>

              <div>
                <span>PII</span>
                <strong>
                  {result.flags?.pii ? 'Detected' : 'Not detected'}
                </strong>
              </div>

              <div>
                <span>Hate Speech</span>
                <strong>
                  {result.flags?.hateSpeech
                    ? 'Detected'
                    : 'Not detected'}
                </strong>
              </div>

              <div>
                <span>Violence</span>
                <strong>
                  {result.flags?.violence
                    ? 'Detected'
                    : 'Not detected'}
                </strong>
              </div>
            </div>
          </div>

          <div className="moderation-card">
            <div className="moderation-card-header">
              <h2>Moderation Info</h2>
            </div>

            <div className="moderation-info-list">
              <div>
                <span>Content Type</span>
                <strong>{result.contentType}</strong>
              </div>

              <div>
                <span>Author</span>
                <strong>{result.authorName || 'Unknown'}</strong>
              </div>

              <div>
                <span>Analyzed</span>
                <strong>
                  {result.createdAt
                    ? new Date(result.createdAt).toLocaleString()
                    : 'Unknown'}
                </strong>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </section>
  )
}