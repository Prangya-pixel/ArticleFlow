const express = require("express");

const {
  createArticle,
  getAllArticles,
  getArticleById,
  updateArticle,
  deleteArticle,
  submitArticle,
} = require("../controllers/articleController");

const router = express.Router();

// Create article / Save draft
router.post("/", createArticle);

// Get all articles
router.get("/", getAllArticles);

// Get single article
router.get("/:id", getArticleById);

// Update article
router.put("/:id", updateArticle);

// Delete article
router.delete("/:id", deleteArticle);

// Submit article for review
router.patch("/:id/submit", submitArticle);

module.exports = router;