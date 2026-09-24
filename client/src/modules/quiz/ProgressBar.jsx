export default function ProgressBar({ current, total }) {
  const percentage = Math.round((current / total) * 100)

  return (
    <div className="quiz-progress-container">
      <div className="quiz-progress-header">
        <span className="quiz-progress-text eyebrow">
          Question {current} of {total}
        </span>
        <span className="quiz-progress-percentage eyebrow">{percentage}%</span>
      </div>
      <div className="quiz-progress-track">
        <div className="quiz-progress-fill" style={{ width: `${percentage}%` }}></div>
      </div>
    </div>
  )
}
