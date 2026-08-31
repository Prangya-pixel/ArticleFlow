import { useState, useEffect } from 'react'
import ProgressBar from './ProgressBar'
import QuestionCard from './QuestionCard'
import { quizService } from '../../services/quizService'
import { ResultsScreen } from '../quiz-results'
import Loading from '../../components/common/Loading'

export default function QuizPlayer({ articleId }) {
  const [quiz, setQuiz] = useState(null)
  const [loading, setLoading] = useState(true)
  const [currentIdx, setCurrentIdx] = useState(0)
  const [answers, setAnswers] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [results, setResults] = useState(null)

  useEffect(() => {
    let active = true
    setLoading(true)
    quizService.getQuizByArticleId(articleId)
      .then((data) => {
        if (active) {
          setQuiz(data)
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
  }, [articleId])

  const handleSelectAnswer = (optionIndex) => {
    const activeQuestion = quiz.questions[currentIdx]
    setAnswers((prev) => ({
      ...prev,
      [activeQuestion.id]: optionIndex
    }))
  }

  const handleNext = () => {
    if (currentIdx < quiz.questions.length - 1) {
      setCurrentIdx((prev) => prev + 1)
    }
  }

  const handlePrev = () => {
    if (currentIdx > 0) {
      setCurrentIdx((prev) => prev - 1)
    }
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const data = await quizService.submitAttempt(articleId, answers)
      setResults(data)
    } catch (err) {
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleRetake = () => {
    setAnswers({})
    setCurrentIdx(0)
    setResults(null)
  }

  if (loading) return <Loading />
  if (!quiz) return null

  if (results) {
    return <ResultsScreen results={results} onRetake={handleRetake} />
  }

  const activeQuestion = quiz.questions[currentIdx]
  const selectedAnswerIndex = answers[activeQuestion.id] ?? null
  const isLastQuestion = currentIdx === quiz.questions.length - 1
  const hasSelected = selectedAnswerIndex !== null

  return (
    <div className="quiz-player-container">
      <div className="quiz-header">
        <span className="eyebrow">Interactive Quiz</span>
        <h2 className="quiz-title">Test Your Understanding</h2>
      </div>

      <ProgressBar current={currentIdx + 1} total={quiz.questions.length} />

      <div className="quiz-body">
        <QuestionCard
          question={activeQuestion}
          selectedAnswerIndex={selectedAnswerIndex}
          onSelectAnswer={handleSelectAnswer}
        />
      </div>

      <div className="quiz-actions">
        <button
          type="button"
          className="quiz-action-button secondary"
          onClick={handlePrev}
          disabled={currentIdx === 0}
        >
          Previous
        </button>

        {isLastQuestion ? (
          <button
            type="button"
            className="quiz-action-button primary"
            onClick={handleSubmit}
            disabled={!hasSelected || submitting}
          >
            {submitting ? 'Submitting...' : 'Submit Quiz'}
          </button>
        ) : (
          <button
            type="button"
            className="quiz-action-button primary"
            onClick={handleNext}
            disabled={!hasSelected}
          >
            Next Question
          </button>
        )}
      </div>
    </div>
  )
}
