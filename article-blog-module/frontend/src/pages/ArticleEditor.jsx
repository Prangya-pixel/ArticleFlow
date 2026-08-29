import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  createArticle,
  getArticleById,
  updateArticle,
  submitArticle,
  getUsers,
} from "../services/articleAPI";
import "./ArticleEditor.css";

function ArticleEditor() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Editing article ID from /write?edit=ARTICLE_ID
  const editId = searchParams.get("edit");

  const [articleId, setArticleId] = useState(editId || null);

  // Article fields
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Science");
  const [tags, setTags] = useState("");
  const [content, setContent] = useState("");
  const [quizEnabled, setQuizEnabled] = useState(false);

  // Quiz questions
  const [quizQuestions, setQuizQuestions] = useState([
    {
      question: "",
      options: ["", "", "", ""],
      correctAnswer: "",
    },
  ]);

  // User state
  const [currentUser, setCurrentUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  // Other states
  const [loadingArticle, setLoadingArticle] = useState(false);
  const [saving, setSaving] = useState(false);

  // --------------------------------------------------
  // LOAD CURRENT USER
  // --------------------------------------------------
  useEffect(() => {
    const loadCurrentUser = async () => {
      try {
        setLoadingUser(true);

        const users = await getUsers();

        if (!users || users.length === 0) {
          throw new Error("No users found.");
        }

        // Check if Navbar/user switcher already saved a user
        const savedUser = localStorage.getItem("currentUser");

        let selectedUser = null;

        if (savedUser) {
          try {
            const parsedUser = JSON.parse(savedUser);

            selectedUser = users.find(
              (user) =>
                user._id === parsedUser._id ||
                user.email === parsedUser.email
            );
          } catch (parseError) {
            console.error(
              "Invalid currentUser data:",
              parseError
            );
          }
        }

        // Default to first available author
        if (!selectedUser) {
          selectedUser =
            users.find((user) => user.role === "author") ||
            users[0];

          localStorage.setItem(
            "currentUser",
            JSON.stringify(selectedUser)
          );
        } else {
          localStorage.setItem(
            "currentUser",
            JSON.stringify(selectedUser)
          );
        }

        setCurrentUser(selectedUser);
      } catch (error) {
        console.error(
          "Failed to load current user:",
          error
        );

        alert(
          "Unable to load the current user. Please make sure the backend is running."
        );
      } finally {
        setLoadingUser(false);
      }
    };

    loadCurrentUser();
  }, []);

  // --------------------------------------------------
  // LOAD EXISTING ARTICLE WHEN EDITING
  // --------------------------------------------------
  useEffect(() => {
    if (!editId) {
      return;
    }

    const loadArticle = async () => {
      try {
        setLoadingArticle(true);

        const data = await getArticleById(editId);
        const article = data.article || data;

        setArticleId(article._id);

        setTitle(article.title || "");

        setCategory(
          article.category || "Science"
        );

        setTags(
          Array.isArray(article.tags)
            ? article.tags.join(", ")
            : article.tags || ""
        );

        setContent(article.content || "");

        setQuizEnabled(
          Boolean(article.quizEnabled)
        );

        if (
          article.quiz &&
          Array.isArray(article.quiz.questions) &&
          article.quiz.questions.length > 0
        ) {
          setQuizQuestions(
            article.quiz.questions.map((question) => ({
              question: question.question || "",
              options:
                Array.isArray(question.options) &&
                question.options.length === 4
                  ? question.options
                  : ["", "", "", ""],
              correctAnswer:
                question.correctAnswer || "",
            }))
          );
        }
      } catch (error) {
        console.error(
          "Failed to load article:",
          error
        );

        alert(
          error.response?.data?.message ||
            "Failed to load article."
        );

        navigate("/profile");
      } finally {
        setLoadingArticle(false);
      }
    };

    loadArticle();
  }, [editId, navigate]);

  // --------------------------------------------------
  // VALIDATE ARTICLE
  // --------------------------------------------------
  const validateArticle = () => {
    if (!currentUser?._id) {
      alert("Please select a valid author first.");
      return false;
    }

    if (currentUser.role !== "author") {
      alert(
        "Only an author can create or submit an article."
      );
      return false;
    }

    if (!title.trim()) {
      alert("Please enter the article title.");
      return false;
    }

    if (!content.trim()) {
      alert("Please enter the article content.");
      return false;
    }

    // Quiz validation
    if (quizEnabled) {
      if (quizQuestions.length === 0) {
        alert("Please add at least one quiz question.");
        return false;
      }

      for (
        let i = 0;
        i < quizQuestions.length;
        i++
      ) {
        const question = quizQuestions[i];

        if (!question.question.trim()) {
          alert(
            `Please enter Question ${i + 1}.`
          );
          return false;
        }

        if (
          !Array.isArray(question.options) ||
          question.options.length !== 4
        ) {
          alert(
            `Question ${i + 1} must have exactly 4 options.`
          );
          return false;
        }

        if (
          question.options.some(
            (option) => !option.trim()
          )
        ) {
          alert(
            `Please fill all 4 options for Question ${i + 1}.`
          );
          return false;
        }

        if (!question.correctAnswer.trim()) {
          alert(
            `Please select the correct answer for Question ${i + 1}.`
          );
          return false;
        }
      }
    }

    return true;
  };

  // --------------------------------------------------
  // PREPARE ARTICLE DATA
  // --------------------------------------------------
  const getArticleData = () => {
    return {
      title: title.trim(),

      content: content.trim(),

      category: category.trim(),

      tags: tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0),

      // Current logged-in/selected author
      author: currentUser?._id,

      quizEnabled,

      quiz: quizEnabled
        ? {
            questions: quizQuestions.map(
              (question) => ({
                question: question.question.trim(),

                options: question.options.map(
                  (option) => option.trim()
                ),

                correctAnswer:
                  question.correctAnswer.trim(),
              })
            ),
          }
        : {
            questions: [],
          },
    };
  };

  // --------------------------------------------------
  // UPDATE QUIZ QUESTION TEXT
  // --------------------------------------------------
  const updateQuestionText = (
    questionIndex,
    value
  ) => {
    setQuizQuestions(
      (previousQuestions) =>
        previousQuestions.map(
          (question, index) =>
            index === questionIndex
              ? {
                  ...question,
                  question: value,
                }
              : question
        )
    );
  };

  // --------------------------------------------------
  // UPDATE QUIZ OPTION
  // --------------------------------------------------
  const updateOption = (
    questionIndex,
    optionIndex,
    value
  ) => {
    setQuizQuestions(
      (previousQuestions) =>
        previousQuestions.map(
          (question, index) => {
            if (index !== questionIndex) {
              return question;
            }

            const updatedOptions = [
              ...question.options,
            ];

            updatedOptions[optionIndex] = value;

            return {
              ...question,
              options: updatedOptions,
            };
          }
        )
    );
  };

  // --------------------------------------------------
  // UPDATE CORRECT ANSWER
  // --------------------------------------------------
  const updateCorrectAnswer = (
    questionIndex,
    value
  ) => {
    setQuizQuestions(
      (previousQuestions) =>
        previousQuestions.map(
          (question, index) =>
            index === questionIndex
              ? {
                  ...question,
                  correctAnswer: value,
                }
              : question
        )
    );
  };

  // --------------------------------------------------
  // ADD QUESTION
  // --------------------------------------------------
  const addQuestion = () => {
    setQuizQuestions(
      (previousQuestions) => [
        ...previousQuestions,

        {
          question: "",
          options: ["", "", "", ""],
          correctAnswer: "",
        },
      ]
    );
  };

  // --------------------------------------------------
  // REMOVE QUESTION
  // --------------------------------------------------
  const removeQuestion = (
    questionIndex
  ) => {
    if (quizQuestions.length === 1) {
      return;
    }

    setQuizQuestions(
      (previousQuestions) =>
        previousQuestions.filter(
          (_, index) =>
            index !== questionIndex
        )
    );
  };

  // --------------------------------------------------
  // SAVE DRAFT
  // --------------------------------------------------
  const handleSaveDraft = async () => {
    if (!validateArticle()) {
      return;
    }

    try {
      setSaving(true);

      const articleData =
        getArticleData();

      // Existing article
      if (articleId) {
        await updateArticle(
          articleId,
          articleData
        );

        alert(
          "Draft updated successfully!"
        );
      }

      // New article
      else {
        const response =
          await createArticle(
            articleData
          );

        const savedArticle =
          response.article ||
          response;

        setArticleId(
          savedArticle._id
        );

        alert(
          "Draft saved successfully!"
        );
      }
    } catch (error) {
      console.error(
        "Save draft error:",
        error
      );

      alert(
        error.response?.data?.message ||
          "Failed to save draft."
      );
    } finally {
      setSaving(false);
    }
  };

  // --------------------------------------------------
  // SUBMIT FOR REVIEW
  // --------------------------------------------------
  const handleSubmit = async () => {
    if (!validateArticle()) {
      return;
    }

    try {
      setSaving(true);

      const articleData =
        getArticleData();

      let currentId = articleId;

      // Create article once if it doesn't exist
      if (!currentId) {
        const response =
          await createArticle(
            articleData
          );

        const savedArticle =
          response.article ||
          response;

        currentId =
          savedArticle._id;

        setArticleId(currentId);
      } else {
        // Update the same article
        await updateArticle(
          currentId,
          articleData
        );
      }

      // Same article: Draft → Pending
      await submitArticle(
        currentId
      );

      alert(
        "Article submitted for review!"
      );

      navigate("/profile");
    } catch (error) {
      console.error(
        "Submit article error:",
        error
      );

      alert(
        error.response?.data?.message ||
          "Failed to submit article for review."
      );
    } finally {
      setSaving(false);
    }
  };

  // --------------------------------------------------
  // LOADING USER
  // --------------------------------------------------
  if (loadingUser) {
    return (
      <div className="article-editor-page">

        <div
          style={{
            padding: "60px",
            textAlign: "center",
          }}
        >
          Loading user...
        </div>

      </div>
    );
  }

  // --------------------------------------------------
  // LOADING ARTICLE
  // --------------------------------------------------
  if (loadingArticle) {
    return (
      <div className="article-editor-page">

        <div
          style={{
            padding: "60px",
            textAlign: "center",
          }}
        >
          Loading article...
        </div>

      </div>
    );
  }

  // --------------------------------------------------
  // PAGE UI
  // --------------------------------------------------
  return (
    <div className="article-editor-page">

      <main className="editor-container">

        {/* Heading */}
        <div className="editor-heading">

          <div>

            <h1>
              {editId
                ? "Edit Article"
                : "New Article"}
            </h1>

            <p>
              Write your article and add a
              quiz before submitting for review.
            </p>

          </div>

          <button
            className="cancel-button"
            onClick={() =>
              navigate("/")
            }
            type="button"
          >
            ← Cancel
          </button>

        </div>

        {/* Title */}
        <section className="editor-card title-card">

          <label>Title</label>

          <input
            type="text"
            value={title}
            onChange={(e) =>
              setTitle(e.target.value)
            }
            placeholder="Enter your article title..."
          />

        </section>

        {/* Article Details */}
        <section className="editor-card">

          <div className="details-row">

            {/* Category */}
            <div className="field-group">

              <label>Category</label>

              <select
                value={category}
                onChange={(e) =>
                  setCategory(e.target.value)
                }
              >
                <option>Science</option>
                <option>Technology</option>
                <option>Health</option>
                <option>Environment</option>
                <option>History</option>
                <option>Culture</option>
              </select>

            </div>

            {/* Tags */}
            <div className="field-group">

              <label>
                Tags (comma separated)
              </label>

              <input
                type="text"
                value={tags}
                onChange={(e) =>
                  setTags(e.target.value)
                }
                placeholder="AI, education, technology"
              />

            </div>

          </div>

          {/* Content */}
          <div className="field-group content-group">

            <label>Content</label>

            <textarea
              value={content}
              onChange={(e) =>
                setContent(e.target.value)
              }
              placeholder="Write your article here..."
            />

          </div>

        </section>

        {/* Quiz Toggle */}
        <section className="editor-card quiz-toggle-card">

          <div>

            <h3>Add a Quiz</h3>

            <p>
              Quizzes increase reader engagement
              significantly.
            </p>

          </div>

          <button
            className={`toggle ${
              quizEnabled
                ? "toggle-on"
                : ""
            }`}
            onClick={() =>
              setQuizEnabled(
                !quizEnabled
              )
            }
            type="button"
          >
            <span></span>
          </button>

        </section>

        {/* Quiz Builder */}
        {quizEnabled && (
          <section className="editor-card quiz-builder">

            <h2>Quiz Builder</h2>

            <p className="quiz-description">
              Add questions that readers can
              answer after reading your article.
            </p>

            {quizQuestions.map(
              (
                question,
                questionIndex
              ) => (

                <div
                  className="question-box"
                  key={questionIndex}
                >

                  {/* Question header */}
                  <div className="question-header">

                    <label>
                      Question{" "}
                      {questionIndex + 1}
                    </label>

                    {quizQuestions.length >
                      1 && (
                      <button
                        type="button"
                        className="remove-question"
                        onClick={() =>
                          removeQuestion(
                            questionIndex
                          )
                        }
                      >
                        Remove
                      </button>
                    )}

                  </div>

                  {/* Question */}
                  <input
                    type="text"
                    value={
                      question.question
                    }
                    onChange={(e) =>
                      updateQuestionText(
                        questionIndex,
                        e.target.value
                      )
                    }
                    placeholder="Enter your question..."
                  />

                  {/* Options */}
                  <div className="options-grid">

                    {question.options.map(
                      (
                        option,
                        optionIndex
                      ) => (
                        <input
                          key={optionIndex}
                          type="text"
                          value={option}
                          onChange={(e) =>
                            updateOption(
                              questionIndex,
                              optionIndex,
                              e.target.value
                            )
                          }
                          placeholder={`Option ${
                            String.fromCharCode(
                              65 +
                                optionIndex
                            )
                          }`}
                        />
                      )
                    )}

                  </div>

                  {/* Correct answer */}
                  <label className="answer-label">
                    Correct Answer
                  </label>

                  <select
                    value={
                      question.correctAnswer
                    }
                    onChange={(e) =>
                      updateCorrectAnswer(
                        questionIndex,
                        e.target.value
                      )
                    }
                  >

                    <option value="">
                      Select correct answer
                    </option>

                    {question.options.map(
                      (
                        option,
                        optionIndex
                      ) => (
                        <option
                          key={optionIndex}
                          value={option}
                          disabled={
                            !option.trim()
                          }
                        >
                          Option{" "}
                          {String.fromCharCode(
                            65 +
                              optionIndex
                          )}
                        </option>
                      )
                    )}

                  </select>

                </div>
              )
            )}

            {/* Add question */}
            <button
              className="add-question"
              onClick={addQuestion}
              type="button"
            >
              + Add Question
            </button>

          </section>
        )}

      </main>

      {/* Bottom Actions */}
      <div className="bottom-actions">

        {/* Save Draft */}
        <button
          className="save-button"
          onClick={handleSaveDraft}
          disabled={
            saving ||
            loadingUser
          }
          type="button"
        >
          {saving
            ? "Saving..."
            : "Save Draft"}
        </button>

        {/* Submit */}
        <button
          className="submit-button"
          onClick={handleSubmit}
          disabled={
            saving ||
            loadingUser ||
            !title.trim() ||
            !content.trim()
          }
          type="button"
        >

          {/* Share icon */}
          <svg
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle
              cx="18"
              cy="5"
              r="3"
            />

            <circle
              cx="6"
              cy="12"
              r="3"
            />

            <circle
              cx="18"
              cy="19"
              r="3"
            />

            <line
              x1="8.6"
              y1="10.7"
              x2="15.4"
              y2="6.3"
            />

            <line
              x1="8.6"
              y1="13.3"
              x2="15.4"
              y2="17.7"
            />
          </svg>

          {saving
            ? "Submitting..."
            : "Submit for Review"}

        </button>

      </div>

    </div>
  );
}

export default ArticleEditor;