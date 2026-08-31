const API_BASE_URL = 'http://localhost:5000/api';

const getHeaders = () => {
  const token = localStorage.getItem('articleflow_token');

  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

async function request(endpoint, options = {}) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      ...getHeaders(),
      ...(options.headers || {}),
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Something went wrong.');
  }

  return data;
}

// ======================================================
// APPROVED ARTICLES
// ======================================================

export function getApprovedArticles() {
  return request('/articles/approved');
}

// ======================================================
// ARTICLE DETAILS
// ======================================================

export function getArticleById(id) {
  return request(`/articles/${id}`);
}

// ======================================================
// PUBLISH / UNPUBLISH
// ======================================================

export function publishArticle(id) {
  return request(`/articles/${id}/publish`, {
    method: 'PUT',
  });
}

export function unpublishArticle(id) {
  return request(`/articles/${id}/unpublish`, {
    method: 'PUT',
  });
}

// ======================================================
// APPROVED QUIZZES
// ======================================================

export function getApprovedQuizzes() {
  return request('/articles/quizzes');
}

// ======================================================
// GET ONE ARTICLE QUIZ
// ======================================================

export function getArticleQuiz(id) {
  return request(`/articles/${id}/quiz`);
}

// ======================================================
// UPDATE QUIZ
// ======================================================

export function updateArticleQuiz(id, questions) {
  return request(`/articles/${id}/quiz`, {
    method: 'PUT',
    body: JSON.stringify({
      questions,
    }),
  });
}

// ======================================================
// DELETE / DISABLE QUIZ
// ======================================================

export function deleteArticleQuiz(id) {
  return request(`/articles/${id}/quiz`, {
    method: 'DELETE',
  });
}
// ======================================================
// ENABLE QUIZ
// ======================================================

export function enableArticleQuiz(id) {
    return request(`/articles/${id}/quiz/enable`, {
      method: 'PUT',
    });
  }

// ======================================================
// CATEGORIES
// ======================================================

export function getCategories() {
  return request('/categories');
}

export function createCategory(name, description = '') {
  return request('/categories', {
    method: 'POST',
    body: JSON.stringify({
      name,
      description,
    }),
  });
}

export function updateCategory(id, data) {
  return request(`/categories/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export function deleteCategory(id) {
  return request(`/categories/${id}`, {
    method: 'DELETE',
  });
}

// ======================================================
// TAGS
// ======================================================

export function getTags() {
  return request('/tags');
}

export function createTag(name, description = '') {
  return request('/tags', {
    method: 'POST',
    body: JSON.stringify({
      name,
      description,
    }),
  });
}

export function updateTag(id, data) {
  return request(`/tags/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export function deleteTag(id) {
  return request(`/tags/${id}`, {
    method: 'DELETE',
  });
}

  // ======================================================
// DISABLED QUIZZES
// ======================================================

export function getDisabledQuizzes() {
    return request('/articles/quizzes/disabled');
  }