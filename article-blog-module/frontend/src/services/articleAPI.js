import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api",
});

// Create article
export const createArticle = async (articleData) => {
  const response = await API.post("/articles", articleData);
  return response.data;
};

// Get all articles
export const getArticles = async () => {
  const response = await API.get("/articles");
  return response.data;
};

// Get single article
export const getArticleById = async (id) => {
  const response = await API.get(`/articles/${id}`);
  return response.data;
};

// Update article
export const updateArticle = async (id, articleData) => {
  const response = await API.put(`/articles/${id}`, articleData);
  return response.data;
};

// Delete article
export const deleteArticle = async (id) => {
  const response = await API.delete(`/articles/${id}`);
  return response.data;
};

// Submit article for review
export const submitArticle = async (id) => {
  const response = await API.patch(`/articles/${id}/submit`);
  return response.data;
};

// Get users
export const getUsers = async () => {
  const response = await API.get("/users");
  return response.data;
};

// Generate AI quiz
export const generateQuiz = async (data) => {
  const response = await API.post("/articles/generate-quiz", data);
  return response.data;
};