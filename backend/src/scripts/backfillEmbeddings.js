import dotenv from 'dotenv'
import mongoose from 'mongoose'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({
  path: path.resolve(__dirname, '../../../.env'),
})

const { default: Article } = await import('../models/Article.js')

const { generateArticleEmbedding } = await import(
  '../services/duplicateDetectionService.js'
)

const MONGO_URI = process.env.MONGODB_URI

if (!MONGO_URI) {
  console.error('MONGODB_URI is not defined in the environment variables.')
  process.exit(1)
}

if (!process.env.OPENAI_API_KEY) {
  console.error('OPENAI_API_KEY is not defined in the environment variables.')
  process.exit(1)
}

const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI)
    console.log('MongoDB connected.')
  } catch (error) {
    console.error('MongoDB connection failed:', error.message)
    process.exit(1)
  }
}

const backfillEmbeddings = async () => {
  try {
    await connectDB()

    console.log('Searching for published articles without embeddings...')

    const articles = await Article.find({
      status: 'Published',
      $or: [
        { contentEmbedding: { $exists: false } },
        { contentEmbedding: { $size: 0 } },
      ],
    }).select('_id title excerpt body')

    console.log(`Found ${articles.length} article(s) to process.`)

    if (!articles.length) {
      console.log('No articles require embedding backfill.')
      return
    }

    let successful = 0
    let failed = 0

    for (const article of articles) {
      try {
        console.log(`Generating embedding for: ${article.title}`)

        const embedding = await generateArticleEmbedding({
          title: article.title,
          excerpt: article.excerpt,
          body: article.body,
        })

        if (!embedding) {
          throw new Error('Embedding generation returned no result.')
        }

        await Article.updateOne(
          { _id: article._id },
          {
            $set: {
              contentEmbedding: embedding,
            },
          }
        )

        successful += 1

        console.log(`✓ Embedding saved for "${article.title}"`)
      } catch (error) {
        failed += 1

        console.error(
          `✗ Failed for "${article.title}":`,
          error.message
        )
      }
    }

    console.log('\n--------------------------------')
    console.log('Embedding backfill completed.')
    console.log(`Successful: ${successful}`)
    console.log(`Failed: ${failed}`)
    console.log('--------------------------------')
  } catch (error) {
    console.error('Backfill process failed:', error.message)
  } finally {
    await mongoose.disconnect()
    console.log('MongoDB connection closed.')
  }
}

backfillEmbeddings()

