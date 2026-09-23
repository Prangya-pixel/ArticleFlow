import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const analyzeContentQuality = async ({ title, content }) => {
  if (!title || !content) {
    throw new Error('Title and content are required');
  }

  const prompt = `
You are an AI content quality analyzer for an article publishing platform.

Analyze the following article.

TITLE:
${title}

CONTENT:
${content}

Evaluate:

1. Grammar
2. Readability
3. Content structure
4. Overall quality

Return ONLY valid JSON in exactly this structure:

{
  "qualityScore": 0,
  "grammarScore": 0,
  "readabilityScore": 0,
  "structureScore": 0,
  "suggestions": []
}

Rules:

- All scores must be between 0 and 100.
- qualityScore represents the overall quality.
- grammarScore evaluates grammar, spelling and sentence correctness.
- readabilityScore evaluates clarity and ease of reading.
- structureScore evaluates headings, paragraphs, flow and organization.
- suggestions must contain practical improvements.
- Do not rewrite the article.
- Do not include markdown.
`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0.2,
    response_format: {
      type: 'json_object',
    },
    messages: [
      {
        role: 'system',
        content:
          'You are a professional article quality analyzer. Always return valid JSON.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
  });

  const result = JSON.parse(
    response.choices[0].message.content
  );

  return {
    qualityScore: Number(result.qualityScore) || 0,
    grammarScore: Number(result.grammarScore) || 0,
    readabilityScore:
      Number(result.readabilityScore) || 0,
    structureScore:
      Number(result.structureScore) || 0,
    suggestions: Array.isArray(result.suggestions)
      ? result.suggestions
      : [],
  };
};

export {
  analyzeContentQuality,
};