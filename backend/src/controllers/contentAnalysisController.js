import {
  analyzeContentQuality,
} from '../services/contentQualityService.js';

import {
  analyzeDuplicateContent,
} from '../services/duplicateDetectionService.js';

const analyzeArticleContent = async (req, res) => {
  try {
    const {
      title,
      excerpt,
      body,
      articleId,
    } = req.body;

    if (!title || !body) {
      return res.status(400).json({
        success: false,
        message: 'Title and article body are required',
      });
    }

    const [
      qualityResult,
      duplicateResult,
    ] = await Promise.all([
      analyzeContentQuality({
        title,
        content: body,
      }),

      analyzeDuplicateContent({
        title,
        excerpt,
        body,
        articleId,
      }),
    ]);

    return res.status(200).json({
      success: true,

      quality: qualityResult,

      duplicate: duplicateResult,
    });

  } catch (error) {
    console.error(
      'Content analysis error:',
      error
    );

    return res.status(500).json({
      success: false,
      message: 'Failed to analyze article content',
    });
  }
};

export {
  analyzeArticleContent,
};