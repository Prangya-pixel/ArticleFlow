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

const emptyQuestion = () => ({
  question: "",
  options: ["", "", "", ""],
  correctAnswer: "",
});

const categories = [
  "Science",
  "Technology",
  "Health",
  "Environment",
  "History",
  "Culture",
];

/*
  BUILT-IN QUIZ DATABASE
  No API or backend is required for quiz generation.
*/

const quizBank = {
  science: [
    {
      question: "What is the basic unit of life?",
      options: ["Cell", "Atom", "Tissue", "Organ"],
      correctAnswer: "Cell",
    },
    {
      question: "Which force keeps planets in orbit around the Sun?",
      options: ["Gravity", "Friction", "Magnetism", "Electricity"],
      correctAnswer: "Gravity",
    },
    {
      question: "Which gas do plants mainly absorb during photosynthesis?",
      options: ["Carbon dioxide", "Oxygen", "Nitrogen", "Hydrogen"],
      correctAnswer: "Carbon dioxide",
    },
    {
      question: "What is H2O commonly known as?",
      options: ["Water", "Oxygen", "Hydrogen", "Salt"],
      correctAnswer: "Water",
    },
    {
      question: "Which organ pumps blood throughout the human body?",
      options: ["Heart", "Lungs", "Brain", "Kidney"],
      correctAnswer: "Heart",
    },
    {
      question: "What is the center of an atom called?",
      options: ["Nucleus", "Electron", "Proton", "Shell"],
      correctAnswer: "Nucleus",
    },
    {
      question: "Which planet is known as the Red Planet?",
      options: ["Mars", "Venus", "Jupiter", "Mercury"],
      correctAnswer: "Mars",
    },
    {
      question: "What process do plants use to make food?",
      options: [
        "Photosynthesis",
        "Respiration",
        "Digestion",
        "Fermentation",
      ],
      correctAnswer: "Photosynthesis",
    },
  ],

  technology: [
    {
      question: "What does HTML stand for?",
      options: [
        "HyperText Markup Language",
        "HighText Machine Language",
        "Hyper Transfer Markup Language",
        "Home Tool Markup Language",
      ],
      correctAnswer: "HyperText Markup Language",
    },
    {
      question: "Which language is primarily used to add interactivity to web pages?",
      options: ["JavaScript", "HTML", "CSS", "SQL"],
      correctAnswer: "JavaScript",
    },
    {
      question: "What does CSS primarily control?",
      options: [
        "Web page styling",
        "Database storage",
        "Server hardware",
        "Network routing",
      ],
      correctAnswer: "Web page styling",
    },
    {
      question: "Which technology is commonly used to store structured relational data?",
      options: ["SQL", "HTML", "CSS", "JPEG"],
      correctAnswer: "SQL",
    },
    {
      question: "What is React primarily used for?",
      options: [
        "Building user interfaces",
        "Managing hardware",
        "Creating databases",
        "Operating systems",
      ],
      correctAnswer: "Building user interfaces",
    },
    {
      question: "Which of these is a JavaScript runtime?",
      options: ["Node.js", "MySQL", "MongoDB", "HTML"],
      correctAnswer: "Node.js",
    },
    {
      question: "What does API stand for?",
      options: [
        "Application Programming Interface",
        "Application Process Integration",
        "Advanced Programming Internet",
        "Automated Program Instruction",
      ],
      correctAnswer: "Application Programming Interface",
    },
    {
      question: "Which database is a NoSQL database?",
      options: ["MongoDB", "MySQL", "PostgreSQL", "Oracle"],
      correctAnswer: "MongoDB",
    },
  ],

  health: [
    {
      question: "Which organ is primarily responsible for pumping blood?",
      options: ["Heart", "Liver", "Kidney", "Lung"],
      correctAnswer: "Heart",
    },
    {
      question: "Which vitamin is commonly produced by the body through sunlight exposure?",
      options: ["Vitamin D", "Vitamin C", "Vitamin B12", "Vitamin K"],
      correctAnswer: "Vitamin D",
    },
    {
      question: "Which nutrient is mainly responsible for building and repairing muscles?",
      options: ["Protein", "Water", "Fiber", "Minerals"],
      correctAnswer: "Protein",
    },
    {
      question: "Which organ is primarily responsible for breathing?",
      options: ["Lungs", "Heart", "Liver", "Stomach"],
      correctAnswer: "Lungs",
    },
    {
      question: "Why is drinking water important for the body?",
      options: [
        "It supports hydration",
        "It replaces oxygen",
        "It stops digestion",
        "It removes all nutrients",
      ],
      correctAnswer: "It supports hydration",
    },
  ],

  environment: [
    {
      question: "Which gas is a major contributor to global warming?",
      options: [
        "Carbon dioxide",
        "Oxygen",
        "Helium",
        "Hydrogen",
      ],
      correctAnswer: "Carbon dioxide",
    },
    {
      question: "What is the process of planting trees to restore forests called?",
      options: [
        "Reforestation",
        "Deforestation",
        "Urbanization",
        "Industrialization",
      ],
      correctAnswer: "Reforestation",
    },
    {
      question: "Which of these is a renewable energy source?",
      options: ["Solar energy", "Coal", "Petroleum", "Natural gas"],
      correctAnswer: "Solar energy",
    },
    {
      question: "What is recycling mainly intended to reduce?",
      options: [
        "Waste",
        "Sunlight",
        "Rainfall",
        "Oxygen",
      ],
      correctAnswer: "Waste",
    },
    {
      question: "Which ecosystem is characterized by very little rainfall?",
      options: ["Desert", "Rainforest", "Wetland", "Mangrove"],
      correctAnswer: "Desert",
    },
  ],

  history: [
    {
      question: "Who was the first President of the United States?",
      options: [
        "George Washington",
        "Abraham Lincoln",
        "Thomas Jefferson",
        "John Adams",
      ],
      correctAnswer: "George Washington",
    },
    {
      question: "Which ancient civilization built the pyramids of Giza?",
      options: [
        "Ancient Egyptians",
        "Romans",
        "Greeks",
        "Vikings",
      ],
      correctAnswer: "Ancient Egyptians",
    },
    {
      question: "The Industrial Revolution began in which country?",
      options: ["Britain", "France", "India", "Spain"],
      correctAnswer: "Britain",
    },
    {
      question: "Who is widely known as the leader of India's non-violent independence movement?",
      options: [
        "Mahatma Gandhi",
        "Jawaharlal Nehru",
        "Subhas Chandra Bose",
        "Bhagat Singh",
      ],
      correctAnswer: "Mahatma Gandhi",
    },
    {
      question: "Which empire was centered in ancient Rome?",
      options: [
        "Roman Empire",
        "Mughal Empire",
        "Ottoman Empire",
        "Maurya Empire",
      ],
      correctAnswer: "Roman Empire",
    },
  ],

  culture: [
    {
      question: "Which form of art uses the human body to express ideas through movement?",
      options: ["Dance", "Painting", "Sculpture", "Architecture"],
      correctAnswer: "Dance",
    },
    {
      question: "Which of these is traditionally associated with Indian classical music?",
      options: ["Raga", "Opera", "Blues", "Jazz"],
      correctAnswer: "Raga",
    },
    {
      question: "Which festival is widely known as the festival of lights in India?",
      options: ["Diwali", "Holi", "Eid", "Onam"],
      correctAnswer: "Diwali",
    },
    {
      question: "Which art form primarily involves creating images using colors and surfaces?",
      options: ["Painting", "Dance", "Music", "Drama"],
      correctAnswer: "Painting",
    },
  ],
};

/*
  Detect topic from title, category, tags and content.
*/

const detectTopic = (title, category, tags, content) => {
  const text = `${title} ${category} ${tags} ${content}`.toLowerCase();

  const topicKeywords = {
    technology: [
      "technology",
      "computer",
      "software",
      "programming",
      "javascript",
      "react",
      "node",
      "coding",
      "ai",
      "artificial intelligence",
      "machine learning",
      "web",
      "internet",
      "database",
      "app",
      "application",
      "cyber",
      "digital",
    ],

    science: [
      "science",
      "physics",
      "chemistry",
      "biology",
      "space",
      "planet",
      "atom",
      "cell",
      "energy",
      "experiment",
      "research",
      "scientific",
      "solar",
      "universe",
    ],

    health: [
      "health",
      "medicine",
      "medical",
      "doctor",
      "disease",
      "fitness",
      "nutrition",
      "vitamin",
      "exercise",
      "body",
      "hospital",
      "mental health",
      "wellness",
    ],

    environment: [
      "environment",
      "climate",
      "pollution",
      "global warming",
      "forest",
      "nature",
      "wildlife",
      "recycling",
      "renewable",
      "sustainability",
      "carbon",
      "ecosystem",
      "green energy",
    ],

    history: [
      "history",
      "historical",
      "war",
      "empire",
      "king",
      "queen",
      "ancient",
      "revolution",
      "independence",
      "civilization",
      "gandhi",
      "mughal",
      "roman",
    ],

    culture: [
      "culture",
      "festival",
      "tradition",
      "music",
      "dance",
      "art",
      "literature",
      "religion",
      "heritage",
      "food",
      "custom",
      "society",
    ],
  };

  let bestTopic = category.toLowerCase();

  let bestScore = 0;

  Object.entries(topicKeywords).forEach(([topic, keywords]) => {
    let score = 0;

    keywords.forEach((keyword) => {
      if (text.includes(keyword)) {
        score++;
      }
    });

    if (score > bestScore) {
      bestScore = score;
      bestTopic = topic;
    }
  });

  if (!quizBank[bestTopic]) {
    bestTopic = "science";
  }

  return bestTopic;
};

/*
  Generate quiz locally from the detected topic.
*/

const generateLocalQuiz = (title, category, tags, content) => {
  const topic = detectTopic(title, category, tags, content);

  const bank = quizBank[topic] || quizBank.science;

  const shuffled = [...bank].sort(() => Math.random() - 0.5);

  return shuffled.slice(0, Math.min(5, shuffled.length)).map((q) => ({
    question: q.question,
    options: [...q.options],
    correctAnswer: q.correctAnswer,
  }));
};

function ArticleEditor() {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const editId = params.get("edit");

  const [articleId, setArticleId] = useState(editId || null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Science");
  const [tags, setTags] = useState("");
  const [content, setContent] = useState("");

  const [quizEnabled, setQuizEnabled] = useState(false);

  const [quizQuestions, setQuizQuestions] = useState([
    emptyQuestion(),
  ]);

  const [currentUser, setCurrentUser] = useState(null);

  const [loadingUser, setLoadingUser] = useState(true);
  const [loadingArticle, setLoadingArticle] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generatingQuiz, setGeneratingQuiz] = useState(false);

  // Load current user
  useEffect(() => {
    const loadUser = async () => {
      try {
        const saved = localStorage.getItem("currentUser");

        if (saved) {
          try {
            const user = JSON.parse(saved);

            if (user?._id) {
              setCurrentUser(user);
              return;
            }
          } catch {
            localStorage.removeItem("currentUser");
          }
        }

        const response = await getUsers();

        const users = Array.isArray(response)
          ? response
          : response?.users || [];

        if (!users.length) {
          throw new Error("No users found.");
        }

        const user =
          users.find((u) => u.role === "author") || users[0];

        if (!user?._id) {
          throw new Error("No valid user found.");
        }

        localStorage.setItem(
          "currentUser",
          JSON.stringify(user)
        );

        setCurrentUser(user);
      } catch (error) {
        console.error(error);

        alert(
          error.response?.data?.message ||
            "Unable to load the current user. Please make sure the backend is running."
        );
      } finally {
        setLoadingUser(false);
      }
    };

    loadUser();
  }, []);

  // Load article when editing
  useEffect(() => {
    if (!editId) return;

    const loadArticle = async () => {
      try {
        setLoadingArticle(true);

        const response = await getArticleById(editId);

        const article = response?.article || response;

        setArticleId(article._id || editId);

        setTitle(article.title || "");

        setCategory(article.category || "Science");

        setTags(
          Array.isArray(article.tags)
            ? article.tags.join(", ")
            : article.tags || ""
        );

        setContent(article.content || "");

        setQuizEnabled(Boolean(article.quizEnabled));

        const questions = article.quiz?.questions;

        setQuizQuestions(
          Array.isArray(questions) && questions.length
            ? questions.map((q) => ({
                question: q.question || "",
                options:
                  Array.isArray(q.options) &&
                  q.options.length === 4
                    ? [...q.options]
                    : ["", "", "", ""],
                correctAnswer: q.correctAnswer || "",
              }))
            : [emptyQuestion()]
        );
      } catch (error) {
        console.error(error);

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

  /*
    AUTOMATIC QUIZ GENERATION
  */

  const handleGenerateQuiz = () => {
    if (!title.trim()) {
      alert("Please enter the article title first.");
      return;
    }

    if (!content.trim()) {
      alert("Please enter the article content first.");
      return;
    }

    try {
      setGeneratingQuiz(true);

      // Small delay so the user can see the generating state
      setTimeout(() => {
        const generatedQuestions = generateLocalQuiz(
          title,
          category,
          tags,
          content
        );

        if (!generatedQuestions.length) {
          alert("Unable to generate quiz questions.");
          setGeneratingQuiz(false);
          return;
        }

        setQuizQuestions(generatedQuestions);

        setQuizEnabled(true);

        setGeneratingQuiz(false);

        alert("Quiz generated successfully!");
      }, 700);
    } catch (error) {
      console.error("Quiz generation error:", error);

      setGeneratingQuiz(false);

      alert("Failed to generate quiz.");
    }
  };

  // Validate article
  const validateArticle = () => {
    if (!currentUser?._id) {
      alert("Please select a valid author first.");
      return false;
    }

    if (currentUser.role !== "author") {
      alert("Only an author can create or submit an article.");
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

    if (!quizEnabled) {
      return true;
    }

    if (!quizQuestions.length) {
      alert("Please add at least one quiz question.");
      return false;
    }

    for (let i = 0; i < quizQuestions.length; i++) {
      const q = quizQuestions[i];
      const n = i + 1;

      if (!q.question.trim()) {
        alert(`Please enter Question ${n}.`);
        return false;
      }

      if (q.question.trim().length < 5) {
        alert(
          `Question ${n} must contain at least 5 characters.`
        );
        return false;
      }

      if (
        !Array.isArray(q.options) ||
        q.options.length !== 4
      ) {
        alert(
          `Question ${n} must have exactly 4 options.`
        );
        return false;
      }

      const options = q.options.map((o) => o.trim());

      const normalized = options.map((o) =>
        o.toLowerCase()
      );

      if (options.some((o) => !o)) {
        alert(
          `Please fill all 4 options for Question ${n}.`
        );
        return false;
      }

      if (new Set(normalized).size !== 4) {
        alert(
          `Question ${n} cannot contain duplicate options.`
        );
        return false;
      }

      if (!q.correctAnswer.trim()) {
        alert(
          `Please select the correct answer for Question ${n}.`
        );
        return false;
      }

      if (
        !normalized.includes(
          q.correctAnswer.trim().toLowerCase()
        )
      ) {
        alert(
          `Correct answer for Question ${n} must match an option.`
        );
        return false;
      }
    }

    return true;
  };

  // Prepare article data
  const getArticleData = () => ({
    title: title.trim(),

    content: content.trim(),

    category: category.trim(),

    tags: tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean),

    author: currentUser?._id,

    quizEnabled,

    quiz: {
      questions: quizEnabled
        ? quizQuestions.map((q) => ({
            question: q.question.trim(),

            options: q.options.map((o) =>
              o.trim()
            ),

            correctAnswer:
              q.correctAnswer.trim(),
          }))
        : [],
    },
  });

  // Update question
  const updateQuestion = (qi, value) => {
    setQuizQuestions((prev) =>
      prev.map((q, i) =>
        i === qi
          ? {
              ...q,
              question: value,
            }
          : q
      )
    );
  };

  // Update option
  const updateOption = (qi, oi, value) => {
    setQuizQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qi) return q;

        const options = [...q.options];

        const oldValue = options[oi];

        options[oi] = value;

        return {
          ...q,
          options,

          correctAnswer:
            q.correctAnswer === oldValue
              ? ""
              : q.correctAnswer,
        };
      })
    );
  };

  // Update correct answer
  const updateAnswer = (qi, value) => {
    setQuizQuestions((prev) =>
      prev.map((q, i) =>
        i === qi
          ? {
              ...q,
              correctAnswer: value,
            }
          : q
      )
    );
  };

  // Add question
  const addQuestion = () => {
    setQuizQuestions((prev) => [
      ...prev,
      emptyQuestion(),
    ]);
  };

  // Remove question
  const removeQuestion = (qi) => {
    if (quizQuestions.length === 1) {
      alert(
        "Quiz must contain at least one question."
      );
      return;
    }

    setQuizQuestions((prev) =>
      prev.filter((_, i) => i !== qi)
    );
  };

  // Toggle quiz
  const toggleQuiz = () => {
    setQuizEnabled((prev) => {
      const next = !prev;

      if (next && !quizQuestions.length) {
        setQuizQuestions([emptyQuestion()]);
      }

      return next;
    });
  };

  // Save draft
  const handleSaveDraft = async () => {
    if (!validateArticle()) return;

    try {
      setSaving(true);

      const data = getArticleData();

      if (articleId) {
        await updateArticle(articleId, data);

        alert("Draft updated successfully!");
      } else {
        const response =
          await createArticle(data);

        const article =
          response?.article || response;

        if (!article?._id) {
          throw new Error(
            "Article ID was not returned."
          );
        }

        setArticleId(article._id);

        alert("Draft saved successfully!");
      }
    } catch (error) {
      console.error(error);

      alert(
        error.response?.data?.message ||
          error.message ||
          "Failed to save draft."
      );
    } finally {
      setSaving(false);
    }
  };

  // Submit article
  const handleSubmit = async () => {
    if (!validateArticle()) return;

    try {
      setSaving(true);

      const data = getArticleData();

      let id = articleId;

      if (!id) {
        const response =
          await createArticle(data);

        const article =
          response?.article || response;

        if (!article?._id) {
          throw new Error(
            "Article ID was not returned."
          );
        }

        id = article._id;

        setArticleId(id);
      } else {
        await updateArticle(id, data);
      }

      await submitArticle(id);

      alert(
        "Article submitted for review!"
      );

      navigate("/profile");
    } catch (error) {
      console.error(error);

      alert(
        error.response?.data?.message ||
          error.message ||
          "Failed to submit article for review."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loadingUser || loadingArticle) {
    return (
      <div className="article-editor-page">
        <div className="loading-message">
          {loadingUser
            ? "Loading user..."
            : "Loading article..."}
        </div>
      </div>
    );
  }

  return (
    <div className="article-editor-page">
      <main className="editor-container">

        {/* HEADER */}

        <div className="editor-heading">
          <div>
            <h1>
              {editId
                ? "Edit Article"
                : "New Article"}
            </h1>

            <p>
              Write your article and add a quiz
              before submitting for review.
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

        {/* TITLE */}

        <section className="editor-card title-card">
          <label htmlFor="article-title">
            Title
          </label>

          <input
            id="article-title"
            value={title}
            onChange={(e) =>
              setTitle(e.target.value)
            }
            placeholder="Enter your article title..."
          />
        </section>

        {/* ARTICLE DETAILS */}

        <section className="editor-card">

          <div className="details-row">

            <div className="field-group">
              <label htmlFor="article-category">
                Category
              </label>

              <select
                id="article-category"
                value={category}
                onChange={(e) =>
                  setCategory(e.target.value)
                }
              >
                {categories.map((item) => (
                  <option
                    key={item}
                    value={item}
                  >
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div className="field-group">
              <label htmlFor="article-tags">
                Tags (comma separated)
              </label>

              <input
                id="article-tags"
                value={tags}
                onChange={(e) =>
                  setTags(e.target.value)
                }
                placeholder="AI, education, technology"
              />
            </div>

          </div>

          <div className="field-group content-group">
            <label htmlFor="article-content">
              Content
            </label>

            <textarea
              id="article-content"
              value={content}
              onChange={(e) =>
                setContent(e.target.value)
              }
              placeholder="Write your article here..."
            />
          </div>

        </section>

        {/* QUIZ TOGGLE */}

        <section className="editor-card quiz-toggle-card">

          <div className="quiz-toggle-content">

            <h3>Add a Quiz</h3>

            <p>
              Automatically generate quiz
              questions according to your
              article topic.
            </p>

          </div>

          <button
            className={`toggle ${
              quizEnabled
                ? "toggle-on"
                : ""
            }`}
            onClick={toggleQuiz}
            type="button"
            aria-label="Toggle quiz"
            aria-pressed={quizEnabled}
          >
            <span />
          </button>

        </section>

        {/* QUIZ BUILDER */}

        {quizEnabled && (
          <section className="editor-card quiz-builder">

            <div className="quiz-builder-header">

              <div>
                <h2>
                  Quiz Builder
                </h2>

                <p className="quiz-description">
                  Generate questions automatically
                  or edit them manually.
                </p>
              </div>

              {/* GENERATE BUTTON */}

              <button
                type="button"
                className="generate-quiz-button"
                onClick={handleGenerateQuiz}
                disabled={
                  generatingQuiz ||
                  !title.trim() ||
                  !content.trim()
                }
              >
                {generatingQuiz
                  ? "Generating..."
                  : "✨ Generate Quiz"}
              </button>

            </div>

            {/* QUESTIONS */}

            {quizQuestions.map(
              (q, qi) => (
                <div
                  className="question-box"
                  key={qi}
                >

                  <div className="question-header">

                    <label>
                      Question {qi + 1}
                    </label>

                    {quizQuestions.length >
                      1 && (
                      <button
                        type="button"
                        className="remove-question"
                        onClick={() =>
                          removeQuestion(qi)
                        }
                      >
                        Remove
                      </button>
                    )}

                  </div>

                  <input
                    value={q.question}
                    onChange={(e) =>
                      updateQuestion(
                        qi,
                        e.target.value
                      )
                    }
                    placeholder="Enter your question..."
                  />

                  <div className="options-grid">

                    {q.options.map(
                      (option, oi) => (
                        <input
                          key={oi}
                          value={option}
                          onChange={(e) =>
                            updateOption(
                              qi,
                              oi,
                              e.target.value
                            )
                          }
                          placeholder={`Option ${String.fromCharCode(
                            65 + oi
                          )}`}
                        />
                      )
                    )}

                  </div>

                  <label className="answer-label">
                    Correct Answer
                  </label>

                  <select
                    value={
                      q.correctAnswer
                    }
                    onChange={(e) =>
                      updateAnswer(
                        qi,
                        e.target.value
                      )
                    }
                  >

                    <option value="">
                      Select correct answer
                    </option>

                    {q.options.map(
                      (option, oi) => (
                        <option
                          key={oi}
                          value={option}
                          disabled={
                            !option.trim()
                          }
                        >
                          Option{" "}
                          {String.fromCharCode(
                            65 + oi
                          )}

                          {option.trim()
                            ? ` — ${option}`
                            : ""}
                        </option>
                      )
                    )}

                  </select>

                </div>
              )
            )}

            {/* ADD QUESTION */}

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

      {/* BOTTOM ACTIONS */}

      <div className="bottom-actions">

        <div className="bottom-actions-inner">

          <button
            className="save-button"
            onClick={handleSaveDraft}
            disabled={saving}
            type="button"
          >
            {saving
              ? "Saving..."
              : "Save Draft"}
          </button>

          <button
            className="submit-button"
            onClick={handleSubmit}
            disabled={
              saving ||
              !title.trim() ||
              !content.trim()
            }
            type="button"
          >

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

    </div>
  );
}

export default ArticleEditor;

