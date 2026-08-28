import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getArticleById } from "../services/articleAPI";
import "./Quiz.css";

function Quiz() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState("");

  // Store every answer
  const [answers, setAnswers] = useState([]);

  // Show result page
  const [quizFinished, setQuizFinished] = useState(false);

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        const data = await getArticleById(id);

        setArticle(data.article || data);
      } catch (error) {
        console.error("Failed to load quiz:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchArticle();
  }, [id]);

  // Loading
  if (loading) {
    return (
      <div className="quiz-page">
        <div className="quiz-loading">
          Loading quiz...
        </div>
      </div>
    );
  }

  // No quiz
  if (
    !article ||
    !article.quizEnabled ||
    !article.quiz?.questions?.length
  ) {
    return (
      <div className="quiz-page">
        <div className="quiz-error">
          <h2>Quiz not available</h2>

          <button
            onClick={() =>
              navigate(`/articles/${id}`)
            }
            type="button"
          >
            ← Back to Article
          </button>
        </div>
      </div>
    );
  }

  const questions = article.quiz.questions;
  const totalQuestions = questions.length;
  const question = questions[currentQuestion];

  // ------------------------------------------
  // Finish quiz
  // ------------------------------------------
  const finishQuiz = () => {
    const finalAnswers = [
      ...answers,
      {
        question: question.question,
        selectedAnswer,
        correctAnswer: question.correctAnswer,
      },
    ];

    setAnswers(finalAnswers);
    setQuizFinished(true);
  };

  // ------------------------------------------
  // Next question
  // ------------------------------------------
  const handleNext = () => {
    if (!selectedAnswer) {
      return;
    }

    const updatedAnswers = [
      ...answers,
      {
        question: question.question,
        selectedAnswer,
        correctAnswer: question.correctAnswer,
      },
    ];

    setAnswers(updatedAnswers);

    if (currentQuestion < totalQuestions - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer("");
    } else {
      setQuizFinished(true);
    }
  };

  // ------------------------------------------
  // RESULT PAGE
  // ------------------------------------------
  if (quizFinished) {
    const allAnswers = answers;

    const score = allAnswers.filter(
      (item) =>
        item.selectedAnswer === item.correctAnswer
    ).length;

    const percentage = Math.round(
      (score / totalQuestions) * 100
    );

    return (
      <div className="quiz-page">

        <main className="quiz-result-container">

          {/* Trophy */}
          <div className="result-icon">
            🏆
          </div>

          {/* Heading */}
          <h1 className="result-title">
            Well done!
          </h1>

          <p className="result-score">
            You scored {score} of {totalQuestions} (
            {percentage}%)
          </p>

          {/* Score bar */}
          <div className="result-progress">
            <div
              className="result-progress-fill"
              style={{
                width: `${percentage}%`,
              }}
            />
          </div>

          {/* Answers */}
          <div className="result-answers">

            {allAnswers.map((answer, index) => {

              const isCorrect =
                answer.selectedAnswer ===
                answer.correctAnswer;

              return (
                <div
                  className={`result-answer-card ${
                    isCorrect
                      ? "result-correct"
                      : "result-wrong"
                  }`}
                  key={index}
                >

                  <div className="result-question">

                    <span className="result-check">
                      {isCorrect ? "✓" : "!"}
                    </span>

                    <span>
                      {answer.question}
                    </span>

                  </div>

                  <p className="result-explanation">

                    {isCorrect ? (
                      <>
                        Your answer was correct:
                        {" "}
                        <strong>
                          {answer.correctAnswer}
                        </strong>
                      </>
                    ) : (
                      <>
                        Correct answer:
                        {" "}
                        <strong>
                          {answer.correctAnswer}
                        </strong>
                        <br />
                        Your answer:
                        {" "}
                        <span>
                          {answer.selectedAnswer}
                        </span>
                      </>
                    )}

                  </p>

                </div>
              );
            })}

          </div>

          {/* Back to Article */}
          <button
            className="back-to-article-button"
            onClick={() =>
              navigate(`/articles/${article._id}`)
            }
            type="button"
          >
            Back to Article
          </button>

        </main>

      </div>
    );
  }

  // ------------------------------------------
  // QUIZ QUESTION PAGE
  // ------------------------------------------

  return (
    <div className="quiz-page">

      <main className="quiz-container">

        {/* Back */}
        <button
          className="quiz-back-button"
          onClick={() =>
            navigate(`/articles/${article._id}`)
          }
          type="button"
        >
          ← Back to Article
        </button>

        {/* Progress */}
        <div className="quiz-progress-top">

          <div className="question-number">
            QUESTION {currentQuestion + 1} OF{" "}
            {totalQuestions}
          </div>

          <div className="answered-count">
            {selectedAnswer ? 1 : 0} answered
          </div>

        </div>

        <div className="quiz-progress-line">
          <div
            className="quiz-progress-fill"
            style={{
              width: `${
                ((currentQuestion + 1) /
                  totalQuestions) *
                100
              }%`,
            }}
          />
        </div>

        {/* Question */}
        <section className="quiz-question-card">

          <h1>
            {question.question}
          </h1>

          <div className="quiz-options">

            {question.options.map(
              (option, index) => {

                const optionLetter =
                  String.fromCharCode(
                    65 + index
                  );

                return (
                  <button
                    key={index}
                    className={`quiz-option ${
                      selectedAnswer === option
                        ? "selected"
                        : ""
                    }`}
                    onClick={() =>
                      setSelectedAnswer(option)
                    }
                    type="button"
                  >

                    <span className="option-letter">
                      {optionLetter}
                    </span>

                    <span className="option-text">
                      {option}
                    </span>

                  </button>
                );
              }
            )}

          </div>

        </section>

        {/* Next / Finish */}
        <button
          className={`next-question-button ${
            selectedAnswer ? "enabled" : ""
          }`}
          disabled={!selectedAnswer}
          onClick={handleNext}
          type="button"
        >
          {currentQuestion === totalQuestions - 1
            ? "Finish Quiz"
            : "Next Question"}
        </button>

      </main>

    </div>
  );
}

export default Quiz;