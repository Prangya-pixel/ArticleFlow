import QuestionReview from './QuestionReview'

export default function ResultsScreen({ results, onRetake }) {
  const { score, totalQuestions, percentage, review } = results

  return (
    <div className="results-screen-container">
      <div className="results-summary-card">
        <span className="eyebrow">Quiz Completed</span>
        <h2 className="results-title">Your Results</h2>

        <div className="results-score-display">
          <span className="score-num">{score}</span>
          <span className="score-divider">/</span>
          <span className="score-total">{totalQuestions}</span>
        </div>

        <div className="results-percentage-bar-container">
          <div className="results-percentage-label eyebrow">{percentage}% Accuracy</div>
          <div className="results-percentage-track">
            <div className="results-percentage-fill" style={{ width: `${percentage}%` }}></div>
          </div>
        </div>

        <button type="button" className="retake-button" onClick={onRetake}>
          Retake Quiz
        </button>
      </div>

      <div className="results-breakdown-container">
        <h3 className="breakdown-title">Question Breakdown</h3>
        <div className="breakdown-list">
          {review.map((q, idx) => (
            <QuestionReview key={q.questionId || idx} question={q} />
          ))}
        </div>
      </div>
    </div>
  )
}
