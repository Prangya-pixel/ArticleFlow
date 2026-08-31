import mongoose from 'mongoose';

const quizQuestionSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: true,
      trim: true,
      minlength: 5,
    },

    options: {
      type: [String],
      required: true,
      validate: {
        validator: (options) => {
          if (!Array.isArray(options) || options.length !== 4) {
            return false;
          }

          const normalized = options.map((option) =>
            String(option).trim().toLowerCase()
          );

          return (
            options.every((option) => String(option).trim().length > 0) &&
            new Set(normalized).size === 4
          );
        },
        message: 'Each question must have exactly 4 unique options.',
      },
    },

    correctAnswer: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: true }
);

const articleSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    content: {
      type: String,
      required: true,
    },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },

    tags: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tag',
      },
    ],

    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    status: {
      type: String,
      enum: [
        'Draft',
        'Pending',
        'Approved',
        'Published',
        'Rejected',
        'Changes Requested',
      ],
      default: 'Draft',
    },

    quizEnabled: {
      type: Boolean,
      default: false,
    },

    quiz: {
      questions: {
        type: [quizQuestionSchema],
        default: [],
      },
    },

    views: {
      type: Number,
      default: 0,
    },

    likes: {
      type: Number,
      default: 0,
    },

    image: {
      type: String,
      default: '',
    },

    adminNote: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

articleSchema.pre('validate', function () {
  if (!this.quizEnabled) {
    return;
  }

  if (
    !this.quiz ||
    !Array.isArray(this.quiz.questions) ||
    this.quiz.questions.length === 0
  ) {
    throw new Error(
      'Quiz must contain at least one question when quiz is enabled.'
    );
  }

  this.quiz.questions.forEach((question, index) => {
    const options = question.options.map((option) =>
      String(option).trim()
    );

    const normalizedOptions = options.map((option) =>
      option.toLowerCase()
    );

    const correctAnswer = String(question.correctAnswer)
      .trim()
      .toLowerCase();

    if (!normalizedOptions.includes(correctAnswer)) {
      throw new Error(
        `Correct answer for Question ${index + 1} must match one of the options.`
      );
    }
  });
});

export default mongoose.model('Article', articleSchema);