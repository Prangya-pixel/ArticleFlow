import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

function detectSuspiciousLinks(text) {
  const urls = text.match(/https?:\/\/[^\s]+/gi) || []

  const suspiciousPatterns = [
    /\.tk\b/i,
    /\.ml\b/i,
    /\.ga\b/i,
    /\.cf\b/i,
    /\.gq\b/i,
    /bit\.ly/i,
    /tinyurl\.com/i,
  ]

  return urls.some((url) =>
    suspiciousPatterns.some((pattern) => pattern.test(url))
  )
}

function detectPII(text) {
  const email = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i
  const phone = /\b(?:\+91[-\s]?)?[6-9]\d{9}\b/
  const aadhaar = /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/

  return {
    email: email.test(text),
    phone: phone.test(text),
    aadhaar: aadhaar.test(text),
  }
}

function detectSpam(text) {
  const normalizedText = text.toLowerCase().trim()

  if (!normalizedText) {
    return false
  }

  // Repeated words or phrases
  const words = normalizedText.split(/\s+/)

  if (words.length >= 8) {
    const wordCounts = {}

    for (const word of words) {
      if (word.length < 3) continue
      wordCounts[word] = (wordCounts[word] || 0) + 1
    }

    const repeatedWord = Object.values(wordCounts).some(
      (count) => count >= 5
    )

    if (repeatedWord) {
      return true
    }
  }

  // Common promotional/spam patterns
  const spamPatterns = [
    /buy now/i,
    /click here/i,
    /limited offer/i,
    /free money/i,
    /earn money fast/i,
    /winner/i,
    /congratulations.*claim/i,
    /visit my profile/i,
  ]

  return spamPatterns.some((pattern) => pattern.test(normalizedText))
}

function calculateRiskScore(moderation, pii, suspiciousLink, spam) {
  const scores = moderation.category_scores || {}

  const categoryScores = [
    scores.harassment || 0,
    scores['harassment/threatening'] || 0,
    scores.hate || 0,
    scores['hate/threatening'] || 0,
    scores.violence || 0,
    scores['violence/graphic'] || 0,
    scores.sexual || 0,
    scores['sexual/minors'] || 0,
    scores.illicit || 0,
  ]

  let riskScore = Math.max(...categoryScores)

  if (spam) {
    riskScore = Math.max(riskScore, 0.6)
  }

  if (suspiciousLink) {
    riskScore = Math.max(riskScore, 0.65)
  }

  if (pii.email || pii.phone || pii.aadhaar) {
    riskScore = Math.max(riskScore, 0.55)
  }

  return Number(Math.min(riskScore, 1).toFixed(2))
}

function getRiskLevel(riskScore) {
  if (riskScore >= 0.7) {
    return 'HIGH'
  }

  if (riskScore >= 0.4) {
    return 'MEDIUM'
  }

  return 'LOW'
}

function getRecommendation(riskLevel) {
  if (riskLevel === 'HIGH') {
    return 'BLOCK'
  }

  if (riskLevel === 'MEDIUM') {
    return 'REVIEW'
  }

  return 'SAFE'
}

export async function analyzeContent({ title = '', content = '' }) {
  const combinedText = `${title}\n${content}`.trim()

  if (!combinedText) {
    throw new Error('Content is required for moderation analysis.')
  }

  const response = await openai.moderations.create({
    model: 'omni-moderation-latest',
    input: combinedText,
  })

  const result = response.results?.[0]

  if (!result) {
    throw new Error('The moderation service returned no analysis result.')
  }

  const categories = result.categories || {}
  const categoryScores = result.category_scores || {}

  const pii = detectPII(combinedText)
  const suspiciousLink = detectSuspiciousLinks(combinedText)
  const spam = detectSpam(combinedText)

  const riskScore = calculateRiskScore(
    result,
    pii,
    suspiciousLink,
    spam
  )

  const riskLevel = getRiskLevel(riskScore)

  return {
    riskScore,
    riskLevel,

    flags: {
      spam,

      toxic: Boolean(
        categories.harassment ||
        categories['harassment/threatening']
      ),

      hateSpeech: Boolean(
        categories.hate ||
        categories['hate/threatening']
      ),

      inappropriate: Boolean(
        categories.sexual ||
        categories['sexual/minors']
      ),

      violence: Boolean(
        categories.violence ||
        categories['violence/graphic']
      ),

      suspiciousLinks: suspiciousLink,

      pii: Boolean(
        pii.email ||
        pii.phone ||
        pii.aadhaar
      ),
    },

    pii,

    suspiciousLink,

    categoryScores: {
      spam: spam ? 1 : 0,
      harassment: categoryScores.harassment || 0,
      hateSpeech: categoryScores.hate || 0,
      violence: categoryScores.violence || 0,
      adultContent: categoryScores.sexual || 0,
    },

    recommendation: getRecommendation(riskLevel),

    aiFlagged: Boolean(result.flagged),
  }
}