export default function QuestionReview({ question }) {
  const { text, options, selectedAnswerIndex, correctAnswerIndex, isCorrect, explanation } = question

  return (
    <div className={`question-review-card ${isCorrect ? 'correct' : 'incorrect'}`}>
      <div className="review-question-header">
        <span className={`review-badge ${isCorrect ? 'correct' : 'incorrect'}`}>
          {isCorrect ? '✓ Correct' : '✗ Incorrect'}
        </span>
        <h4 className="review-question-text">{text}</h4>
      </div>

      <div className="review-options-list">
        {options.map((option, idx) => {
          const isSelected = selectedAnswerIndex === idx
          const isCorrectAnswer = correctAnswerIndex === idx
          let optionClass = ''

          if (isCorrectAnswer) {
            optionClass = 'correct-choice'
          } else if (isSelected && !isCorrect) {
            optionClass = 'incorrect-choice'
          }

          return (
            <div key={idx} className={`review-option-item ${optionClass}`}>
              <span className="option-marker">
                {String.fromCharCode(65 + idx)}
              </span>
              <span className="option-text">{option}</span>
              {isCorrectAnswer && <span className="review-choice-label">(Correct)</span>}
              {isSelected && !isCorrectAnswer && <span className="review-choice-label">(Your Choice)</span>}
            </div>
          )
        })}
      </div>

      <div className="review-explanation">
        <strong>Explanation:</strong>
        <p>{explanation}</p>
      </div>
    </div>
  )
}
