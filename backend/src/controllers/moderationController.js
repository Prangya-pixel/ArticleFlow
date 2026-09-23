import mongoose from 'mongoose'
import ModerationResult from '../models/ModerationResult.js'
import ModerationAuditEvent from '../models/ModerationAuditEvent.js'
import { analyzeContent } from '../services/moderationService.js'

const ALLOWED_CONTENT_TYPES = ['Article', 'Quiz', 'Comment']

const CONTENT_TYPE_MAP = {
  Article: 'ARTICLE',
  Quiz: 'QUIZ',
  Comment: 'COMMENT',
}

const STATUS_MAP = {
  SAFE: 'AUTO_APPROVED',
  REVIEW: 'PENDING_REVIEW',
  BLOCK: 'AUTO_BLOCKED',
}

export async function recordModerationAuditEvent({
  result,
  eventType = 'AI_SCAN',
  actorType = 'AI',
  actorId = null,
  status,
  reason = '',
}) {
  return ModerationAuditEvent.create({
    targetType: CONTENT_TYPE_MAP[result.contentType],
    targetId: String(result.contentId || result._id),
    eventType,
    actorType,
    actorId,
    riskScore: result.riskScore,
    riskLevel: result.riskLevel,
    status: status || STATUS_MAP[result.recommendation],
    reason,
  })
}

export async function analyzeModeration(req, res, next) {
  try {
    const {
      contentId = null,
      contentType,
      title = '',
      content,
      authorName = null,
    } = req.body

    if (!contentType) {
      return res.status(400).json({
        message: 'Content type is required.',
      })
    }

    if (!ALLOWED_CONTENT_TYPES.includes(contentType)) {
      return res.status(400).json({
        message: `Content type must be one of: ${ALLOWED_CONTENT_TYPES.join(', ')}.`,
      })
    }

    if (typeof content !== 'string' || !content.trim()) {
      return res.status(400).json({
        message: 'Content is required.',
      })
    }

    if (typeof title !== 'string') {
      return res.status(400).json({
        message: 'Title must be a string.',
      })
    }

    const analysis = await analyzeContent({
      title: title.trim(),
      content: content.trim(),
    })

    const moderationResult = await ModerationResult.create({
      contentId,
      contentType,
      title: title.trim(),
      content: content.trim(),

      authorId: req.user?._id || null,
      authorName:
        authorName?.trim() ||
        req.user?.name ||
        req.user?.username ||
        'Unknown',

      riskScore: analysis.riskScore,
      riskLevel: analysis.riskLevel,
      recommendation: analysis.recommendation,
      flags: analysis.flags,
      categoryScores: analysis.categoryScores,
      aiFlagged: analysis.aiFlagged,
    })

    await recordModerationAuditEvent({
      result: moderationResult,
      reason: analysis.aiFlagged
        ? 'AI moderation detected one or more policy signals.'
        : 'AI moderation found no policy violations.',
    })

    return res.status(201).json({
      message: 'Content moderation completed successfully.',
      result: moderationResult,
    })
  } catch (error) {
    next(error)
  }
}

export async function getModerationResults(req, res, next) {
  try {
    const results = await ModerationResult.find()
      .sort({ createdAt: -1 })

    return res.status(200).json({
      results,
    })
  } catch (error) {
    next(error)
  }
}

export async function getModerationResultById(req, res, next) {
  try {
    const { id } = req.params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: 'Invalid moderation result ID.',
      })
    }

    const result = await ModerationResult.findById(id)

    if (!result) {
      return res.status(404).json({
        message: 'Moderation result not found.',
      })
    }

    return res.status(200).json({
      result,
    })
  } catch (error) {
    next(error)
  }
}

export async function getModerationAuditEvents(req, res, next) {
  try {
    const query = {}

    if (req.query.targetType) query.targetType = req.query.targetType
    if (req.query.status) query.status = req.query.status
    if (req.query.riskLevel) query.riskLevel = req.query.riskLevel
    if (req.query.eventType) query.eventType = req.query.eventType

    const events = await ModerationAuditEvent.find(query)
      .sort({ createdAt: -1 })
      .limit(200)

    return res.status(200).json({ events })
  } catch (error) {
    next(error)
  }
}