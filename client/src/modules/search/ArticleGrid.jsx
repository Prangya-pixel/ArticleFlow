import ArticleCard from './ArticleCard'

export default function ArticleGrid({ articles, scope }) {
  const countLabel = articles.length === 1 ? '1 result' : `${articles.length} results`

  return (
    <div className="article-grid-container">
      <div className="section-header">
        <h2 className="section-title">
          {scope === 'admin' ? 'All Submissions' : 'Recent Articles'}
        </h2>
        <div className="header-line"></div>
        <span className="results-count eyebrow">{countLabel}</span>
      </div>

      {articles.length === 0 ? (
        <div className="empty-state">
          <p>No results found matching your search or category filter. Try widening your search term.</p>
        </div>
      ) : (
        <div className="article-grid">
          {articles.map((article) => (
            <ArticleCard key={article.id} article={article} scope={scope} />
          ))}
        </div>
      )}
    </div>
  )
}
