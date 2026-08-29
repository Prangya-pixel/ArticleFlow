const mongoose = require("mongoose");
const OpenAI = require("openai");
require("dotenv").config();

const Article = require("./models/Article");
const User = require("./models/User");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const generateQuiz = async ({ title, content, category, tags }) => {
  const prompt = `
Create a quiz based ONLY on the following article.

Title: ${title}
Category: ${category}
Tags: ${tags.join(", ")}

Article:
${content}

Generate exactly 5 multiple-choice questions.

Rules:
- Each question must have exactly 4 options.
- Only one option can be correct.
- Questions must be directly related to the article.
- Do not make questions unrelated to the article.
- Keep questions clear and easy to understand.
- correctAnswer must exactly match one of the options.
- Return ONLY valid JSON.

JSON format:
{
  "questions": [
    {
      "question": "Question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Option A"
    }
  ]
}
`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "You are an expert quiz generator. Return only valid JSON.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    response_format: {
      type: "json_object",
    },
    temperature: 0.7,
  });

  const result = JSON.parse(
    response.choices[0].message.content
  );

  if (
    !result.questions ||
    !Array.isArray(result.questions) ||
    result.questions.length !== 5
  ) {
    throw new Error("AI did not generate exactly 5 questions.");
  }

  result.questions.forEach((q, index) => {
    if (
      !q.question ||
      !Array.isArray(q.options) ||
      q.options.length !== 4 ||
      !q.correctAnswer
    ) {
      throw new Error(
        `Invalid quiz question generated at Question ${index + 1}.`
      );
    }

    const correct = q.correctAnswer.trim().toLowerCase();

    const options = q.options.map((option) =>
      option.trim().toLowerCase()
    );

    if (!options.includes(correct)) {
      throw new Error(
        `Correct answer does not match an option in Question ${
          index + 1
        }.`
      );
    }
  });

  return result;
};

const seedArticles = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB connected successfully.");

    const authors = await User.find({
      role: "author",
    }).select("_id name email");

    if (!authors.length) {
      throw new Error(
        "No authors found. Please run seedUsers.js first."
      );
    }

    console.log(`${authors.length} authors found.`);

    await Article.deleteMany({});

    console.log("Existing articles removed.");

    const articles = [
      {
        title: "The Amazing World of Black Holes",
        content:
          "Black holes are some of the most fascinating objects in the universe. They have an extremely strong gravitational field, so strong that even light cannot escape once it crosses the event horizon. Scientists study black holes to understand gravity, space, time, and the evolution of galaxies.",
        category: "Science",
        tags: ["space", "black holes", "astronomy"],
        author: authors[0]._id,
        status: "Published",
        quizEnabled: true,
        views: 1250,
        likes: 186,
        image: "",
        adminNote: "",
      },

      {
        title: "How Artificial Intelligence Is Changing Education",
        content:
          "Artificial intelligence is transforming education by helping students learn at their own pace. AI-powered tools can provide personalized explanations, recommend learning materials, and help teachers identify areas where students need additional support. Responsible use of AI can make education more accessible and engaging.",
        category: "Technology",
        tags: ["AI", "education", "technology"],
        author: authors[1]?._id || authors[0]._id,
        status: "Approved",
        quizEnabled: true,
        views: 890,
        likes: 124,
        image: "",
        adminNote: "",
      },

      {
        title: "Simple Habits for a Healthier Lifestyle",
        content:
          "A healthy lifestyle can be built through small and consistent habits. Eating balanced meals, staying physically active, getting enough sleep, and managing stress can support overall well-being. The goal is not perfection but maintaining healthy habits over time.",
        category: "Health",
        tags: ["health", "lifestyle", "wellness"],
        author: authors[0]._id,
        status: "Pending",
        quizEnabled: true,
        views: 420,
        likes: 72,
        image: "",
        adminNote: "",
      },

      {
        title: "Why Protecting Forests Matters",
        content:
          "Forests play an important role in maintaining Earth's ecosystems. They provide habitats for wildlife, help regulate the climate, support biodiversity, and contribute to the water cycle. Protecting forests is essential for both nature and future generations.",
        category: "Environment",
        tags: ["forests", "environment", "climate"],
        author: authors[1]?._id || authors[0]._id,
        status: "Draft",
        quizEnabled: false,
        views: 0,
        likes: 0,
        image: "",
        adminNote: "",
      },

      {
        title:
          "The Story of the Ancient Indus Valley Civilization",
        content:
          "The Indus Valley Civilization was one of the world's earliest urban civilizations. It developed sophisticated cities with planned streets, drainage systems, and carefully designed buildings. Archaeological discoveries from sites such as Harappa and Mohenjo-daro provide valuable information about this ancient society.",
        category: "History",
        tags: ["history", "ancient India", "civilization"],
        author: authors[0]._id,
        status: "Rejected",
        quizEnabled: true,
        views: 310,
        likes: 41,
        image: "",
        adminNote:
          "Please provide additional references and improve the introduction.",
      },

      // ⭐ THIS ARTICLE WILL GET AI-GENERATED QUIZ
      {
        title: "The Future of Renewable Energy",
        content:
          "Renewable energy sources such as solar, wind, and hydropower are becoming increasingly important. These sources can help reduce dependence on fossil fuels and lower greenhouse gas emissions. Continued innovation can make renewable energy more efficient and accessible.",
        category: "Environment",
        tags: [
          "renewable energy",
          "solar",
          "wind energy",
        ],
        author: authors[1]?._id || authors[0]._id,
        status: "Changes Requested",
        quizEnabled: true,
        views: 215,
        likes: 33,
        image: "",
        adminNote:
          "Please add more information about recent renewable energy developments.",
      },
    ];

    const createdArticles = [];

    for (const articleData of articles) {
      console.log(`\nProcessing: ${articleData.title}`);

      if (articleData.quizEnabled) {
        console.log("Generating AI quiz...");

        try {
          const quiz = await generateQuiz(articleData);

          articleData.quiz = quiz;

          console.log(
            `✓ ${quiz.questions.length} quiz questions generated.`
          );
        } catch (error) {
          console.error(
            `Quiz generation failed for "${articleData.title}":`,
            error.message
          );

          articleData.quiz = {
            questions: [],
          };

          articleData.quizEnabled = false;
        }
      } else {
        articleData.quiz = {
          questions: [],
        };
      }

      const article = new Article(articleData);
      const savedArticle = await article.save();

      createdArticles.push(savedArticle);

      console.log(`✓ Article saved: ${savedArticle.title}`);
    }

    console.log(
      `\n${createdArticles.length} articles created successfully.`
    );

    console.log("\n========== SEEDED ARTICLES ==========");

    createdArticles.forEach((article, index) => {
      console.log(
        `${index + 1}. ${article.title} | ${article.category} | ${article.status} | Quiz: ${
          article.quizEnabled ? "Yes" : "No"
        }`
      );
    });

    console.log("=====================================\n");

    await mongoose.connection.close();

    console.log("Database connection closed.");

    process.exit(0);
  } catch (error) {
    console.error(
      "\nFailed to seed articles:",
      error.message
    );

    try {
      await mongoose.connection.close();
    } catch (closeError) {
      console.error(
        "Failed to close database connection:",
        closeError.message
      );
    }

    process.exit(1);
  }
};

seedArticles();