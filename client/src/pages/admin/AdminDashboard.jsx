import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { verificationService } from '../../services/verificationService'

export default function AdminDashboard() {
  const [articles, setArticles] = useState([]); const [error, setError] = useState(''); const [loading, setLoading] = useState(true)
  const load = () => { setLoading(true); verificationService.getPending().then(setArticles).catch(err => setError(err.message)).finally(() => setLoading(false)) }
  useEffect(load, [])
  async function act(id, action) { const adminNote = action === 'approve' ? '' : window.prompt(action === 'reject' ? 'Why is this being rejected?' : 'What changes are needed?'); if (action !== 'approve' && !adminNote?.trim()) return; try { await verificationService[action](id, adminNote); setArticles(items => items.filter(item => item.id !== id && item._id !== id)) } catch (err) { setError(err.message) } }
  return <section className="browse-page-wrapper"><span className="eyebrow">Admin verification</span><h1 className="browse-page-title">Review queue.</h1>{error && <p className="error">{error}</p>}{loading ? <p>Loading submissions…</p> : articles.length === 0 ? <p>No articles are waiting for review.</p> : <div className="article-grid">{articles.map(article => <article className="article-card" key={article.id || article._id}><div className="card-content"><span className="category-badge">{article.category}</span><h3 className="card-title">{article.title}</h3><p className="card-excerpt">{article.excerpt}</p><p className="card-byline">By {article.authorName || article.author}</p><div style={{display:'flex',gap:'.5rem', flexWrap:'wrap'}}><Link className="button" to={`/admin/article/${article.id || article._id}`}>Review article & quiz</Link><button className="button" onClick={() => act(article.id || article._id, 'approve')}>Approve & publish</button><button className="button" onClick={() => act(article.id || article._id, 'requestChanges')}>Request changes</button><button className="button" onClick={() => act(article.id || article._id, 'reject')}>Reject</button></div></div></article>)}</div>}</section>
}
