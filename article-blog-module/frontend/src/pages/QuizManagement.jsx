import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getAllArticlesForQuiz,
  updateArticleQuiz,
  deleteArticleQuiz,
} from "../services/quizAPI";
import "./QuizManagement.css";

const createQuestion = () => ({
  question: "",
  options: ["", "", "", ""],
  correctAnswer: "",
});

function QuizManagement() {
  const navigate = useNavigate();

  // States
  const [articles, setArticles] = useState([]);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showEditor, setShowEditor] = useState(false);

  // Load articles
  useEffect(() => {
    loadArticles();
  }, []);

  const loadArticles = async () => {
    try {
      setLoading(true);
      const response = await getAllArticlesForQuiz();
      const articleList = Array.isArray(response)
        ? response
        : response?.articles || [];

      let user = null;
      const savedUser = localStorage.getItem("currentUser");

      if (savedUser) {
        try {
          user = JSON.parse(savedUser);
        } catch {
          console.warn("Invalid currentUser in localStorage.");
        }
      }

      setCurrentUser(user);

      const filteredList = user?._id
        ? articleList.filter(article => {
            const authorId =
              typeof article.author === "object"
                ? article.author?._id
                : article.author;
            return String(authorId) === String(user._id);
          })
        : articleList;

      setArticles(filteredList);
    } catch (error) {
      console.error("Failed to load articles:", error);
      alert(error.response?.data?.message || "Failed to load articles.");
    } finally {
      setLoading(false);
    }
  };

  // Article selection
  const selectArticle = article => {
    setSelectedArticle(article);
    setQuestions(
      (article.quiz?.questions || []).map(q => ({
        question: q.question || "",
        options:
          Array.isArray(q.options) && q.options.length === 4
            ? [...q.options]
            : ["", "", "", ""],
        correctAnswer: q.correctAnswer || "",
      }))
    );
    setShowEditor(false);
  };

  // Quiz creation
  const createQuiz = () => {
    setQuestions([createQuestion()]);
    setShowEditor(true);
  };

  const addQuestion = () => {
    setQuestions(prev => [...prev, createQuestion()]);
    setShowEditor(true);
  };

  // Question editing
  const updateQuestion = (questionIndex, value) => {
    setQuestions(prev =>
      prev.map((q, i) =>
        i === questionIndex ? { ...q, question: value } : q
      )
    );
  };

  const updateOption = (questionIndex, optionIndex, value) => {
    setQuestions(prev =>
      prev.map((q, i) => {
        if (i !== questionIndex) return q;

        const options = [...q.options];
        const oldValue = options[optionIndex];
        options[optionIndex] = value;

        return {
          ...q,
          options,
          correctAnswer:
            q.correctAnswer === oldValue ? "" : q.correctAnswer,
        };
      })
    );
  };

  const setCorrectAnswer = (questionIndex, value) => {
    setQuestions(prev =>
      prev.map((q, i) =>
        i === questionIndex ? { ...q, correctAnswer: value } : q
      )
    );
  };

  const deleteQuestion = questionIndex => {
    if (questions.length === 1) {
      alert("Quiz must contain at least one question.");
      return;
    }

    if (!window.confirm("Delete this question?")) return;

    setQuestions(prev =>
      prev.filter((_, i) => i !== questionIndex)
    );
  };

  // Quiz validation
  const validateQuiz = () => {
    if (!selectedArticle) {
      alert("Please select an article.");
      return false;
    }

    if (!questions.length) {
      alert("Please add at least one question.");
      return false;
    }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const number = i + 1;

      if (!q.question.trim()) {
        alert(`Please enter Question ${number}.`);
        return false;
      }

      if (q.question.trim().length < 5) {
        alert(`Question ${number} must contain at least 5 characters.`);
        return false;
      }

      if (!Array.isArray(q.options) || q.options.length !== 4) {
        alert(`Question ${number} must have exactly 4 options.`);
        return false;
      }

      const options = q.options.map(o => o.trim());

      if (options.some(o => !o)) {
        alert(`Please fill all 4 options for Question ${number}.`);
        return false;
      }

      const normalized = options.map(o => o.toLowerCase());

      if (new Set(normalized).size !== 4) {
        alert(`Question ${number} cannot contain duplicate options.`);
        return false;
      }

      if (!q.correctAnswer.trim()) {
        alert(`Please select the correct answer for Question ${number}.`);
        return false;
      }

      if (!normalized.includes(q.correctAnswer.trim().toLowerCase())) {
        alert(
          `Correct answer for Question ${number} must match one of the options.`
        );
        return false;
      }
    }

    return true;
  };

  // Save quiz
  const handleSaveQuiz = async () => {
    if (!validateQuiz()) return;

    try {
      setSaving(true);

      const authorId =
        typeof selectedArticle.author === "object"
          ? selectedArticle.author?._id
          : selectedArticle.author;

      const quizQuestions = questions.map(q => ({
        question: q.question.trim(),
        options: q.options.map(o => o.trim()),
        correctAnswer: q.correctAnswer.trim(),
      }));

      const articleData = {
        title: selectedArticle.title,
        content: selectedArticle.content,
        category: selectedArticle.category,
        tags: selectedArticle.tags || [],
        author: authorId,
        image: selectedArticle.image || "",
        quizEnabled: true,
        quiz: { questions: quizQuestions },
      };

      const response = await updateArticleQuiz(
        selectedArticle._id,
        articleData
      );

      const updatedArticle = response?.article || response;

      setSelectedArticle(updatedArticle);
      setQuestions(updatedArticle.quiz?.questions || []);
      setArticles(prev =>
        prev.map(article =>
          article._id === updatedArticle._id
            ? updatedArticle
            : article
        )
      );
      setShowEditor(false);
      alert("Quiz saved successfully!");
    } catch (error) {
      console.error("Save quiz error:", error);
      alert(
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Failed to save quiz."
      );
    } finally {
      setSaving(false);
    }
  };

  // Delete complete quiz
  const handleDeleteQuiz = async () => {
    if (!selectedArticle) return;

    if (
      !window.confirm(
        "Are you sure you want to delete the complete quiz?"
      )
    ) {
      return;
    }

    try {
      setSaving(true);

      const response = await deleteArticleQuiz(
        selectedArticle._id
      );

      const updatedArticle = response?.article || response;

      setSelectedArticle(updatedArticle);
      setQuestions([]);
      setShowEditor(false);
      setArticles(prev =>
        prev.map(article =>
          article._id === updatedArticle._id
            ? updatedArticle
            : article
        )
      );

      alert("Quiz deleted successfully!");
    } catch (error) {
      console.error("Delete quiz error:", error);
      alert(
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Failed to delete quiz."
      );
    } finally {
      setSaving(false);
    }
  };

  // Close editor
  const closeEditor = () => {
    if (selectedArticle) selectArticle(selectedArticle);
  };

  // Search
  const searchValue = search.toLowerCase().trim();
  const filteredArticles = articles.filter(article =>
    !searchValue ||
    article.title?.toLowerCase().includes(searchValue) ||
    article.category?.toLowerCase().includes(searchValue) ||
    article.status?.toLowerCase().includes(searchValue)
  );

  // Loading
  if (loading) {
    return (
      <div className="quiz-management-page">
        <div className="quiz-loading">
          <div className="loader" />
          <p>Loading your articles...</p>
        </div>
      </div>
    );
  }

  // UI
  return (
    <div className="quiz-management-page">
      <main className="quiz-management-container">
        <header className="quiz-header">
          <div>
            <span className="quiz-eyebrow">AUTHOR TOOLS</span>
            <h1>Quiz Management</h1>
            <p>
              Create, edit and manage quizzes attached to your articles.
            </p>
          </div>

          <button
            type="button"
            className="back-button"
            onClick={() => navigate("/my-articles")}
          >
            ← My Articles
          </button>
        </header>

        {currentUser && (
          <div className="author-card">
            <div className="author-avatar">
              {(currentUser.name || currentUser.email || "A")
                .charAt(0)
                .toUpperCase()}
            </div>
            <div>
              <span>Managing quizzes for</span>
              <strong>
                {currentUser.name || currentUser.email || "Author"}
              </strong>
            </div>
          </div>
        )}

        <section className="management-section">
          <div className="section-header">
            <div>
              <span className="section-label">ARTICLES</span>
              <h2>Select an Article</h2>
              <p>Choose an article to create or manage its quiz.</p>
            </div>
            <span className="article-count">
              {articles.length} {articles.length === 1 ? "article" : "articles"}
            </span>
          </div>

          {articles.length > 0 && (
            <div className="article-search">
              <input
                type="text"
                value={search}
                placeholder="Search articles..."
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          )}

          {!articles.length ? (
            <div className="empty-state">
              <div className="empty-icon">📝</div>
              <h3>No articles found</h3>
              <p>Create an article first, then attach a quiz to it.</p>
              <button type="button" onClick={() => navigate("/write")}>
                + Write Article
              </button>
            </div>
          ) : !filteredArticles.length ? (
            <div className="empty-state small">
              <div className="empty-icon">🔍</div>
              <h3>No matching articles</h3>
              <p>Try another title, category or status.</p>
            </div>
          ) : (
            <div className="article-grid">
              {filteredArticles.map(article => {
                const hasQuiz =
                  article.quizEnabled &&
                  article.quiz?.questions?.length > 0;
                const selected =
                  selectedArticle?._id === article._id;

                return (
                  <button
                    type="button"
                    key={article._id}
                    className={`article-card ${selected ? "selected" : ""}`}
                    onClick={() => selectArticle(article)}
                  >
                    <div className="article-card-top">
                      <span className="article-category">
                        {article.category || "Article"}
                      </span>
                      <span
                        className={`quiz-badge ${
                          hasQuiz ? "active" : "inactive"
                        }`}
                      >
                        {hasQuiz ? "✓ Quiz Added" : "No Quiz"}
                      </span>
                    </div>

                    <h3>{article.title || "Untitled Article"}</h3>

                    <div className="article-card-bottom">
                      <span>
                        {hasQuiz
                          ? `${article.quiz.questions.length} question${
                              article.quiz.questions.length !== 1 ? "s" : ""
                            }`
                          : "Ready for quiz"}
                      </span>
                      <span className="arrow">→</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {selectedArticle && (
          <section className="management-section editor-section">
            <div className="selected-header">
              <div>
                <span className="section-label">SELECTED ARTICLE</span>
                <h2>{selectedArticle.title}</h2>
              </div>

              <div className="action-buttons">
                {questions.length > 0 && (
                  <button
                    type="button"
                    className="delete-button"
                    onClick={handleDeleteQuiz}
                    disabled={saving}
                  >
                    Delete Quiz
                  </button>
                )}

                <button
                  type="button"
                  className="edit-button"
                  onClick={() =>
                    questions.length
                      ? setShowEditor(prev => !prev)
                      : createQuiz()
                  }
                  disabled={saving}
                >
                  {showEditor
                    ? "Close Editor"
                    : questions.length
                    ? "Edit Quiz"
                    : "Create Quiz"}
                </button>
              </div>
            </div>

            {!showEditor && questions.length > 0 && (
              <div className="quiz-summary">
                <div className="summary-top">
                  <div>
                    <span>QUIZ</span>
                    <h3>
                      {questions.length} Question
                      {questions.length !== 1 ? "s" : ""}
                    </h3>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowEditor(true)}
                  >
                    Edit Questions
                  </button>
                </div>

                <div className="summary-list">
                  {questions.map((q, index) => (
                    <div className="summary-item" key={index}>
                      <div className="summary-number">{index + 1}</div>

                      <div className="summary-content">
                        <h4>{q.question}</h4>
                        <p>
                          Correct answer:
                          <strong> {q.correctAnswer}</strong>
                        </p>

                        <div className="summary-options">
                          {q.options.map((option, oi) => {
                            const correct =
                              option.trim().toLowerCase() ===
                              q.correctAnswer.trim().toLowerCase();

                            return (
                              <span
                                key={oi}
                                className={
                                  correct ? "correct-option" : ""
                                }
                              >
                                {String.fromCharCode(65 + oi)}. {option}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(showEditor || !questions.length) && (
              <div className="quiz-editor">
                {!questions.length && (
                  <div className="create-empty">
                    <div>🧠</div>
                    <h3>Create a Quiz</h3>
                    <p>
                      Test your readers with questions about this article.
                    </p>
                    <button type="button" onClick={createQuiz}>
                      + Add First Question
                    </button>
                  </div>
                )}

                {questions.length > 0 && (
                  <>
                    <div className="editor-heading">
                      <div>
                        <span className="section-label">QUIZ EDITOR</span>
                        <h3>
                          {selectedArticle.quizEnabled
                            ? "Edit Quiz"
                            : "Create Quiz"}
                        </h3>
                        <p>
                          Add questions, four options and select the correct answer.
                        </p>
                      </div>

                      <span className="question-count">
                        {questions.length}{" "}
                        {questions.length === 1 ? "Question" : "Questions"}
                      </span>
                    </div>

                    {questions.map((q, qi) => (
                      <div className="question-card" key={qi}>
                        <div className="question-header">
                          <span>QUESTION {qi + 1}</span>

                          {questions.length > 1 && (
                            <button
                              type="button"
                              className="remove-question"
                              onClick={() => deleteQuestion(qi)}
                            >
                              Delete
                            </button>
                          )}
                        </div>

                        <label>Question</label>

                        <textarea
                          value={q.question}
                          rows={3}
                          placeholder="Enter your question..."
                          onChange={e =>
                            updateQuestion(qi, e.target.value)
                          }
                        />

                        <div className="options-heading">
                          <label>Answer Options</label>
                          <span>Select one as correct</span>
                        </div>

                        <div className="options-grid">
                          {q.options.map((option, oi) => {
                            const letter = String.fromCharCode(65 + oi);
                            const isCorrect =
                              q.correctAnswer.trim().toLowerCase() ===
                              option.trim().toLowerCase();

                            return (
                              <div
                                className={`option-row ${
                                  isCorrect ? "correct" : ""
                                }`}
                                key={oi}
                              >
                                <span className="option-letter">
                                  {letter}
                                </span>

                                <input
                                  type="text"
                                  value={option}
                                  placeholder={`Option ${letter}`}
                                  onChange={e =>
                                    updateOption(
                                      qi,
                                      oi,
                                      e.target.value
                                    )
                                  }
                                />

                                <button
                                  type="button"
                                  className={`correct-button ${
                                    isCorrect ? "selected" : ""
                                  }`}
                                  disabled={!option.trim()}
                                  onClick={() =>
                                    setCorrectAnswer(qi, option)
                                  }
                                >
                                  {isCorrect
                                    ? "✓ Correct"
                                    : "Set Correct"}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}

                    <button
                      type="button"
                      className="add-question"
                      onClick={addQuestion}
                    >
                      + Add Another Question
                    </button>

                    <div className="editor-footer">
                      <button
                        type="button"
                        className="cancel-button"
                        onClick={closeEditor}
                        disabled={saving}
                      >
                        Cancel
                      </button>

                      <button
                        type="button"
                        className="save-button"
                        onClick={handleSaveQuiz}
                        disabled={saving}
                      >
                        {saving ? "Saving..." : "Save Quiz"}
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}

export default QuizManagement;