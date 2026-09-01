import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { articleService } from '../../services/articleService'

const initial = { title: '', excerpt: '', body: '', category: '', tags: '', coverImage: '' }
export default function CreateArticle() {
  const [form, setForm] = useState(initial)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const navigate = useNavigate()
  const update = (event) => setForm({ ...form, [event.target.name]: event.target.value })
  async function save(submit) {
    try {
      setSaving(true); setError('')
      const article = await articleService.createArticle({ ...form, tags: form.tags.split(',').map(tag => tag.trim()).filter(Boolean), submit })
      navigate(`/author/article/${article.id}`)
    } catch (err) { setError(err.message) } finally { setSaving(false) }
  }
  return <section className="browse-page-wrapper">
    <span className="eyebrow">Article editor</span><h1 className="browse-page-title">Write a new story.</h1>
    <form className="auth-page" onSubmit={(event) => { event.preventDefault(); save(true) }}>
      <label>Title<input name="title" value={form.title} onChange={update} required /></label>
      <label>Summary<input name="excerpt" value={form.excerpt} onChange={update} required /></label>
      <label>Category<input name="category" value={form.category} onChange={update} required placeholder="Technology, Design, Science…" /></label>
      <label>Tags (comma separated)<input name="tags" value={form.tags} onChange={update} /></label>
      <label>Cover image URL (optional)<input name="coverImage" type="url" value={form.coverImage} onChange={update} /></label>
      <label>Article body<textarea name="body" rows="14" value={form.body} onChange={update} required /></label>
      {error && <p className="error" role="alert">{error}</p>}
      <div style={{ display: 'flex', gap: '1rem' }}><button className="submit-button" disabled={saving}>{saving ? 'Saving…' : 'Submit for review'}</button><button className="button" type="button" disabled={saving} onClick={() => save(false)}>Save draft</button></div>
    </form>
  </section>
}
