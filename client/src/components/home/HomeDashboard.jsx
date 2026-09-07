import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { articleService } from '../../services/articleService'
import { verificationService } from '../../services/verificationService'
import ArticleGrid from '../../modules/search/ArticleGrid'
import Loading from '../common/Loading'

const copy = {
  reader: { eyebrow: 'Reading room', title: 'Find your next good read.', description: 'Explore recently published stories and test your knowledge with interactive quizzes.' },
  author: { eyebrow: 'Author studio', title: 'Welcome back.', description: 'Keep your drafts moving and see how your stories are performing.' },
  admin: { eyebrow: 'Admin console', title: 'Keep publishing moving.', description: 'Review pending submissions and monitor the content library.' },
}

export default function HomeDashboard({ role }) {
  const { user } = useAuth(); const [articles, setArticles] = useState([]); const [pending, setPending] = useState([]); const [error, setError] = useState(''); const [loading, setLoading] = useState(true)
  useEffect(() => { let active = true; const requests = [articleService.listArticles()]; if (role === 'admin') requests.push(verificationService.getPending()); Promise.all(requests).then(([items, queue = []]) => { if (active) { setArticles(items); setPending(queue) } }).catch(err => active && setError(err.message)).finally(() => active && setLoading(false)); return () => { active = false } }, [role])
  const details = copy[role]; const published = articles.filter(article => article.status === 'Published'); const drafts = articles.filter(article => article.status === 'Draft' || article.status === 'Changes Requested')
  return <section className="home-dashboard"><span className="eyebrow">{details.eyebrow}</span><h1>{details.title}</h1><p className="lead">{details.description}</p>{error && <p className="error">{error}</p>}
    <div className="dashboard-actions">{role === 'author' && <Link className="button" to="/author/create">Write an article</Link>}{role === 'admin' && <Link className="button" to="/admin/dashboard">Open review queue</Link>}{role === 'reader' && <Link className="button" to="/reader/browse">Browse all stories</Link>}</div>
    {loading ? <Loading /> : <><div className="stats-grid">{role === 'reader' && <Stat label="Stories available" value={articles.length} />}{role === 'author' && <><Stat label="Your articles" value={articles.length} /><Stat label="Published" value={published.length} /><Stat label="Needs attention" value={drafts.length} /></>}{role === 'admin' && <><Stat label="Awaiting review" value={pending.length} /><Stat label="Published" value={published.length} /><Stat label="Content items" value={articles.length} /></>}</div>{role === 'admin' && pending.length > 0 && <section className="dashboard-section"><div className="dashboard-section-heading"><h2>Needs review</h2><Link to="/admin/dashboard">View queue</Link></div><div className="review-list">{pending.slice(0, 4).map(article => <Link key={article.id || article._id} to={`/admin/article/${article.id || article._id}`}><strong>{article.title}</strong><span>{article.category} · {article.authorName || article.author}</span></Link>)}</div></section>}<section className="dashboard-section"><div className="dashboard-section-heading"><h2>{role === 'author' ? 'Your recent work' : 'Latest stories'}</h2><Link to={`/${role}/browse`}>View all</Link></div><ArticleGrid articles={articles.slice(0, 6)} scope={role} /></section></>}</section>
}
function Stat({ label, value }) { return <div className="stat-card"><strong>{value}</strong><span>{label}</span></div> }
