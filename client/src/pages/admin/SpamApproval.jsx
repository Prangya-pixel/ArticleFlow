import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { verificationService } from '../../services/verificationService'

export default function SpamApproval() {
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionLoading, setActionLoading] = useState(null)

  const loadArticles = async () => {
    setLoading(true)
    setError('')

    try {
      const data = await verificationService.getSpamApprovalQueue()
      setArticles(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadArticles()
  }, [])

  const approveSpam = async (id) => {
    setActionLoading(id)
    setError('')

    try {
      await verificationService.approveSpamContent(id)

      setArticles((items) =>
        items.filter((item) => (item.id || item._id) !== id)
      )
    } catch (err) {
      setError(err.message)
    } finally {
      setActionLoading(null)
    }
  }

  const rejectSpam = async (id) => {
    const adminNote = window.prompt(
      'Why is this content being rejected as spam?'
    )

    if (!adminNote?.trim()) {
      return
    }

    setActionLoading(id)
    setError('')

    try {
      await verificationService.rejectSpamContent(id, adminNote)

      setArticles((items) =>
        items.filter((item) => (item.id || item._id) !== id)
      )
    } catch (err) {
      setError(err.message)
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <section className="browse-page-wrapper">
      <span className="eyebrow">Spam content approval</span>

      <div className="dashboard-section-heading">
        <div>
          <h1 className="browse-page-title">Spam review queue.</h1>

          <p className="notifications-description">
            Review content flagged by the spam detection system before it
            continues through the publishing workflow.
          </p>
        </div>
      </div>

      {error && <p className="error">{error}</p>}

      {loading ? (
        <p>Loading spam submissions...</p>
      ) : articles.length === 0 ? (
        <div className="notification-empty-state">
          <span>✓</span>

          <h2>No spam submissions waiting.</h2>

          <p>
            Articles waiting for spam approval will appear here.
          </p>
        </div>
      ) : (
        <div className="admin-review-history">
          {articles.map((article) => {
            const id = article.id || article._id
            const isLoading = actionLoading === id

            return (
              <article
                className="admin-review-history-card"
                key={id}
              >
                <div>
                  <span className="admin-review-status">
                    {article.spamStatus || 'Not Checked'}
                  </span>
                </div>

                <div>
                  <h3>{article.title}</h3>

                  <p>
                    By {article.authorName || article.author}
                  </p>

                  <p>{article.excerpt}</p>

                  {article.spamScore !== null &&
                    article.spamScore !== undefined && (
                      <p>
                        Spam score:{' '}
                        {Math.round(article.spamScore * 100)}%
                      </p>
                    )}

                  {article.spamReasons?.length > 0 && (
                    <p>
                      Reasons:{' '}
                      {article.spamReasons.join(', ')}
                    </p>
                  )}

                  <div className="dashboard-actions">
                    <Link
                      className="button"
                      to={`/admin/article/${id}`}
                    >
                      Review article
                    </Link>

                    <button
                      className="button"
                      disabled={isLoading}
                      onClick={() => approveSpam(id)}
                    >
                      {isLoading
                        ? 'Processing...'
                        : 'Approve spam check'}
                    </button>

                    <button
                      className="button"
                      disabled={isLoading}
                      onClick={() => rejectSpam(id)}
                    >
                      {isLoading
                        ? 'Processing...'
                        : 'Reject as spam'}
                    </button>
                  </div>
                </div>

                <span className="admin-review-date">
                  {article.category}
                </span>
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}