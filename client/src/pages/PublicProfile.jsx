import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { userService } from '../services/userService.js';
import '../styles/public-profile.css';

const dummyProfiles = {
  'user-001': {
    user: {
      id: 'user-001',
      name: 'Alex Chen',
      username: 'alex.chen',
      bio: 'Writer, learner and curious mind sharing ideas through stories.',
      profilePhoto: '',
      followersCount: 128,
      followingCount: 86,
      role: 'author',
    },
    articles: [
      {
        id: 'dummy-article-1',
        title: 'The Future of Artificial Intelligence',
        excerpt: 'Exploring how AI is changing the way we learn, work and create.',
        category: 'Technology',
        coverImage: '',
        readMinutes: 5,
        views: 1240,
        likes: 284,
        status: 'Published',
      },
      {
        id: 'dummy-article-2',
        title: 'Why Curiosity Matters',
        excerpt: 'Understanding how curiosity helps us learn and grow.',
        category: 'Science',
        coverImage: '',
        readMinutes: 4,
        views: 860,
        likes: 96,
        status: 'Published',
      },
    ],
  },

  'user-002': {
    user: {
      id: 'user-002',
      name: 'Priya Mehta',
      username: 'priya.mehta',
      bio: 'Content creator passionate about health, education and meaningful conversations.',
      profilePhoto: '',
      followersCount: 245,
      followingCount: 112,
      role: 'author',
    },
    articles: [
      {
        id: 'dummy-article-3',
        title: 'Building Better Daily Habits',
        excerpt: 'Small changes can create meaningful improvements in everyday life.',
        category: 'Health',
        coverImage: '',
        readMinutes: 6,
        views: 1720,
        likes: 214,
        status: 'Published',
      },
    ],
  },

  'user-003': {
    user: {
      id: 'user-003',
      name: 'Rahul Sharma',
      username: 'rahul.sharma',
      bio: 'Technology enthusiast who enjoys explaining complex ideas simply.',
      profilePhoto: '',
      followersCount: 94,
      followingCount: 71,
      role: 'author',
    },
    articles: [
      {
        id: 'dummy-article-4',
        title: 'Understanding Modern Web Development',
        excerpt: 'A simple introduction to how modern web applications work.',
        category: 'Technology',
        coverImage: '',
        readMinutes: 7,
        views: 980,
        likes: 142,
        status: 'Published',
      },
    ],
  },
};

export default function PublicProfile() {
  const { userId } = useParams();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        setError('');

        if (dummyProfiles[userId]) {
          setProfile(dummyProfiles[userId]);
          return;
        }

        const data = await userService.getPublicProfile(userId);
        setProfile(data);
      } catch (err) {
        setProfile(null);
        setError(err.message || 'Unable to load profile.');
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      loadProfile();
    } else {
      setLoading(false);
      setError('Invalid profile.');
    }
  }, [userId]);

  if (loading) {
    return (
      <main className="public-profile-page">
        <div className="profile-message">
          Loading profile...
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="public-profile-page">
        <div className="profile-message error">
          {error}
        </div>
      </main>
    );
  }

  if (!profile?.user) {
    return (
      <main className="public-profile-page">
        <div className="profile-message">
          Profile not found.
        </div>
      </main>
    );
  }

  const { user, articles = [] } = profile;

  return (
    <main className="public-profile-page">
      <div className="public-profile-container">

        <button
          type="button"
          className="profile-back-link"
          onClick={() => window.history.back()}
        >
          ← Back
        </button>

        <section className="public-profile-header">

          <div className="public-profile-photo">
            {user.profilePhoto ? (
              <img
                src={user.profilePhoto}
                alt={user.name}
              />
            ) : (
              <span>
                {user.name?.split(' ').map((name) => name[0]).join('').slice(0, 2).toUpperCase()}
              </span>
            )}
          </div>

          <div className="public-profile-info">

            <h1>{user.name}</h1>

            {user.username && (
              <p className="profile-username">
                @{user.username}
              </p>
            )}

            {user.bio && (
              <p className="profile-bio">
                {user.bio}
              </p>
            )}

            <div className="profile-stats">

              <div className="profile-stat">
                <strong>{articles.length}</strong>
                <span>Articles</span>
              </div>

              <div className="profile-stat">
                <strong>
                  {articles.filter(
                    (article) =>
                      !article.status ||
                      article.status === 'Published'
                  ).length}
                </strong>
                <span>Published</span>
              </div>

              <div className="profile-stat">
                <strong>
                  {articles.reduce(
                    (total, article) => total + (article.views || 0),
                    0
                  ).toLocaleString()}
                </strong>
                <span>Total Views</span>
              </div>

              <div className="profile-stat">
                <strong>
                  {articles.reduce(
                    (total, article) => total + (article.likes || 0),
                    0
                  ).toLocaleString()}
                </strong>
                <span>Total Likes</span>
              </div>

            </div>

          </div>
        </section>

        <section className="published-articles-section">

          <h2>My Articles</h2>

          <div className="public-article-list">

            {articles.length === 0 ? (
              <div className="no-articles">
                No published articles yet.
              </div>
            ) : (
              articles
                .filter(
                  (article) =>
                    !article.status ||
                    article.status === 'Published'
                )
                .map((article) => (
                  <article
                    key={article.id}
                    className="public-article-card"
                  >

                    <div className="article-thumbnail">

                      {article.coverImage ? (
                        <img
                          src={article.coverImage}
                          alt={article.title}
                        />
                      ) : (
                        <div className="article-thumbnail-placeholder">
                          ArticleFlow
                        </div>
                      )}

                    </div>

                    <div className="article-card-content">

                      <div className="article-title-row">

                        <h3>{article.title}</h3>

                        <span className="article-status">
                          Published
                        </span>

                      </div>

                      <div className="article-details">

                        <span>{article.category}</span>

                        <span>•</span>

                        <span>
                          {article.readMinutes || 0} min
                        </span>

                        <span>•</span>

                        <span>
                          ◉ {article.views || 0}
                        </span>

                        <span>♧ {article.likes || 0}</span>

                      </div>

                    </div>

                  </article>
                ))
            )}

          </div>

        </section>

      </div>
    </main>
  );
}