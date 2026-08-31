import { mockQuizzes } from '../modules/quiz/mockQuizzes'

// TEMP: mock implementation — replace when quiz backend lands
export const quizService = {
  async getQuizByArticleId(articleId) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const quiz = mockQuizzes.find(q => q.articleId === articleId);
        resolve(quiz || null);
      }, 200);
    });
  },

  async submitAttempt(articleId, answers) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const quiz = mockQuizzes.find(q => q.articleId === articleId);
        if (!quiz) {
          return reject(new Error('Quiz not found'));
        }

        let score = 0;
        const totalQuestions = quiz.questions.length;
        const review = quiz.questions.map((question) => {
          const selectedAnswerIndex = answers[question.id];
          const isCorrect = selectedAnswerIndex === question.correctAnswerIndex;
          if (isCorrect) score += 1;

          return {
            questionId: question.id,
            text: question.text,
            options: question.options,
            selectedAnswerIndex,
            correctAnswerIndex: question.correctAnswerIndex,
            isCorrect,
            explanation: question.explanation
          };
        });

        const percentage = Math.round((score / totalQuestions) * 100);

        resolve({
          score,
          totalQuestions,
          percentage,
          review
        });
      }, 200);
    });
  }
};
