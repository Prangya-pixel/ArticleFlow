const mongoose = require("mongoose");

const quizQuestionSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: [true, "Question is required."],
      trim: true,
      minlength: [
        5,
        "Question must contain at least 5 characters.",
      ],
    },

    options: {
      type: [String],
      required: [true, "Four options are required."],

      validate: [
        {
          validator: (options) => {
            return (
              Array.isArray(options) &&
              options.length === 4
            );
          },

          message:
            "Each question must have exactly 4 options.",
        },

        {
          validator: (options) => {
            if (!Array.isArray(options)) {
              return false;
            }

            return options.every(
              (option) =>
                typeof option === "string" &&
                option.trim().length > 0
            );
          },

          message:
            "All four options are required.",
        },

        {
          validator: (options) => {
            if (!Array.isArray(options)) {
              return false;
            }

            const normalizedOptions =
              options.map((option) =>
                option.trim().toLowerCase()
              );

            return (
              new Set(normalizedOptions).size ===
              normalizedOptions.length
            );
          },

          message:
            "Quiz options must be unique.",
        },
      ],
    },

    correctAnswer: {
      type: String,
      required: [
        true,
        "Correct answer is required.",
      ],
      trim: true,
    },
  },

  {
    _id: true,
  }
);

/*
|--------------------------------------------------------------------------
| Article Schema
|--------------------------------------------------------------------------
*/

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

      enum: [
        "Science",
        "Technology",
        "Health",
        "Environment",
        "History",
      ],

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

    /*
    |--------------------------------------------------------------------------
    | Quiz
    |--------------------------------------------------------------------------
    */

    quizEnabled: {
      type: Boolean,
      default: false,
    },

    quiz: {
      questions: {
        type: [quizQuestionSchema],

        default: [],

        validate: {
          validator: function (questions) {
            if (!this.quizEnabled) {
              return true;
            }

            return (
              Array.isArray(questions) &&
              questions.length > 0
            );
          },

          message:
            "At least one quiz question is required when quiz is enabled.",
        },
      },
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

/*
|--------------------------------------------------------------------------
| Quiz Correct Answer Validation
|--------------------------------------------------------------------------
|
| Ensures that correctAnswer must exactly match one
| of the four options.
|
| IMPORTANT:
| This uses async middleware without `next`.
| This fixes the "next is not a function" error.
|
|--------------------------------------------------------------------------
*/

articleSchema.pre(
  "validate",
  async function () {
    // Quiz disabled
    if (!this.quizEnabled) {
      return;
    }

    // Quiz missing
    if (
      !this.quiz ||
      !Array.isArray(this.quiz.questions) ||
      this.quiz.questions.length === 0
    ) {
      throw new Error(
        "Quiz must contain at least one question."
      );
    }

    // Validate every quiz question
    for (
      let index = 0;
      index < this.quiz.questions.length;
      index++
    ) {
      const question =
        this.quiz.questions[index];

      // Question text
      if (
        !question.question ||
        !question.question.trim()
      ) {
        throw new Error(
          `Question ${index + 1} must have a question.`
        );
      }

      // Exactly 4 options
      if (
        !Array.isArray(question.options) ||
        question.options.length !== 4
      ) {
        throw new Error(
          `Question ${
            index + 1
          } must have exactly 4 options.`
        );
      }

      // Clean options
      const options =
        question.options.map((option) =>
          String(option).trim()
        );

      // All options required
      if (
        options.some(
          (option) => option.length === 0
        )
      ) {
        throw new Error(
          `All four options are required for Question ${
            index + 1
          }.`
        );
      }

      // Options must be unique
      const normalizedOptions =
        options.map((option) =>
          option.toLowerCase()
        );

      if (
        new Set(normalizedOptions).size !== 4
      ) {
        throw new Error(
          `Options for Question ${
            index + 1
          } must be unique.`
        );
      }

      // Correct answer required
      if (
        !question.correctAnswer ||
        !question.correctAnswer.trim()
      ) {
        throw new Error(
          `Question ${
            index + 1
          } must have a correct answer.`
        );
      }

      // Correct answer must match one option
      const correctAnswer =
        question.correctAnswer
          .trim()
          .toLowerCase();

      if (
        !normalizedOptions.includes(
          correctAnswer
        )
      ) {
        throw new Error(
          `Correct answer for Question ${
            index + 1
          } must match one of the options.`
        );
      }
    }
  }
);

/*
|--------------------------------------------------------------------------
| Model
|--------------------------------------------------------------------------
*/

const Article = mongoose.model(
  "Article",
  articleSchema
);

module.exports = Article;