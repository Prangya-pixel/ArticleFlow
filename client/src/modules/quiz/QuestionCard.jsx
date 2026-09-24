export default function QuestionCard({ question, selectedAnswerIndex, onSelectAnswer }) {
  const { text, options } = question

  return (
    <div className="question-card">
      <h3 className="question-text">{text}</h3>
      <div className="options-list">
        {options.map((option, index) => {
          const isSelected = selectedAnswerIndex === index
          return (
            <button
              key={index}
              type="button"
              className={`option-button ${isSelected ? 'selected' : ''}`}
              onClick={() => onSelectAnswer(index)}
            >
              <span className="option-marker">
                {String.fromCharCode(65 + index)}
              </span>
              <span className="option-text">{option}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
