import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getArticles } from "../services/articleAPI";
import "./Profile.css";

function Profile() {
  const navigate = useNavigate();

  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  // --------------------------------------------------
  // Load selected/logged-in user
  // --------------------------------------------------
  useEffect(() => {
    const savedUser = localStorage.getItem("currentUser");

    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch (error) {
        console.error("Invalid currentUser:", error);
      }
    }
  }, []);

  // --------------------------------------------------
  // Fetch articles for current user
  // --------------------------------------------------
  useEffect(() => {
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
          "Failed to load profile articles:",
          error
        );
      } finally {
        setLoading(false);
      }
    };

    fetchArticles();
  }, [currentUser]);

  // --------------------------------------------------
  // Statistics
  // --------------------------------------------------
  const totalArticles = articles.length;

  const publishedArticles = articles.filter(
    (article) => article.status === "Published"
  ).length;

  const totalViews = articles.reduce(
    (total, article) =>
      total + (Number(article.views) || 0),
    0
  );

  const totalLikes = articles.reduce(
    (total, article) =>
      total + (Number(article.likes) || 0),
    0
  );

  // --------------------------------------------------
  // Status class
  // --------------------------------------------------
  const getStatusClass = (status) => {
    switch (status) {
      case "Published":
        return "published";

      case "Pending":
        return "pending";

      case "Draft":
        return "draft";

      case "Rejected":
        return "rejected";

      case "Changes Requested":
        return "changes";

      default:
        return "draft";
    }
  };

  // --------------------------------------------------
  // Reading time
  // --------------------------------------------------
  const getReadingTime = (content) => {
    const words = content
      ? content.trim().split(/\s+/).length
      : 0;

    return Math.max(1, Math.ceil(words / 200));
  };

  // --------------------------------------------------
  // Read published article
  // --------------------------------------------------
  const handleReadArticle = (id) => {
    navigate(`/articles/${id}`);
  };

  // --------------------------------------------------
  // Edit draft/rejected/changes requested article
  // --------------------------------------------------
  const handleEditArticle = (id) => {
    navigate(`/write?edit=${id}`);
  };

  // --------------------------------------------------
  // Loading user
  // --------------------------------------------------
  if (!currentUser) {
    return (
      <div className="profile-page">
        <p className="profile-message">
          Loading profile...
        </p>
      </div>
    );
  }

  return (
    <div className="profile-page">

      {/* Profile Card */}
      <section className="profile-card">

        <div className="profile-avatar">
          {currentUser.name
            ?.split(" ")
            .map((word) => word[0])
            .join("")
            .slice(0, 2)
            .toUpperCase()}
        </div>

        <div className="profile-info">

          <h1>{currentUser.name}</h1>

          <p>
            {currentUser.role === "author"
              ? "Content author on Lumen."
              : `${currentUser.role} account on Lumen.`}
          </p>

          <div className="profile-stats">

            <div className="stat">
              <strong>{totalArticles}</strong>
              <span>Articles</span>
            </div>

            <div className="stat">
              <strong>{publishedArticles}</strong>
              <span>Published</span>
            </div>

            <div className="stat">
              <strong>
                {totalViews.toLocaleString()}
              </strong>
              <span>Total Views</span>
            </div>

            <div className="stat">
              <strong>
                {totalLikes.toLocaleString()}
              </strong>
              <span>Total Likes</span>
            </div>

          </div>

        </div>

      </section>

      {/* My Articles */}
      <section className="profile-articles">

        <h2>My Articles</h2>

        {loading ? (
          <p className="profile-message">
            Loading articles...
          </p>
        ) : articles.length === 0 ? (
          <p className="profile-message">
            No articles yet.
          </p>
        ) : (
          <div className="profile-articles-list">

            {articles.map((article) => (

              <div
                className="profile-article-card"
                key={article._id}
              >

                {/* Image */}
                <div className="profile-article-image">

                  {article.image ? (
                    <img
                      src={article.image}
                      alt={article.title}
                    />
                  ) : (
                    <div className="article-image-placeholder">
                      {article.title
                        ?.charAt(0)
                        .toUpperCase()}
                    </div>
                  )}

                </div>

                {/* Article Information */}
                <div className="profile-article-info">

                  <div className="article-title-row">

                    <h3>{article.title}</h3>

                    <span
                      className={`profile-status ${getStatusClass(
                        article.status
                      )}`}
                    >
                      {article.status === "Pending"
                        ? "Pending Review"
                        : article.status}
                    </span>

                  </div>

                  <div className="profile-article-meta">

                    <span>
                      {article.category}
                    </span>

                    <span>•</span>

                    <span>
                      {getReadingTime(article.content)} min
                    </span>

                    {article.status ===
                      "Published" &&
                      Number(article.views) > 0 && (
                        <>
                          <span>•</span>

                          <span>
                            ◉{" "}
                            {Number(
                              article.views
                            ).toLocaleString()}
                          </span>
                        </>
                      )}

                    {article.status ===
                      "Published" &&
                      Number(article.likes) > 0 && (
                        <span>
                          ♡{" "}
                          {Number(
                            article.likes
                          ).toLocaleString()}
                        </span>
                      )}

                  </div>

                </div>

                {/* Actions */}
                <div className="profile-article-action">

                  {/* Published → Eye */}
                  {article.status ===
                    "Published" && (
                    <button
                      className="article-icon"
                      onClick={() =>
                        handleReadArticle(
                          article._id
                        )
                      }
                      title="Read Article"
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
                      className="article-icon edit-icon"
                      onClick={() =>
                        handleEditArticle(
                          article._id
                        )
                      }
                      title="Edit Article"
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

                </div>

              </div>

            ))}

          </div>
        )}

      </section>

    </div>
  );
}

export default Profile;