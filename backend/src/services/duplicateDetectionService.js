import dotenv from 'dotenv'
import OpenAI from 'openai'
import Article from '../models/Article.js'

dotenv.config({ path: '../../../../.env' })

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

/*
 * Normalize article text before comparison.
 */
const normalizeText = (text = '') => {
  return text
    .toLowerCase()
    .replace(/<[^>]*>/g, ' ')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/*
 * Build a single text representation of an article.
 */
const buildArticleText = ({
  title,
  excerpt,
  body,
}) => {
  return normalizeText(
    `${title || ''} ${excerpt || ''} ${body || ''}`
  )
}

/*
 * Calculate cosine similarity between two vectors.
 */
const cosineSimilarity = (vectorA, vectorB) => {
  if (
    !Array.isArray(vectorA) ||
    !Array.isArray(vectorB) ||
    vectorA.length !== vectorB.length ||
    vectorA.length === 0
  ) {
    return 0
  }

  let dotProduct = 0
  let magnitudeA = 0
  let magnitudeB = 0

  for (let i = 0; i < vectorA.length; i++) {
    dotProduct += vectorA[i] * vectorB[i]

    magnitudeA += vectorA[i] * vectorA[i]

    magnitudeB += vectorB[i] * vectorB[i]
  }

  if (!magnitudeA || !magnitudeB) {
    return 0
  }

  return (
    dotProduct /
    (Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB))
  )
}

/*
 * Generate an OpenAI embedding.
 */
const getEmbedding = async (text) => {
  if (!text?.trim()) {
    return null
  }

  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  })

  return response.data[0].embedding
}

/*
 * Generate the semantic embedding for an article.
 *
 * This is used when creating or updating an article.
 */
const generateArticleEmbedding = async ({
  title,
  excerpt,
  body,
}) => {
  const text = buildArticleText({
    title,
    excerpt,
    body,
  })

  if (!text) {
    return null
  }

  return getEmbedding(text)
}

/*
 * Analyze a new article against existing
 * published articles.
 */
const analyzeDuplicateContent = async ({
  title,
  excerpt,
  body,
  articleId = null,
}) => {
  const newArticleText = buildArticleText({
    title,
    excerpt,
    body,
  })

  if (!newArticleText) {
    return {
      duplicateDetected: false,
      similarityScore: 0,
      topSimilarity: 0,
      matches: [],
    }
  }

  /*
   * Only published articles are compared.
   *
   * Draft, Pending, Rejected and
   * Changes Requested articles remain private.
   */
  const query = {
    status: 'Published',
  }

  /*
   * When editing an existing article,
   * exclude the article itself.
   */
  if (articleId) {
    query._id = {
      $ne: articleId,
    }
  }

  /*
   * contentEmbedding is hidden by default
   * because Article uses select:false.
   *
   * Explicitly select it here.
   */
  const publishedArticles = await Article.find(query)
    .select(
      '+contentEmbedding _id title excerpt body'
    )
    .lean()

  if (!publishedArticles.length) {
    return {
      duplicateDetected: false,
      similarityScore: 0,
      topSimilarity: 0,
      matches: [],
    }
  }

  /*
   * ------------------------------------------------
   * LEVEL 1: EXACT DUPLICATE
   * ------------------------------------------------
   */

  const exactMatches = []

  for (const article of publishedArticles) {
    const existingArticleText = buildArticleText({
      title: article.title,
      excerpt: article.excerpt,
      body: article.body,
    })

    if (existingArticleText === newArticleText) {
      exactMatches.push({
        articleId: article._id,
        title: article.title,
        excerpt: article.excerpt || '',
        similarity: 100,
        type: 'exact',
      })
    }
  }

  /*
   * Exact duplicate found.
   *
   * No embedding request is necessary.
   */
  if (exactMatches.length > 0) {
    return {
      duplicateDetected: true,
      similarityScore: 100,
      topSimilarity: 100,
      matches: exactMatches.slice(0, 5),
    }
  }

  /*
   * ------------------------------------------------
   * LEVEL 2: SEMANTIC SIMILARITY
   * ------------------------------------------------
   */

  const newEmbedding = await getEmbedding(
    newArticleText
  )

  if (!newEmbedding) {
    return {
      duplicateDetected: false,
      similarityScore: 0,
      topSimilarity: 0,
      matches: [],
    }
  }

  const matches = []

  for (const article of publishedArticles) {
    /*
     * Existing articles created before this
     * feature may not have embeddings.
     *
     * Those are handled by the backfill process.
     */
    if (
      !Array.isArray(article.contentEmbedding) ||
      article.contentEmbedding.length === 0
    ) {
      continue
    }

    const similarity = cosineSimilarity(
      newEmbedding,
      article.contentEmbedding
    )

    const similarityPercentage = Math.round(
      similarity * 100
    )

    /*
     * 70%+ = potentially similar.
     */
    if (similarityPercentage >= 70) {
      matches.push({
        articleId: article._id,
        title: article.title,
        excerpt: article.excerpt || '',
        similarity: similarityPercentage,
        type: 'semantic',
      })
    }
  }

  /*
   * Highest similarity first.
   */
  matches.sort(
    (a, b) => b.similarity - a.similarity
  )

  const topMatch = matches[0]

  const topSimilarity =
    topMatch?.similarity || 0

  return {
    /*
     * 80%+ is considered a likely duplicate.
     */
    duplicateDetected:
      topSimilarity >= 80,

    similarityScore: topSimilarity,

    topSimilarity,

    matches: matches.slice(0, 5),
  }
}

export {
  analyzeDuplicateContent,
  generateArticleEmbedding,
}