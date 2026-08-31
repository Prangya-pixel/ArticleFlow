import { useEffect, useState } from 'react';

import {
    getApprovedArticles,
    publishArticle,
    unpublishArticle,
    getApprovedQuizzes,
    getDisabledQuizzes,
    getArticleQuiz,
    updateArticleQuiz,
    deleteArticleQuiz,
    enableArticleQuiz,
    getCategories,
    getTags,
} from './contentManagementApi.js';

import './contentManagement.css';

export default function ContentManagementModule({ user, onLogout }) {
    const [activeTab, setActiveTab] = useState('articles');
    const [quizView, setQuizView] = useState('active');
    const [articles, setArticles] = useState([]);
    const [quizzes, setQuizzes] = useState([]);
    const [disabledQuizzes, setDisabledQuizzes] = useState([]);
    const [categories, setCategories] = useState([]);
    const [tags, setTags] = useState([]);

    const [selectedQuiz, setSelectedQuiz] = useState(null);
    const [questions, setQuestions] = useState([]);

    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        loadContent();
    }, []);

    async function loadContent() {
        setLoading(true);
        setError('');

        try {
            const [
                articlesData,
                quizzesData,
                disabledQuizzesData,
                categoriesData,
                tagsData,
              ] = await Promise.all([
                getApprovedArticles(),
                getApprovedQuizzes(),
                getDisabledQuizzes(),
                getCategories(),
                getTags(),
              ]);

            setArticles(articlesData.articles || []);
            setQuizzes(quizzesData.quizzes || []);
            setDisabledQuizzes(disabledQuizzesData.quizzes || []);
            setCategories(categoriesData.categories || []);
            setTags(tagsData.tags || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    async function handlePublish(articleId) {
        try {
            setMessage('');
            setError('');

            await publishArticle(articleId);

            setMessage('Article published successfully.');
            await loadContent();
        } catch (err) {
            setError(err.message);
        }
    }

    async function handleUnpublish(articleId) {
        try {
            setMessage('');
            setError('');

            await unpublishArticle(articleId);

            setMessage('Article unpublished successfully.');
            await loadContent();
        } catch (err) {
            setError(err.message);
        }
    }

    async function openQuiz(articleId) {
        try {
            setMessage('');
            setError('');

            const data = await getArticleQuiz(articleId);

            setSelectedQuiz(data.article);
            setQuestions(data.quiz?.questions || []);
        } catch (err) {
            setError(err.message);
        }
    }

    function closeQuiz() {
        setSelectedQuiz(null);
        setQuestions([]);
    }

    function updateQuestion(index, field, value) {
        setQuestions((currentQuestions) =>
            currentQuestions.map((question, questionIndex) =>
                questionIndex === index
                    ? {
                        ...question,
                        [field]: value,
                    }
                    : question
            )
        );
    }

    function updateOption(questionIndex, optionIndex, value) {
        setQuestions((currentQuestions) =>
            currentQuestions.map((question, index) => {
                if (index !== questionIndex) return question;

                const updatedOptions = [...question.options];
                updatedOptions[optionIndex] = value;

                return {
                    ...question,
                    options: updatedOptions,
                };
            })
        );
    }

    function addQuestion() {
        setQuestions((currentQuestions) => [
            ...currentQuestions,
            {
                question: '',
                options: ['', '', '', ''],
                correctAnswer: '',
            },
        ]);
    }

    function removeQuestion(index) {
        setQuestions((currentQuestions) =>
            currentQuestions.filter(
                (_, questionIndex) => questionIndex !== index
            )
        );
    }

    async function saveQuiz() {
        if (!selectedQuiz) return;

        try {
            setMessage('');
            setError('');

            await updateArticleQuiz(
                selectedQuiz._id,
                questions
            );

            setMessage('Quiz updated successfully.');

            await loadContent();
            closeQuiz();
        } catch (err) {
            setError(err.message);
        }
    }

    async function handleDeleteQuiz(articleId) {
        const confirmed = window.confirm(
            'Are you sure you want to disable this quiz?'
        );

        if (!confirmed) return;

        try {
            setMessage('');
            setError('');

            await deleteArticleQuiz(articleId);

            setMessage('Quiz disabled successfully.');

            await loadContent();

            if (selectedQuiz?._id === articleId) {
                closeQuiz();
            }
        } catch (err) {
            setError(err.message);
        }
    }
    async function handleEnableQuiz(articleId) {
        try {
            setMessage('');
            setError('');

            await enableArticleQuiz(articleId);

            setMessage('Quiz enabled successfully.');

            await loadContent();
        } catch (err) {
            setError(err.message);
        }
    }

    if (loading) {
        return (
            <main className="content-page">
                <div className="content-loading">
                    Loading content management...
                </div>
            </main>
        );
    }

    return (
        <main className="content-page">
            <header className="content-header">
                <div>
                    <p className="content-eyebrow">
                        ARTICLEFLOW ADMIN
                    </p>

                    <h1>Content Management</h1>

                    <p className="content-subtitle">
                        Manage approved articles, quizzes, categories
                        and tags.
                    </p>
                </div>

                <div className="admin-info">
                    <span>
                        {user?.name || 'Admin'}
                    </span>

                    <button
                        className="logout-button"
                        onClick={onLogout}
                    >
                        Sign out
                    </button>
                </div>
            </header>

            {message && (
                <div className="success-message">
                    {message}
                </div>
            )}

            {error && (
                <div className="error-message">
                    {error}
                </div>
            )}

            <nav className="content-tabs">
                <button
                    className={
                        activeTab === 'articles'
                            ? 'active'
                            : ''
                    }
                    onClick={() => setActiveTab('articles')}
                >
                    Approved Articles
                </button>

                <button
                    className={
                        activeTab === 'quizzes'
                            ? 'active'
                            : ''
                    }
                    onClick={() => setActiveTab('quizzes')}
                >
                    Approved Quizzes
                </button>

                <button
                    className={
                        activeTab === 'categories'
                            ? 'active'
                            : ''
                    }
                    onClick={() => setActiveTab('categories')}
                >
                    Categories
                </button>

                <button
                    className={
                        activeTab === 'tags'
                            ? 'active'
                            : ''
                    }
                    onClick={() => setActiveTab('tags')}
                >
                    Tags
                </button>
            </nav>

            <section className="content-card">
                {activeTab === 'articles' && (
                    <>
                        <div className="section-heading">
                            <div>
                                <h2>Approved Articles</h2>
                                <p>
                                    Manage articles that have been approved
                                    for publishing.
                                </p>
                            </div>

                            <span className="count-badge">
                                {articles.length}
                            </span>
                        </div>

                        {articles.length === 0 ? (
                            <div className="empty-state">
                                No approved articles found.
                            </div>
                        ) : (
                            <div className="article-list">
                                {articles.map((article) => (
                                    <article
                                        className="article-item"
                                        key={article._id}
                                    >
                                        <div className="article-main">
                                            <div>
                                                <h3>{article.title}</h3>

                                                <p className="article-meta">
                                                    Category:{' '}
                                                    {article.category?.name ||
                                                        'Uncategorized'}
                                                </p>

                                                <p className="article-meta">
                                                    Author:{' '}
                                                    {article.author?.name ||
                                                        'Unknown'}
                                                </p>
                                            </div>

                                            <span
                                                className={`status-badge ${article.status.toLowerCase()}`}
                                            >
                                                {article.status}
                                            </span>
                                        </div>

                                        <p className="article-preview">
                                            {article.content?.slice(0, 180)}
                                            {article.content?.length > 180
                                                ? '...'
                                                : ''}
                                        </p>

                                        <div className="article-actions">
                                            {article.status === 'Approved' && (
                                                <button
                                                    className="primary-button"
                                                    onClick={() =>
                                                        handlePublish(article._id)
                                                    }
                                                >
                                                    Publish
                                                </button>
                                            )}

                                            {article.status === 'Published' && (
                                                <button
                                                    className="secondary-button"
                                                    onClick={() =>
                                                        handleUnpublish(article._id)
                                                    }
                                                >
                                                    Unpublish
                                                </button>
                                            )}
                                        </div>
                                    </article>
                                ))}
                            </div>
                        )}
                    </>
                )}

                {activeTab === 'quizzes' && (
                    <>
                        <div className="section-heading">
                            <div>
                                <h2>Quiz Management</h2>
                                <p>
                                    Manage active and disabled quizzes attached
                                    to approved articles.
                                </p>
                            </div>

                            <span className="count-badge">
                                {quizzes.length + disabledQuizzes.length}
                            </span>
                        </div>

                        {/* ACTIVE QUIZZES */}

                        <div className="quiz-section">
                            <div className="quiz-section-heading">
                                <div>
                                    <h3>Active Quizzes</h3>
                                    <p>
                                        Quizzes currently enabled for readers.
                                    </p>
                                </div>

                                <span className="count-badge">
                                    {quizzes.length}
                                </span>
                            </div>

                            {quizzes.length === 0 ? (
                                <div className="empty-state">
                                    No active quizzes found.
                                </div>
                            ) : (
                                <div className="quiz-list">
                                    {quizzes.map((article) => (
                                        <article
                                            className="quiz-item"
                                            key={article._id}
                                        >
                                            <div>
                                                <h3>{article.title}</h3>

                                                <p className="article-meta">
                                                    {article.quiz?.questions?.length || 0}{' '}
                                                    question(s)
                                                </p>

                                                <span className="quiz-status active-label">
                                                    Enabled
                                                </span>
                                            </div>

                                            <div className="quiz-actions">
                                                <button
                                                    className="primary-button"
                                                    onClick={() =>
                                                        openQuiz(article._id)
                                                    }
                                                >
                                                    Manage Quiz
                                                </button>

                                                <button
                                                    className="danger-button"
                                                    onClick={() =>
                                                        handleDeleteQuiz(article._id)
                                                    }
                                                >
                                                    Disable
                                                </button>
                                            </div>
                                        </article>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* DISABLED QUIZZES */}

                        <div className="quiz-section disabled-quiz-section">
                            <div className="quiz-section-heading">
                                <div>
                                    <h3>Disabled Quizzes</h3>
                                    <p>
                                        Quizzes that are disabled but still have
                                        their questions saved.
                                    </p>
                                </div>

                                <span className="count-badge">
                                    {disabledQuizzes.length}
                                </span>
                            </div>

                            {disabledQuizzes.length === 0 ? (
                                <div className="empty-state">
                                    No disabled quizzes found.
                                </div>
                            ) : (
                                <div className="quiz-list">
                                    {disabledQuizzes.map((article) => (
                                        <article
                                            className="quiz-item"
                                            key={article._id}
                                        >
                                            <div>
                                                <h3>{article.title}</h3>

                                                <p className="article-meta">
                                                    {article.quiz?.questions?.length || 0}{' '}
                                                    question(s)
                                                </p>

                                                <span className="quiz-status inactive-label">
                                                    Disabled
                                                </span>
                                            </div>

                                            <div className="quiz-actions">
                                                <button
                                                    className="secondary-button"
                                                    onClick={() =>
                                                        openQuiz(article._id)
                                                    }
                                                >
                                                    Manage Quiz
                                                </button>

                                                <button
                                                    className="primary-button"
                                                    onClick={() =>
                                                        handleEnableQuiz(article._id)
                                                    }
                                                >
                                                    Enable
                                                </button>
                                            </div>
                                        </article>
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                )}

                {activeTab === 'categories' && (
                    <>
                        <div className="section-heading">
                            <div>
                                <h2>Categories</h2>
                                <p>
                                    Categories currently available for
                                    article organization.
                                </p>
                            </div>

                            <span className="count-badge">
                                {categories.length}
                            </span>
                        </div>

                        <div className="simple-list">
                            {categories.map((category) => (
                                <div
                                    className="simple-list-item"
                                    key={category._id}
                                >
                                    <div>
                                        <strong>{category.name}</strong>
                                        <p>
                                            {category.description ||
                                                'No description'}
                                        </p>
                                    </div>

                                    <span
                                        className={
                                            category.isActive
                                                ? 'active-label'
                                                : 'inactive-label'
                                        }
                                    >
                                        {category.isActive
                                            ? 'Active'
                                            : 'Inactive'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {activeTab === 'tags' && (
                    <>
                        <div className="section-heading">
                            <div>
                                <h2>Tags</h2>
                                <p>
                                    Tags currently available for article
                                    organization and filtering.
                                </p>
                            </div>

                            <span className="count-badge">
                                {tags.length}
                            </span>
                        </div>

                        <div className="tag-container">
                            {tags.map((tag) => (
                                <div
                                    className="tag-card"
                                    key={tag._id}
                                >
                                    <strong>{tag.name}</strong>

                                    <p>
                                        {tag.description ||
                                            'No description'}
                                    </p>

                                    <span
                                        className={
                                            tag.isActive
                                                ? 'active-label'
                                                : 'inactive-label'
                                        }
                                    >
                                        {tag.isActive
                                            ? 'Active'
                                            : 'Inactive'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </section>

            {selectedQuiz && (
                <div className="quiz-modal-backdrop">
                    <div className="quiz-modal">
                        <div className="quiz-modal-header">
                            <div>
                                <p className="content-eyebrow">
                                    QUIZ MANAGEMENT
                                </p>

                                <h2>{selectedQuiz.title}</h2>
                            </div>

                            <button
                                className="close-button"
                                onClick={closeQuiz}
                            >
                                ×
                            </button>
                        </div>

                        <div className="question-list">
                            {questions.map((question, questionIndex) => (
                                <div
                                    className="question-card"
                                    key={
                                        question._id ||
                                        `question-${questionIndex}`
                                    }
                                >
                                    <div className="question-header">
                                        <h3>
                                            Question {questionIndex + 1}
                                        </h3>

                                        <button
                                            className="remove-question"
                                            onClick={() =>
                                                removeQuestion(questionIndex)
                                            }
                                        >
                                            Remove
                                        </button>
                                    </div>

                                    <label>
                                        Question
                                        <input
                                            value={question.question}
                                            onChange={(event) =>
                                                updateQuestion(
                                                    questionIndex,
                                                    'question',
                                                    event.target.value
                                                )
                                            }
                                        />
                                    </label>

                                    <div className="options-grid">
                                        {question.options.map(
                                            (option, optionIndex) => (
                                                <label key={optionIndex}>
                                                    Option {optionIndex + 1}
                                                    <input
                                                        value={option}
                                                        onChange={(event) =>
                                                            updateOption(
                                                                questionIndex,
                                                                optionIndex,
                                                                event.target.value
                                                            )
                                                        }
                                                    />
                                                </label>
                                            )
                                        )}
                                    </div>

                                    <label>
                                        Correct Answer
                                        <select
                                            value={question.correctAnswer}
                                            onChange={(event) =>
                                                updateQuestion(
                                                    questionIndex,
                                                    'correctAnswer',
                                                    event.target.value
                                                )
                                            }
                                        >
                                            <option value="">
                                                Select correct answer
                                            </option>

                                            {question.options.map(
                                                (option, optionIndex) => (
                                                    <option
                                                        key={optionIndex}
                                                        value={option}
                                                    >
                                                        {option}
                                                    </option>
                                                )
                                            )}
                                        </select>
                                    </label>
                                </div>
                            ))}
                        </div>

                        <div className="quiz-modal-actions">
                            <button
                                className="secondary-button"
                                onClick={addQuestion}
                            >
                                + Add Question
                            </button>

                            <div>
                                <button
                                    className="secondary-button"
                                    onClick={closeQuiz}
                                >
                                    Cancel
                                </button>

                                <button
                                    className="primary-button"
                                    onClick={saveQuiz}
                                >
                                    Save Quiz
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}