const mongoose = require("mongoose");

const articleSchema = new mongoose.Schema(
  {
    // Article title
    title: {
      type: String,
      required: true,
      trim: true,
    },

    // Article content
    content: {
      type: String,
      required: true,
    },

    // Article category
    category: {
      type: String,
      required: true,
      trim: true,
    },

    // Article tags
    tags: {
      type: [String],
      default: [],
    },

    // Author
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Article status
    status: {
      type: String,
      enum: [
        "Draft",
        "Pending",
        "Approved",
        "Published",
        "Rejected",
        "Changes Requested",
      ],
      default: "Draft",
    },

    // Quiz
    quizEnabled: {
      type: Boolean,
      default: false,
    },

    quiz: {
      questions: [
        {
          question: {
            type: String,
            trim: true,
          },

          options: {
            type: [String],
            validate: {
              validator: (options) => options.length === 4,
              message: "Each quiz question must have exactly 4 options.",
            },
          },

          correctAnswer: {
            type: String,
            trim: true,
          },
        },
      ],
    },

    // Article statistics
    views: {
      type: Number,
      default: 0,
    },

    likes: {
      type: Number,
      default: 0,
    },

    // Article image URL
    image: {
      type: String,
      default: "",
    },

    // Admin note
    adminNote: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

const Article = mongoose.model("Article", articleSchema);

module.exports = Article;