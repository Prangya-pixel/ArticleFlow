
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { articleService } from '../../services/articleService'

export default function SpamApproval() {
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionLoading, setActionLoading] = useState(null)

  const loadArticles = async () => {
    setLoading(true)
    setError('')

    try {
      const data = await articleService.getSpamArticles()

      // Backend returns { articles: [...] }
      setArticles(data.articles || [])
    } catch (err) {
      setError(err.message || 'Failed to load spam submissions.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadArticles()
  }, [])

  const reviewSpam = async (id, decision) => {
    setActionLoading(id)
    setError('')

    try {
      await articleService.reviewSpamArticle(id, decision)

      setArticles((items) =>
        items.filter((item) => String(item.id || item._id) !== String(id))
      )
    } catch (err) {
      setError(err.message || 'Failed to review article.')
    } finally {
      setActionLoading(null)
    }
  }

  const approveSpam = async (id) => {
    await reviewSpam(id, 'Approved')
  }

  const rejectSpam = async (id) => {
    await reviewSpam(id, 'Rejected')
  }

  return (
    <section className="browse-page-wrapper">
      <span className="eyebrow">Spam content approval</span>

      <div className="dashboard-section-heading">
        <div>
          <h1 className="browse-page-title">
            Spam review queue.
          </h1>

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
                        : 'Approve'}
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
