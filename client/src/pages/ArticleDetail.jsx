import { useState, useEffect } from 'react'
import { useParams, Link, useLocation } from 'react-router-dom'
import { articleService } from '../services/articleService'
import { quizService } from '../services/quizService'
import { QuizPlayer } from '../modules/quiz'
import Loading from '../components/common/Loading'

export default function ArticleDetail() {
  const { id } = useParams()
  const location = useLocation()
  const [article, setArticle] = useState(null)
  const [hasQuiz, setHasQuiz] = useState(false)
  const [loading, setLoading] = useState(true)

  const rolePrefix = location.pathname.startsWith('/admin')
    ? 'admin'
    : location.pathname.startsWith('/author')
    ? 'author'
    : 'reader'

  useEffect(() => {
    let active = true
    setLoading(true)

    Promise.all([
      articleService.getArticleById(id),
      quizService.getQuizByArticleId(id)
    ])
      .then(([articleData, quizData]) => {
        if (active) {
          setArticle(articleData)
          setHasQuiz(!!quizData)
          setLoading(false)
        }
      })
      .catch((err) => {
        console.error(err)
        if (active) {
          setLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [id])

  if (loading) return <Loading />

  if (!article) {
    return (
      <div className="centered-page">
        <h1>Article Not Found</h1>
        <p>The article you are looking for does not exist or has been removed.</p>
        <Link to={`/${rolePrefix}/browse`} className="button">
          Back to Browse
        </Link>
      </div>
    )
  }

  const { title, excerpt, body, category, author, readMinutes, views, coverImage, publishedAt } = article

  return (
    <article className="article-detail-container">
      <div className="article-detail-back">
        <Link to={`/${rolePrefix}/browse`} className="back-link">
          &larr; Back to Browse
        </Link>
      </div>

      <header className="article-detail-header">
        <span className="eyebrow category-tag">{category}</span>
        <h1 className="article-detail-title">{title}</h1>
        <p className="article-detail-excerpt">{excerpt}</p>

        <div className="article-detail-meta">
          <span className="meta-author">By {author}</span>
          <span className="meta-dot">&middot;</span>
          <span className="meta-date">{publishedAt || 'Unpublished'}</span>
          <span className="meta-dot">&middot;</span>
          <span className="meta-read-time">{readMinutes} min read</span>
          <span className="meta-dot">&middot;</span>
          <span className="meta-views">👁 {views} views</span>
        </div>
      </header>

      {coverImage && (
        <div className="article-detail-cover-wrapper">
          <img src={coverImage} alt={title} className="article-detail-cover" />
        </div>
      )}

      <section className="article-detail-body">
        {body.split('\n\n').map((para, idx) => (
          <p key={idx}>{para}</p>
        ))}
      </section>

      {hasQuiz && (
        <section className="article-detail-quiz-section">
          <div className="quiz-section-divider"></div>
          <QuizPlayer articleId={id} />
        </section>
      )}
    </article>
  )
}
