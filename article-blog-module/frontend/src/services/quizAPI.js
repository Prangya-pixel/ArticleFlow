import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api",
});

export const getAllArticlesForQuiz = async () => {
  const response = await API.get("/articles");
  return response.data;
};

export const getArticleQuiz = async (articleId) => {
  const response = await API.get(`/articles/${articleId}`);
  return response.data;
};

export const updateArticleQuiz = async (articleId, quizData) => {
  const response = await API.put(
    `/articles/${articleId}`,
    quizData
  );
  return response.data;
};

export const deleteArticleQuiz = async (articleId) => {
  const response = await API.delete(
    `/articles/${articleId}`
  );
  return response.data;
};