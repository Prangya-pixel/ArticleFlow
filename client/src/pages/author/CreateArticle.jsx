import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { articleService } from '../../services/articleService'
import { quizService } from '../../services/quizService'
import Loading from '../../components/common/Loading'

const initial = {
  title: '',
  excerpt: '',
  body: '',
  category: '',
  tags: '',
  coverImage: '',
}

export default function CreateArticle() {
  const { id } = useParams()
  const isEditing = Boolean(id)

  const [form, setForm] = useState(initial)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(isEditing)

  const [analyzing, setAnalyzing] = useState(false)
  const [analysisError, setAnalysisError] = useState('')
  const [analysis, setAnalysis] = useState(null)

  const navigate = useNavigate()

  const update = (event) => {
    setForm({
      ...form,
      [event.target.name]: event.target.value,
    })

    // The previous analysis belongs to the previous content.
    // Clear it when the author changes the article.
    if (analysis) {
      setAnalysis(null)
      setAnalysisError('')
    }
  }

  useEffect(() => {
    if (!isEditing) return

    let active = true

    Promise.all([
      articleService.getArticleById(id),
      quizService.getQuizByArticleId(id),
    ])
      .then(([article, quiz]) => {
        if (!active) return

        setForm({
          title: article.title,
          excerpt: article.excerpt,
          body: article.body,
          category: article.category,
          tags: (article.tags || []).join(', '),
          coverImage: article.coverImage || '',
        })

        setQuestions(quiz?.questions || [])
      })
      .catch((err) => {
        if (active) {
          setError(err.message)
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [id, isEditing])

  async function analyzeContent() {
    setAnalysisError('')
    setAnalysis(null)

    if (!form.title.trim()) {
      setAnalysisError('Please enter an article title before analyzing.')
      return
    }

    if (!form.body.trim()) {
      setAnalysisError('Please write some article content before analyzing.')
      return
    }

    try {
      setAnalyzing(true)

      const result = await articleService.analyzeArticleContent({
        title: form.title.trim(),
        excerpt: form.excerpt.trim(),
        body: form.body.trim(),
        articleId: isEditing ? id : undefined,
      })

      setAnalysis(result)
    } catch (err) {
      console.error('Content analysis failed:', err)

      setAnalysisError(
        err.message || 'Unable to analyze the article right now.'
      )
    } finally {
      setAnalyzing(false)
    }
  }

  async function save(submit) {
    try {
      setSaving(true)
      setError('')

      const payload = {
        ...form,
        tags: form.tags
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean),
        questions,
        submit: isEditing ? true : submit,
      }

      const article = isEditing
        ? await articleService.updateArticle(id, payload)
        : await articleService.createArticle(payload)

      navigate(`/author/article/${article.id}`)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  function addQuestion() {
    setQuestions((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        text: '',
        options: ['', '', '', ''],
        correctAnswerIndex: 0,
        explanation: '',
      },
    ])
  }

  function updateQuestion(index, field, value) {
    setQuestions((current) =>
      current.map((question, questionIndex) =>
        questionIndex === index
          ? {
              ...question,
              [field]: value,
            }
          : question
      )
    )
  }

  function updateOption(questionIndex, optionIndex, value) {
    setQuestions((current) =>
      current.map((question, index) =>
        index === questionIndex
          ? {
              ...question,
              options: question.options.map((option, itemIndex) =>
                itemIndex === optionIndex ? value : option
              ),
            }
          : question
      )
    )
  }

  function removeQuestion(index) {
    setQuestions((current) =>
      current.filter((_, questionIndex) => questionIndex !== index)
    )
  }

  const wordCount = form.body.trim()
    ? form.body.trim().split(/\s+/).length
    : 0

  const readMinutes = Math.max(1, Math.ceil(wordCount / 200))

  const quality = analysis?.quality
  const duplicate = analysis?.duplicate

  const qualityScore = Number(quality?.qualityScore ?? 0)
  const grammarScore = Number(quality?.grammarScore ?? 0)
  const readabilityScore = Number(quality?.readabilityScore ?? 0)
  const structureScore = Number(quality?.structureScore ?? 0)

  const duplicateSimilarity = Number(
    duplicate?.topSimilarity ?? duplicate?.similarity ?? 0
  )

  if (loading) return <Loading />

  return (
    <section className="editor-page">
      <header className="editor-hero">
        <div>
          <span className="eyebrow">
            Author studio · {isEditing ? 'edit article' : 'new article'}
          </span>

          <h1>
            {isEditing
              ? 'Refine your story.'
              : 'Tell a story worth sharing.'}
          </h1>

          <p>
            {isEditing
              ? 'Your updates will be sent to the admin team for review before the article is published again.'
              : 'Write your article, add the details that help readers discover it, then save a draft or send it to the review team.'}
          </p>
        </div>

        <div className="editor-status">
          <span>●</span>{' '}
          {wordCount ? 'Ready to save' : 'Unsaved draft'}
        </div>
      </header>

      <form
        className="editor-form"
        onSubmit={(event) => {
          event.preventDefault()
          save(true)
        }}
      >
        <main className="editor-main">
          <section className="editor-card editor-writing-card">
            <div className="editor-card-heading">
              <div>
                <span className="eyebrow">The story</span>
                <h2>Start with the essentials.</h2>
              </div>

              <span className="editor-step">01</span>
            </div>

            <label className="editor-title-field">
              Article title

              <input
                name="title"
                value={form.title}
                onChange={update}
                required
                placeholder="Give your story a memorable title"
              />
            </label>

            <label>
              Short summary

              <span>
                Shown when readers browse the collection.
              </span>

              <textarea
                name="excerpt"
                rows="3"
                value={form.excerpt}
                onChange={update}
                required
                placeholder="Describe the heart of your article in a sentence or two."
              />
            </label>

            <label className="editor-body-field">
              Article body

              <span>
                Use paragraphs to make the article easy to read.
              </span>

              <textarea
                name="body"
                rows="18"
                value={form.body}
                onChange={update}
                required
                placeholder="Start writing your story…"
              />
            </label>

            <div className="editor-writing-stats">
              <span>{wordCount.toLocaleString()} words</span>
              <span>~ {readMinutes} min read</span>
              <span>
                {questions.length} quiz question
                {questions.length === 1 ? '' : 's'}
              </span>
            </div>
          </section>

          {/* AI CONTENT ANALYSIS */}
          <section className="editor-card">
            <div className="editor-card-heading">
              <div>
                <span className="eyebrow">AI writing assistant</span>
                <h2>Check your article.</h2>

                <p>
                  Analyze writing quality and check whether your article is
                  similar to existing published content before submitting it.
                </p>
              </div>

              <span className="editor-step">AI</span>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px',
                flexWrap: 'wrap',
              }}
            >
              <div>
                <strong>Content Quality + Duplicate Detection</strong>

                <p
                  style={{
                    marginTop: '6px',
                    marginBottom: 0,
                  }}
                >
                  Run the analysis after you've written or substantially
                  changed your article.
                </p>
              </div>

              <button
                type="button"
                className="editor-secondary-button"
                onClick={analyzeContent}
                disabled={analyzing || saving}
              >
                {analyzing
                  ? 'Analyzing…'
                  : '✦ Analyze Content'}
              </button>
            </div>

            {analysisError && (
              <p
                className="error"
                role="alert"
                style={{ marginTop: '16px' }}
              >
                {analysisError}
              </p>
            )}

            {analysis && (
              <div
                style={{
                  display: 'grid',
                  gap: '18px',
                  marginTop: '24px',
                }}
              >
                {/* QUALITY RESULTS */}
                {quality && (
                  <div
                    style={{
                      border: '1px solid var(--border-color, rgba(148, 163, 184, 0.2))',
                      borderRadius: '16px',
                      padding: '20px',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '12px',
                        flexWrap: 'wrap',
                      }}
                    >
                      <div>
                        <span className="eyebrow">
                          Content quality
                        </span>

                        <h3
                          style={{
                            marginTop: '5px',
                          }}
                        >
                          AI writing assessment
                        </h3>
                      </div>

                      <div
                        style={{
                          fontSize: '28px',
                          fontWeight: 700,
                        }}
                      >
                        {qualityScore}/100
                      </div>
                    </div>

                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns:
                          'repeat(auto-fit, minmax(130px, 1fr))',
                        gap: '12px',
                        marginTop: '18px',
                      }}
                    >
                      <div className="editor-writing-stats">
                        <strong>{grammarScore}</strong>
                        <span>Grammar</span>
                      </div>

                      <div className="editor-writing-stats">
                        <strong>{readabilityScore}</strong>
                        <span>Readability</span>
                      </div>

                      <div className="editor-writing-stats">
                        <strong>{structureScore}</strong>
                        <span>Structure</span>
                      </div>
                    </div>

                    {Array.isArray(quality.suggestions) &&
                      quality.suggestions.length > 0 && (
                        <div style={{ marginTop: '20px' }}>
                          <strong>Suggestions</strong>

                          <ul
                            style={{
                              marginTop: '10px',
                              paddingLeft: '20px',
                            }}
                          >
                            {quality.suggestions.map(
                              (suggestion, index) => (
                                <li key={index}>
                                  {suggestion}
                                </li>
                              )
                            )}
                          </ul>
                        </div>
                      )}
                  </div>
                )}

                {/* DUPLICATE RESULTS */}
                {duplicate && (
                  <div
                    style={{
                      border: '1px solid var(--border-color, rgba(148, 163, 184, 0.2))',
                      borderRadius: '16px',
                      padding: '20px',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '12px',
                        flexWrap: 'wrap',
                      }}
                    >
                      <div>
                        <span className="eyebrow">
                          Originality check
                        </span>

                        <h3
                          style={{
                            marginTop: '5px',
                          }}
                        >
                          Duplicate detection
                        </h3>
                      </div>

                      <strong>
                        {duplicateSimilarity.toFixed(1)}% similarity
                      </strong>
                    </div>

                    {duplicate.duplicateDetected ? (
                      <p
                        style={{
                          marginTop: '14px',
                        }}
                      >
                        ⚠ A highly similar published article was detected.
                        Review the matching articles below before submitting.
                      </p>
                    ) : duplicateSimilarity >= 70 ? (
                      <p
                        style={{
                          marginTop: '14px',
                        }}
                      >
                        This article has some similarity with existing
                        published content. Review the matches below.
                      </p>
                    ) : (
                      <p
                        style={{
                          marginTop: '14px',
                        }}
                      >
                        ✓ No strong duplicate match was detected.
                      </p>
                    )}

                    {Array.isArray(duplicate.matches) &&
                      duplicate.matches.length > 0 && (
                        <div
                          style={{
                            display: 'grid',
                            gap: '10px',
                            marginTop: '18px',
                          }}
                        >
                          {duplicate.matches.map(
                            (match, index) => (
                              <div
                                key={
                                  match.id ||
                                  match._id ||
                                  index
                                }
                                style={{
                                  padding: '14px',
                                  borderRadius: '12px',
                                  border:
                                    '1px solid var(--border-color, rgba(148, 163, 184, 0.15))',
                                }}
                              >
                                <div
                                  style={{
                                    display: 'flex',
                                    justifyContent:
                                      'space-between',
                                    gap: '12px',
                                  }}
                                >
                                  <strong>
                                    {match.title ||
                                      'Untitled article'}
                                  </strong>

                                  <span>
                                    {Number(
                                      match.similarity || 0
                                    ).toFixed(1)}
                                    %
                                  </span>
                                </div>

                                {match.excerpt && (
                                  <p
                                    style={{
                                      marginTop: '6px',
                                    }}
                                  >
                                    {match.excerpt}
                                  </p>
                                )}
                              </div>
                            )
                          )}
                        </div>
                      )}
                  </div>
                )}
              </div>
            )}
          </section>

          <section className="editor-card">
            <div className="editor-card-heading">
              <div>
                <span className="eyebrow">
                  Reader discovery
                </span>

                <h2>Help readers find it.</h2>
              </div>

              <span className="editor-step">02</span>
            </div>

            <div className="editor-two-columns">
              <label>
                Category

                <input
                  name="category"
                  value={form.category}
                  onChange={update}
                  required
                  placeholder="Technology, Design, Science…"
                />
              </label>

              <label>
                Tags

                <span>Separate tags with commas.</span>

                <input
                  name="tags"
                  value={form.tags}
                  onChange={update}
                  placeholder="research, writing, productivity"
                />
              </label>
            </div>

            <label>
              Cover image URL

              <span>
                Optional—use a direct image link for the article card.
              </span>

              <input
                name="coverImage"
                type="url"
                value={form.coverImage}
                onChange={update}
                placeholder="https://example.com/cover.jpg"
              />
            </label>

            {form.coverImage && (
              <div className="editor-cover-preview">
                <img
                  src={form.coverImage}
                  alt="Article cover preview"
                  onError={(event) => {
                    event.currentTarget.style.display = 'none'
                  }}
                />

                <span>Cover preview</span>
              </div>
            )}
          </section>

          <section className="editor-card quiz-editor">
            <div className="quiz-editor-heading">
              <div>
                <span className="eyebrow">
                  Optional quiz
                </span>

                <h2>Make it interactive.</h2>

                <p>
                  Add a quick multiple-choice quiz for readers to take
                  after they finish the article.
                </p>
              </div>

              <button
                type="button"
                className="editor-secondary-button"
                onClick={addQuestion}
              >
                + Add question
              </button>
            </div>

            {questions.length === 0 && (
              <div className="editor-quiz-empty">
                <span>✦</span>

                <div>
                  <strong>No quiz questions yet</strong>

                  <p>
                    Questions are optional, but they are a great way to
                    help readers check their understanding.
                  </p>
                </div>
              </div>
            )}

            {questions.map((question, questionIndex) => (
              <fieldset
                className="quiz-question-editor"
                key={question.id}
              >
                <legend>
                  Question {questionIndex + 1}
                </legend>

                <label>
                  Question

                  <input
                    value={question.text}
                    onChange={(event) =>
                      updateQuestion(
                        questionIndex,
                        'text',
                        event.target.value
                      )
                    }
                    required
                    placeholder="What should readers know?"
                  />
                </label>

                <div className="quiz-options">
                  {question.options.map(
                    (option, optionIndex) => (
                      <label key={optionIndex}>
                        Option {optionIndex + 1}

                        <input
                          value={option}
                          onChange={(event) =>
                            updateOption(
                              questionIndex,
                              optionIndex,
                              event.target.value
                            )
                          }
                          required
                          placeholder={`Answer ${
                            optionIndex + 1
                          }`}
                        />

                        <span className="answer-choice">
                          <input
                            type="radio"
                            name={`correct-${question.id}`}
                            checked={
                              question.correctAnswerIndex ===
                              optionIndex
                            }
                            onChange={() =>
                              updateQuestion(
                                questionIndex,
                                'correctAnswerIndex',
                                optionIndex
                              )
                            }
                          />

                          Correct answer
                        </span>
                      </label>
                    )
                  )}
                </div>

                <label>
                  Explanation shown after the quiz

                  <textarea
                    rows="3"
                    value={question.explanation}
                    onChange={(event) =>
                      updateQuestion(
                        questionIndex,
                        'explanation',
                        event.target.value
                      )
                    }
                    required
                    placeholder="Explain why this is the right answer."
                  />
                </label>

                <button
                  className="quiz-remove"
                  type="button"
                  onClick={() =>
                    removeQuestion(questionIndex)
                  }
                >
                  Remove question
                </button>
              </fieldset>
            ))}
          </section>
        </main>

        <aside className="editor-sidebar">
          <div className="editor-card editor-publish-card">
            <span className="eyebrow">
              Ready to go?
            </span>

            <h2>
              {isEditing
                ? 'Send your update for review.'
                : 'Choose what happens next.'}
            </h2>

            <p>
              {isEditing
                ? 'Saving an edit sends this article to the admin team. It will return to readers after approval.'
                : 'Drafts stay private. Submitted articles are sent to an admin for review.'}
            </p>

            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}

            <button
              className="editor-primary-button"
              disabled={saving}
            >
              {saving
                ? 'Saving…'
                : isEditing
                  ? 'Save & send for review →'
                  : 'Submit for review →'}
            </button>

            {!isEditing && (
              <button
                className="editor-secondary-button editor-draft-button"
                type="button"
                disabled={saving}
                onClick={() => save(false)}
              >
                Save as draft
              </button>
            )}
          </div>

          <div className="editor-tips">
            <span className="eyebrow">
              Writing checklist
            </span>

            <p>✓ A clear title</p>
            <p>✓ A useful summary</p>
            <p>✓ Category and tags</p>
            <p>✓ Optional reader quiz</p>
            <p>✓ Run the AI content check</p>
          </div>
        </aside>
      </form>
    </section>
  )
}