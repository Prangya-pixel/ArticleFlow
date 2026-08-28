import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getArticleById } from "../services/articleAPI";
import "./ArticleView.css";

function ArticleView() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getArticleById(id);

        setArticle(data.article || data);
      } catch (err) {
        console.error("Failed to load article:", err);

        setError(
          err.response?.data?.message ||
            "Failed to load article."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchArticle();
  }, [id]);

  if (loading) {
    return (
      <div className="article-view-page">
        <div className="article-view-message">
          Loading article...
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="article-view-page">
        <div className="article-view-message">
          <h2>Article not found</h2>

          <p>
            {error || "The article could not be loaded."}
          </p>

          <button
            className="back-button"
            onClick={() => navigate("/browse")}
            type="button"
          >
            ← Back
          </button>
        </div>
      </div>
    );
  }

  const words = article.content
    ? article.content.trim().split(/\s+/).length
    : 0;

  const readingTime = Math.max(
    1,
    Math.ceil(words / 200)
  );

  const articleDate = article.createdAt
    ? new Date(article.createdAt).toLocaleDateString(
        "en-US",
        {
          year: "numeric",
          month: "long",
          day: "numeric",
        }
      )
    : "";

  const image =
    article.image ||
    article.coverImage ||
    article.imageUrl ||
    article.thumbnail ||
    null;

  /*
   * Use the first paragraph as a short introduction
   * because our current Article schema doesn't have a
   * separate description field.
   */
  const paragraphs = article.content
    ? article.content
        .split("\n")
        .map((paragraph) => paragraph.trim())
        .filter((paragraph) => paragraph.length > 0)
    : [];

  const description =
    article.description ||
    (paragraphs.length > 0
      ? paragraphs[0]
      : "");

  const bodyParagraphs =
    paragraphs.length > 1
      ? paragraphs.slice(1)
      : paragraphs;

  const hasQuiz =
    article.quizEnabled &&
    article.quiz?.questions?.length > 0;

  const questionCount = hasQuiz
    ? article.quiz.questions.length
    : 0;

  return (
    <div className="article-view-page">

      <main className="article-view-container">

        {/* Back */}
        <button
          className="back-button"
          onClick={() => navigate("/browse")}
          type="button"
        >
          ← Back
        </button>

        {/* Metadata */}
        <div className="article-view-meta">

          <span className="article-category">
            {article.category?.toUpperCase()}
          </span>

          <span>
            •
          </span>

          <span>
            {readingTime} min read
          </span>

          <span>
            •
          </span>

          <span>
            {articleDate}
          </span>

        </div>

        {/* Title */}
        <h1 className="article-view-title">
          {article.title}
        </h1>

        {/* Description */}
        {description && (
          <p className="article-view-description">
            {description}
          </p>
        )}

        {/* Author row */}
        <div className="article-view-author">

          <div className="article-author-left">

            <div className="article-author-avatar">
              PM
            </div>

            <div className="author-details">

              <strong>
                {article.author?.name ||
                  "Priya Mehta"}
              </strong>

              <p>
                Science communicator and molecular
                biologist. Writing about the invisible
                world.
              </p>

            </div>

          </div>

          <div className="article-stats">

            <span>
              ◉ {Number(article.views || 0).toLocaleString()}
            </span>

            <span>
              ♡ {Number(article.likes || 0).toLocaleString()}
            </span>

          </div>

        </div>

        {/* Article Image */}
        {image && (
          <div className="article-view-image">

            <img
              src={image}
              alt={article.title}
            />

          </div>
        )}

        {/* Article Body */}
        <div className="article-view-content">

          {bodyParagraphs.map(
            (paragraph, index) => (
              <p key={index}>
                {paragraph}
              </p>
            )
          )}

        </div>

        {/* Tags */}
        {article.tags?.length > 0 && (
          <div className="article-view-tags">

            {article.tags.map((tag, index) => (
              <span key={index}>
                #{tag}
              </span>
            ))}

          </div>
        )}

        {/* Quiz */}
        {hasQuiz && (
          <section className="article-quiz-card">

            <div className="quiz-question-icon">
              ?
            </div>

            <h2>
              Test Your Understanding
            </h2>

            <p className="quiz-article-name">
              {article.title} — {questionCount}{" "}
              {questionCount === 1
                ? "question"
                : "questions"}
            </p>

            <button
              className="take-quiz-button"
              onClick={() =>
                navigate(
                  `/articles/${article._id}/quiz`
                )
              }
              type="button"
            >
              Take the Quiz
            </button>

          </section>
        )}

      </main>

    </div>
  );
}

export default ArticleView;