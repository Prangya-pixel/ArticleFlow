import { api } from './api'

export const quizService = {
  async getQuizByArticleId(articleId) {
    try { return await api(`/quizzes/article/${articleId}`) } catch (error) { if (error.message === 'Quiz not found.') return null; throw error }
  },
  submitAttempt: (articleId, answers) => api(`/quizzes/article/${articleId}/attempts`, { method: 'POST', body: JSON.stringify({ answers }) }),
}
