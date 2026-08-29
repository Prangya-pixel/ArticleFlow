const OpenAI = require("openai");
const Article = require("../models/Article");

const getOpenAIClient = () => {
  if (!process.env.OPENAI_API_KEY) {
    return null;
  }

  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
};

// ----------------------------------------------------
// FALLBACK QUIZ
// ----------------------------------------------------
const generateFallbackQuiz = (title, content, category) => {
  const text = String(content || "").trim();

  const sentences = text
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 30);

  const firstSentence =
    sentences[0] ||
    `${title} is an important topic related to ${category}.`;

  const secondSentence =
    sentences[1] ||
    `The article explains important information about ${title}.`;

  const thirdSentence =
    sentences[2] ||
    `Understanding ${title} can help readers learn more about this topic.`;

  return [
    {
      question: `What is the main topic discussed in the article "${title}"?`,
      options: [
        title,
        "Cooking recipes",
        "Sports training",
        "Movie reviews",
      ],
      correctAnswer: title,
    },

    {
      question: `Which category best describes the article "${title}"?`,
      options: [
        category,
        "Entertainment",
        "Sports",
        "Travel",
      ],
      correctAnswer: category,
    },

    {
      question: "Which statement is mentioned in the article?",
      options: [
        firstSentence.length > 100
          ? `${firstSentence.substring(0, 97)}...`
          : firstSentence,
        "The article contains no useful information.",
        "The topic has nothing to do with the article.",
        "The article only discusses entertainment.",
      ],
      correctAnswer:
        firstSentence.length > 100
          ? `${firstSentence.substring(0, 97)}...`
          : firstSentence,
    },

    {
      question: "What does the article help readers understand?",
      options: [
        secondSentence.length > 100
          ? `${secondSentence.substring(0, 97)}...`
          : secondSentence,
        "How to play professional sports.",
        "How to prepare a restaurant menu.",
        "How to write movie scripts.",
      ],
      correctAnswer:
        secondSentence.length > 100
          ? `${secondSentence.substring(0, 97)}...`
          : secondSentence,
    },

    {
      question: `Why is learning about "${title}" useful?`,
      options: [
        "It helps readers understand the topic better.",
        "It is only useful for entertainment.",
        "It has no connection to the article.",
        "It prevents people from learning.",
      ],
      correctAnswer:
        "It helps readers understand the topic better.",
    },
  ];
};

// ----------------------------------------------------
// GENERATE QUIZ
// POST /api/quiz/generate
// ----------------------------------------------------
const generateQuiz = async (req, res) => {
  try {
    const {
      title,
      content,
      category,
      tags,
      numberOfQuestions = 5,
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        message: "Article title is required.",
      });
    }

    if (!content || !content.trim()) {
      return res.status(400).json({
        message: "Article content is required.",
      });
    }

    const count = Math.min(
      Math.max(Number(numberOfQuestions) || 5, 1),
      10
    );

    const client = getOpenAIClient();

    // -----------------------------------------------
    // TRY OPENAI
    // -----------------------------------------------
    if (client) {
      try {
        const prompt = `
Create ${count} multiple-choice quiz questions based ONLY on the article below.

ARTICLE TITLE:
${title}

CATEGORY:
${category || "General"}

TAGS:
${Array.isArray(tags) ? tags.join(", ") : ""}

ARTICLE CONTENT:
${content}

RULES:
- Generate exactly ${count} questions.
- Each question must have exactly 4 options.
- Every option must be different.
- Only one option can be correct.
- correctAnswer MUST exactly match one of the options.
- Questions must test understanding of the article.
- Do not ask questions unrelated to the article.
- Keep questions clear and suitable for general readers.
- Return ONLY valid JSON.
- Do not use markdown.

JSON FORMAT:
{
  "questions": [
    {
      "question": "Question text",
      "options": [
        "Option A",
        "Option B",
        "Option C",
        "Option D"
      ],
      "correctAnswer": "Option A"
    }
  ]
}
`;

        const completion =
          await client.chat.completions.create({
            model:
              process.env.OPENAI_MODEL ||
              "gpt-4o-mini",

            messages: [
              {
                role: "system",
                content:
                  "You generate accurate educational multiple-choice quizzes and return valid JSON only.",
              },
              {
                role: "user",
                content: prompt,
              },
            ],

            temperature: 0.4,
            response_format: {
              type: "json_object",
            },
          });

        const raw =
          completion.choices?.[0]?.message?.content;

        if (!raw) {
          throw new Error(
            "OpenAI returned an empty response."
          );
        }

        const parsed = JSON.parse(raw);

        const questions =
          parsed.questions || [];

        const validQuestions = questions
          .filter((q) => {
            if (
              !q ||
              typeof q.question !== "string" ||
              !Array.isArray(q.options) ||
              q.options.length !== 4 ||
              typeof q.correctAnswer !== "string"
            ) {
              return false;
            }

            const options = q.options.map((o) =>
              String(o).trim()
            );

            const normalized = options.map((o) =>
              o.toLowerCase()
            );

            return (
              q.question.trim().length >= 5 &&
              options.every(Boolean) &&
              new Set(normalized).size === 4 &&
              normalized.includes(
                q.correctAnswer.trim().toLowerCase()
              )
            );
          })
          .map((q) => ({
            question: q.question.trim(),

            options: q.options.map((o) =>
              String(o).trim()
            ),

            correctAnswer:
              q.correctAnswer.trim(),
          }))
          .slice(0, count);

        if (validQuestions.length > 0) {
          return res.status(200).json({
            message:
              "AI quiz generated successfully.",
            questions: validQuestions,
            fallback: false,
          });
        }

        throw new Error(
          "OpenAI generated invalid quiz data."
        );
      } catch (aiError) {
        console.error(
          "OpenAI quiz generation failed:",
          aiError.message
        );

        // Continue to fallback
      }
    }

    // -----------------------------------------------
    // FALLBACK
    // -----------------------------------------------
    const fallbackQuestions =
      generateFallbackQuiz(
        title.trim(),
        content.trim(),
        category || "General"
      ).slice(0, count);

    return res.status(200).json({
      message:
        "Quiz generated using automatic fallback.",
      questions: fallbackQuestions,
      fallback: true,
    });
  } catch (error) {
    console.error(
      "Generate quiz error:",
      error
    );

    res.status(500).json({
      message: "Failed to generate quiz.",
      error: error.message,
    });
  }
};

// ----------------------------------------------------
// GET ALL ARTICLES
// ----------------------------------------------------
const getQuizArticles = async (req, res) => {
  try {
    const articles = await Article.find()
      .populate("author", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      articles,
    });
  } catch (error) {
    console.error(
      "Get quiz articles error:",
      error
    );

    res.status(500).json({
      message: "Failed to fetch articles",
      error: error.message,
    });
  }
};

// ----------------------------------------------------
// GET ARTICLE QUIZ
// ----------------------------------------------------
const getArticleQuiz = async (req, res) => {
  try {
    const article =
      await Article.findById(req.params.id)
        .populate("author", "name email");

    if (!article) {
      return res.status(404).json({
        message: "Article not found",
      });
    }

    res.status(200).json({
      article,
    });
  } catch (error) {
    console.error(
      "Get article quiz error:",
      error
    );

    res.status(500).json({
      message: "Failed to fetch quiz",
      error: error.message,
    });
  }
};

// ----------------------------------------------------
// UPDATE QUIZ
// ----------------------------------------------------
const updateQuiz = async (req, res) => {
  try {
    const {
      title,
      content,
      category,
      tags,
      author,
      image,
      quizEnabled,
      quiz,
    } = req.body;

    if (!quizEnabled) {
      return res.status(400).json({
        message:
          "Quiz must be enabled while saving.",
      });
    }

    if (
      !quiz ||
      !Array.isArray(quiz.questions) ||
      quiz.questions.length === 0
    ) {
      return res.status(400).json({
        message:
          "Quiz must contain at least one question.",
      });
    }

    for (
      let i = 0;
      i < quiz.questions.length;
      i++
    ) {
      const question =
        quiz.questions[i];

      if (
        !question.question ||
        question.question.trim().length < 5
      ) {
        return res.status(400).json({
          message:
            `Question ${i + 1} must contain at least 5 characters.`,
        });
      }

      if (
        !Array.isArray(question.options) ||
        question.options.length !== 4
      ) {
        return res.status(400).json({
          message:
            `Question ${i + 1} must have exactly 4 options.`,
        });
      }

      const options =
        question.options.map((option) =>
          String(option).trim()
        );

      if (options.some((option) => !option)) {
        return res.status(400).json({
          message:
            `All four options are required for Question ${i + 1}.`,
        });
      }

      const normalized =
        options.map((option) =>
          option.toLowerCase()
        );

      if (
        new Set(normalized).size !== 4
      ) {
        return res.status(400).json({
          message:
            `Options for Question ${i + 1} must be unique.`,
        });
      }

      const correctAnswer =
        String(
          question.correctAnswer || ""
        )
          .trim()
          .toLowerCase();

      if (!correctAnswer) {
        return res.status(400).json({
          message:
            `Correct answer is required for Question ${i + 1}.`,
        });
      }

      if (
        !normalized.includes(correctAnswer)
      ) {
        return res.status(400).json({
          message:
            `Correct answer for Question ${i + 1} must match one of the options.`,
        });
      }
    }

    const article =
      await Article.findById(req.params.id);

    if (!article) {
      return res.status(404).json({
        message: "Article not found",
      });
    }

    if (title !== undefined) {
      article.title = title;
    }

    if (content !== undefined) {
      article.content = content;
    }

    if (category !== undefined) {
      article.category = category;
    }

    if (tags !== undefined) {
      article.tags = tags;
    }

    if (author !== undefined) {
      article.author = author;
    }

    if (image !== undefined) {
      article.image = image;
    }

    article.quizEnabled = true;

    article.quiz = {
      questions: quiz.questions.map(
        (question) => ({
          question:
            question.question.trim(),

          options:
            question.options.map((option) =>
              String(option).trim()
            ),

          correctAnswer:
            question.correctAnswer.trim(),
        })
      ),
    };

    await article.save();

    const updatedArticle =
      await Article.findById(article._id)
        .populate("author", "name email");

    res.status(200).json({
      message: "Quiz saved successfully",
      article: updatedArticle,
    });
  } catch (error) {
    console.error(
      "Update quiz error:",
      error
    );

    res.status(500).json({
      message: "Failed to save quiz",
      error: error.message,
    });
  }
};

// ----------------------------------------------------
// DELETE QUIZ
// ----------------------------------------------------
const deleteQuiz = async (req, res) => {
  try {
    const article =
      await Article.findById(req.params.id);

    if (!article) {
      return res.status(404).json({
        message: "Article not found",
      });
    }

    article.quizEnabled = false;

    article.quiz = {
      questions: [],
    };

    await article.save();

    res.status(200).json({
      message: "Quiz deleted successfully",
      article,
    });
  } catch (error) {
    console.error(
      "Delete quiz error:",
      error
    );

    res.status(500).json({
      message: "Failed to delete quiz",
      error: error.message,
    });
  }
};

module.exports = {
  generateQuiz,
  getQuizArticles,
  getArticleQuiz,
  updateQuiz,
  deleteQuiz,
};

