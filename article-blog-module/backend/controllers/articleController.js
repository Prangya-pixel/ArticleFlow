const Article = require("../models/Article");


// ======================================================
// CREATE ARTICLE / SAVE AS DRAFT
// ======================================================

const createArticle = async (req, res) => {
  try {
    const {
      title,
      content,
      category,
      tags,
      author,
      quizEnabled,
      quiz,
      image,
    } = req.body;

    const article = new Article({
      title,
      content,
      category,
      tags,
      author,
      quizEnabled,
      quiz,
      image,
      status: "Draft",
    });

    const savedArticle = await article.save();

    res.status(201).json({
      message: "Article saved as draft successfully",
      article: savedArticle,
    });
  } catch (error) {
    console.error("Create article error:", error);

    res.status(500).json({
      message: "Failed to save article",
      error: error.message,
    });
  }
};


// ======================================================
// GET ALL ARTICLES
// ======================================================

const getAllArticles = async (req, res) => {
  try {
    const articles = await Article.find()
      .populate("author", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json(articles);
  } catch (error) {
    console.error("Get articles error:", error);

    res.status(500).json({
      message: "Failed to fetch articles",
      error: error.message,
    });
  }
};


// ======================================================
// GET SINGLE ARTICLE
// ======================================================

const getArticleById = async (req, res) => {
  try {
    const article = await Article.findById(req.params.id)
      .populate("author", "name email");

    if (!article) {
      return res.status(404).json({
        message: "Article not found",
      });
    }

    res.status(200).json(article);
  } catch (error) {
    console.error("Get article error:", error);

    res.status(500).json({
      message: "Failed to fetch article",
      error: error.message,
    });
  }
};


// ======================================================
// UPDATE EXISTING ARTICLE
// ======================================================

const updateArticle = async (req, res) => {
  try {
    const {
      title,
      content,
      category,
      tags,
      author,
      quizEnabled,
      quiz,
      image,
    } = req.body;

    const updateData = {
      title,
      content,
      category,
      tags,
      author,
      quizEnabled,
      quiz,
      image,
    };

    const article = await Article.findByIdAndUpdate(
      req.params.id,
      {
        $set: updateData,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!article) {
      return res.status(404).json({
        message: "Article not found",
      });
    }

    res.status(200).json({
      message: "Article updated successfully",
      article,
    });
  } catch (error) {
    console.error("Update article error:", error);

    res.status(500).json({
      message: "Failed to update article",
      error: error.message,
    });
  }
};


// ======================================================
// DELETE ARTICLE
// ======================================================

const deleteArticle = async (req, res) => {
  try {
    const article = await Article.findByIdAndDelete(
      req.params.id
    );

    if (!article) {
      return res.status(404).json({
        message: "Article not found",
      });
    }

    res.status(200).json({
      message: "Article deleted successfully",
    });
  } catch (error) {
    console.error("Delete article error:", error);

    res.status(500).json({
      message: "Failed to delete article",
      error: error.message,
    });
  }
};


// ======================================================
// SUBMIT ARTICLE FOR REVIEW
// ======================================================

const submitArticle = async (req, res) => {
  try {
    const article = await Article.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          status: "Pending",
        },
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!article) {
      return res.status(404).json({
        message: "Article not found",
      });
    }

    res.status(200).json({
      message: "Article submitted for review successfully",
      article,
    });
  } catch (error) {
    console.error("Submit article error:", error);

    res.status(500).json({
      message: "Failed to submit article",
      error: error.message,
    });
  }
};


module.exports = {
  createArticle,
  getAllArticles,
  getArticleById,
  updateArticle,
  deleteArticle,
  submitArticle,
};