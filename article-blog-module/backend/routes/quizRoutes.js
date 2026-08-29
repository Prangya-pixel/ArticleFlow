const express = require("express");

const {
  generateQuiz,
  getQuizArticles,
  getArticleQuiz,
  updateQuiz,
  deleteQuiz,
} = require("../controllers/quizController");

const router = express.Router();

// Generate quiz
router.post("/generate", generateQuiz);

// Quiz management
router.get("/articles", getQuizArticles);

router.get("/articles/:id", getArticleQuiz);

router.put("/articles/:id", updateQuiz);

router.delete("/articles/:id", deleteQuiz);

module.exports = router;

