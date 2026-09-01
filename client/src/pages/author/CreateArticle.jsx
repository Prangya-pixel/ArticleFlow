import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { articleService } from '../../services/articleService'
import { quizService } from '../../services/quizService'
import Loading from '../../components/common/Loading'

const initial = { title: '', excerpt: '', body: '', category: '', tags: '', coverImage: '' }
export default function CreateArticle() {
  const { id } = useParams()
  const isEditing = Boolean(id)
  const [form, setForm] = useState(initial)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(isEditing)
  const navigate = useNavigate()
  const update = (event) => setForm({ ...form, [event.target.name]: event.target.value })
  useEffect(() => {
    if (!isEditing) return
    let active = true
    Promise.all([articleService.getArticleById(id), quizService.getQuizByArticleId(id)]).then(([article, quiz]) => {
      if (!active) return
      setForm({ title: article.title, excerpt: article.excerpt, body: article.body, category: article.category, tags: (article.tags || []).join(', '), coverImage: article.coverImage || '' })
      setQuestions(quiz?.questions || [])
    }).catch(err => active && setError(err.message)).finally(() => active && setLoading(false))
    return () => { active = false }
  }, [id, isEditing])
  async function save(submit) {
    try {
      setSaving(true); setError('')
      const payload = { ...form, tags: form.tags.split(',').map(tag => tag.trim()).filter(Boolean), questions, submit: isEditing ? true : submit }
      const article = isEditing ? await articleService.updateArticle(id, payload) : await articleService.createArticle(payload)
      navigate(`/author/article/${article.id}`)
    } catch (err) { setError(err.message) } finally { setSaving(false) }
  }
  function addQuestion() { setQuestions(current => [...current, { id: crypto.randomUUID(), text: '', options: ['', '', '', ''], correctAnswerIndex: 0, explanation: '' }]) }
  function updateQuestion(index, field, value) { setQuestions(current => current.map((question, questionIndex) => questionIndex === index ? { ...question, [field]: value } : question)) }
  function updateOption(questionIndex, optionIndex, value) { setQuestions(current => current.map((question, index) => index === questionIndex ? { ...question, options: question.options.map((option, itemIndex) => itemIndex === optionIndex ? value : option) } : question)) }
  function removeQuestion(index) { setQuestions(current => current.filter((_, questionIndex) => questionIndex !== index)) }
  const wordCount = form.body.trim() ? form.body.trim().split(/\s+/).length : 0
  const readMinutes = Math.max(1, Math.ceil(wordCount / 200))
  if (loading) return <Loading />
  return <section className="editor-page">
    <header className="editor-hero"><div><span className="eyebrow">Author studio · {isEditing ? 'edit article' : 'new article'}</span><h1>{isEditing ? 'Refine your story.' : 'Tell a story worth sharing.'}</h1><p>{isEditing ? 'Your updates will be sent to the admin team for review before the article is published again.' : 'Write your article, add the details that help readers discover it, then save a draft or send it to the review team.'}</p></div><div className="editor-status"><span>●</span> {wordCount ? 'Ready to save' : 'Unsaved draft'}</div></header>
    <form className="editor-form" onSubmit={(event) => { event.preventDefault(); save(true) }}>
      <main className="editor-main"><section className="editor-card editor-writing-card"><div className="editor-card-heading"><div><span className="eyebrow">The story</span><h2>Start with the essentials.</h2></div><span className="editor-step">01</span></div><label className="editor-title-field">Article title<input name="title" value={form.title} onChange={update} required placeholder="Give your story a memorable title" /></label><label>Short summary<span>Shown when readers browse the collection.</span><textarea name="excerpt" rows="3" value={form.excerpt} onChange={update} required placeholder="Describe the heart of your article in a sentence or two." /></label><label className="editor-body-field">Article body<span>Use paragraphs to make the article easy to read.</span><textarea name="body" rows="18" value={form.body} onChange={update} required placeholder="Start writing your story…" /></label><div className="editor-writing-stats"><span>{wordCount.toLocaleString()} words</span><span>~ {readMinutes} min read</span><span>{questions.length} quiz question{questions.length === 1 ? '' : 's'}</span></div></section>
      <section className="editor-card"><div className="editor-card-heading"><div><span className="eyebrow">Reader discovery</span><h2>Help readers find it.</h2></div><span className="editor-step">02</span></div><div className="editor-two-columns"><label>Category<input name="category" value={form.category} onChange={update} required placeholder="Technology, Design, Science…" /></label><label>Tags<span>Separate tags with commas.</span><input name="tags" value={form.tags} onChange={update} placeholder="research, writing, productivity" /></label></div><label>Cover image URL <span>Optional—use a direct image link for the article card.</span><input name="coverImage" type="url" value={form.coverImage} onChange={update} placeholder="https://example.com/cover.jpg" /></label>{form.coverImage && <div className="editor-cover-preview"><img src={form.coverImage} alt="Article cover preview" onError={(event) => { event.currentTarget.style.display = 'none' }} /><span>Cover preview</span></div>}</section>
      <section className="editor-card quiz-editor"><div className="quiz-editor-heading"><div><span className="eyebrow">Optional quiz</span><h2>Make it interactive.</h2><p>Add a quick multiple-choice quiz for readers to take after they finish the article.</p></div><button type="button" className="editor-secondary-button" onClick={addQuestion}>+ Add question</button></div>{questions.length === 0 && <div className="editor-quiz-empty"><span>✦</span><div><strong>No quiz questions yet</strong><p>Questions are optional, but they are a great way to help readers check their understanding.</p></div></div>}{questions.map((question, questionIndex) => <fieldset className="quiz-question-editor" key={question.id}><legend>Question {questionIndex + 1}</legend><label>Question<input value={question.text} onChange={(event) => updateQuestion(questionIndex, 'text', event.target.value)} required placeholder="What should readers know?" /></label><div className="quiz-options">{question.options.map((option, optionIndex) => <label key={optionIndex}>Option {optionIndex + 1}<input value={option} onChange={(event) => updateOption(questionIndex, optionIndex, event.target.value)} required placeholder={`Answer ${optionIndex + 1}`} /><span className="answer-choice"><input type="radio" name={`correct-${question.id}`} checked={question.correctAnswerIndex === optionIndex} onChange={() => updateQuestion(questionIndex, 'correctAnswerIndex', optionIndex)} /> Correct answer</span></label>)}</div><label>Explanation shown after the quiz<textarea rows="3" value={question.explanation} onChange={(event) => updateQuestion(questionIndex, 'explanation', event.target.value)} required placeholder="Explain why this is the right answer." /></label><button className="quiz-remove" type="button" onClick={() => removeQuestion(questionIndex)}>Remove question</button></fieldset>)}</section></main>
      <aside className="editor-sidebar"><div className="editor-card editor-publish-card"><span className="eyebrow">Ready to go?</span><h2>{isEditing ? 'Send your update for review.' : 'Choose what happens next.'}</h2><p>{isEditing ? 'Saving an edit sends this article to the admin team. It will return to readers after approval.' : 'Drafts stay private. Submitted articles are sent to an admin for review.'}</p>{error && <p className="error" role="alert">{error}</p>}<button className="editor-primary-button" disabled={saving}>{saving ? 'Saving…' : isEditing ? 'Save & send for review →' : 'Submit for review →'}</button>{!isEditing && <button className="editor-secondary-button editor-draft-button" type="button" disabled={saving} onClick={() => save(false)}>Save as draft</button>}</div><div className="editor-tips"><span className="eyebrow">Writing checklist</span><p>✓ A clear title</p><p>✓ A useful summary</p><p>✓ Category and tags</p><p>✓ Optional reader quiz</p></div></aside>
    </form>
  </section>
}
