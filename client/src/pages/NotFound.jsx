import { Link } from 'react-router-dom'

export default function NotFound() {
  return <div className="centered-page"><p className="eyebrow">404</p><h1>Page not found</h1><p>That destination does not exist in ArticleFlow yet.</p><Link className="button" to="/login">Return to role selection</Link></div>
}
