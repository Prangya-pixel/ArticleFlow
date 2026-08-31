import { Link } from 'react-router-dom'

export default function ArticleCard({ article, scope }) {
  const { id, title, excerpt, category, author, readMinutes, views, coverImage, status } = article

  const getStatusClass = (status) => {
    switch (status) {
      case 'Published': return 'status-published';
      case 'Pending': return 'status-pending';
      case 'Draft': return 'status-draft';
      case 'Approved': return 'status-approved';
      case 'Rejected': return 'status-rejected';
      case 'Changes Requested': return 'status-changes';
      default: return '';
    }
  }

  return (
    <Link to={`/${scope}/article/${id}`} className="article-card">
      <div className="card-image-wrapper">
        <img src={coverImage} alt={title} className="card-image" loading="lazy" />
      </div>
      <div className="card-content">
        <div className="card-badges">
          <span className="category-badge">{category}</span>
          {scope === 'admin' && (
            <span className={`status-badge ${getStatusClass(status)}`}>
              {status}
            </span>
          )}
        </div>
        <h3 className="card-title">{title}</h3>
        <p className="card-excerpt">{excerpt}</p>
        <div className="card-byline">
          <span className="card-author">{author}</span>
          <span className="byline-dot">&middot;</span>
          <span>{readMinutes} min read</span>
          <span className="byline-dot">&middot;</span>
          <span className="card-views">👁 {views} views</span>
        </div>
      </div>
    </Link>
  )
}
