import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getArticles,
  deleteArticle,
} from "../services/articleAPI";
import "./MyArticles.css";

function MyArticles() {
  const navigate = useNavigate();

  const [articles, setArticles] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // --------------------------------------------------
  // Load selected/logged-in user
  // --------------------------------------------------
  useEffect(() => {
    const savedUser =
      localStorage.getItem("currentUser");

    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch (error) {
        console.error(
          "Invalid currentUser:",
          error
        );
      }
    }
  }, []);

  // --------------------------------------------------
  // Fetch current user's articles
  // --------------------------------------------------
  const fetchArticles = async () => {
    if (!currentUser?._id) {
      setArticles([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const data = await getArticles();

      const myArticles = data.filter((article) => {
        const articleAuthorId =
          typeof article.author === "object"
            ? article.author?._id
            : article.author;

        return articleAuthorId === currentUser._id;
      });

      setArticles(myArticles);
    } catch (error) {
      console.error(
        "Failed to fetch articles:",
        error
      );

      alert("Failed to load your articles.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, [currentUser]);

  // --------------------------------------------------
  // Status class
  // --------------------------------------------------
  const getStatusClass = (status) => {
    switch (status) {
      case "Draft":
        return "status-draft";

      case "Pending":
      case "Pending Review":
        return "status-pending";

      case "Approved":
      case "Published":
        return "status-published";

      case "Rejected":
        return "status-rejected";

      case "Changes Requested":
        return "status-changes";

      default:
        return "";
    }
  };

  // --------------------------------------------------
  // Status text
  // --------------------------------------------------
  const getStatusText = (status) => {
    return status === "Pending"
      ? "Pending Review"
      : status;
  };

  // --------------------------------------------------
  // Reading time
  // --------------------------------------------------
  const getReadingTime = (article) => {
    if (article.readingTime) {
      return article.readingTime;
    }

    if (!article.content) {
      return "1 min";
    }

    const words =
      article.content.trim().split(/\s+/).length;

    return `${Math.max(
      1,
      Math.ceil(words / 200)
    )} min`;
  };

  // --------------------------------------------------
  // Article image
  // --------------------------------------------------
  const getArticleImage = (article) => {
    return (
      article.image ||
      article.imageUrl ||
      article.coverImage ||
      article.thumbnail ||
      null
    );
  };

  // --------------------------------------------------
  // Delete
  // --------------------------------------------------
  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this article?"
    );

    if (!confirmDelete) {
      return;
    }

    try {
      await deleteArticle(id);

      alert("Article deleted successfully!");

      await fetchArticles();
    } catch (error) {
      console.error(
        "Delete article error:",
        error
      );

      alert(
        error.response?.data?.message ||
          "Failed to delete article."
      );
    }
  };

  // --------------------------------------------------
  // Read published article
  // --------------------------------------------------
  const handleReadArticle = (id) => {
    navigate(`/articles/${id}`);
  };

  // --------------------------------------------------
  // Edit draft
  // --------------------------------------------------
  const handleEditArticle = (id) => {
    navigate(`/write?edit=${id}`);
  };

  // --------------------------------------------------
  // User loading
  // --------------------------------------------------
  if (!currentUser) {
    return (
      <div className="my-articles-page">
        <div className="articles-message">
          Loading user...
        </div>
      </div>
    );
  }

  return (
    <div className="my-articles-page">

      {/* Header */}
      <div className="my-articles-header">

        <div>
          <h1>My Articles</h1>

          <p>
            Manage your articles and track their
            review status.
          </p>
        </div>

        {currentUser.role === "author" && (
          <button
            className="write-button"
            onClick={() => navigate("/write")}
            type="button"
          >
            + Write New Article
          </button>
        )}

      </div>

      {/* Loading */}
      {loading && (
        <div className="articles-message">
          Loading your articles...
        </div>
      )}

      {/* No Articles */}
      {!loading && articles.length === 0 && (
        <div className="articles-message">

          <h2>No articles yet</h2>

          <p>
            {currentUser.role === "author"
              ? "Start writing your first article."
              : "This user has no articles yet."}
          </p>

          {currentUser.role === "author" && (
            <button
              className="write-button"
              onClick={() =>
                navigate("/write")
              }
              type="button"
            >
              Write an Article
            </button>
          )}

        </div>
      )}

      {/* Articles */}
      {!loading && articles.length > 0 && (
        <div className="articles-list">

          {articles.map((article) => {

            const image =
              getArticleImage(article);

            return (
              <div
                className="article-list-card"
                key={article._id}
              >

                {/* Left */}
                <div className="article-main">

                  {/* Thumbnail */}
                  <div className="article-thumbnail">

                    {image ? (
                      <img
                        src={image}
                        alt={article.title}
                      />
                    ) : (
                      <div className="thumbnail-placeholder">
                        {article.title
                          ?.charAt(0)
                          .toUpperCase()}
                      </div>
                    )}

                  </div>

                  {/* Info */}
                  <div className="article-info">

                    <div className="article-title-row">

                      <h2>
                        {article.title}
                      </h2>

                      <span
                        className={`status-badge ${getStatusClass(
                          article.status
                        )}`}
                      >
                        {getStatusText(
                          article.status
                        )}
                      </span>

                    </div>

                    <div className="article-meta">

                      <span>
                        {article.category}
                      </span>

                      <span>•</span>

                      <span>
                        {getReadingTime(article)}
                      </span>

                      {article.status ===
                        "Published" && (
                        <>
                          <span>•</span>

                          <span>
                            ◉{" "}
                            {Number(
                              article.views || 0
                            ).toLocaleString()}
                          </span>

                          <span>
                            ♡{" "}
                            {Number(
                              article.likes || 0
                            ).toLocaleString()}
                          </span>
                        </>
                      )}

                    </div>

                  </div>

                </div>

                {/* Actions */}
                <div className="article-actions">

                  {/* Published → Eye */}
                  {article.status ===
                    "Published" && (
                    <button
                      className="icon-button"
                      title="Read Article"
                      onClick={() =>
                        handleReadArticle(
                          article._id
                        )
                      }
                      type="button"
                    >
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12z" />
                        <circle
                          cx="12"
                          cy="12"
                          r="2.5"
                        />
                      </svg>
                    </button>
                  )}

                  {/* Draft → Pencil */}
                  {article.status === "Draft" && (
                    <button
                      className="icon-button edit-icon"
                      title="Edit Article"
                      onClick={() =>
                        handleEditArticle(
                          article._id
                        )
                      }
                      type="button"
                    >
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M12 20h9" />
                        <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
                      </svg>
                    </button>
                  )}

                  {/* Pending → no icon */}

                  {/* Delete remains available here */}
                  {(article.status === "Draft" ||
                    article.status ===
                      "Rejected" ||
                    article.status ===
                      "Changes Requested") && (
                    <button
                      className="delete-button"
                      title="Delete Article"
                      onClick={() =>
                        handleDelete(
                          article._id
                        )
                      }
                      type="button"
                    >
                      Delete
                    </button>
                  )}

                </div>

              </div>
            );
          })}

        </div>
      )}

    </div>
  );
}

export default MyArticles;