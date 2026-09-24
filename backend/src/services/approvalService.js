import Article from '../models/Article.js';
import Notification from '../models/Notification.js';
import ModerationAuditLog from '../models/ModerationAuditLog.js';
import ModerationThresholds from '../models/ModerationThresholds.js';
import { calculateRiskScore } from './aiModerationStub.js';

/**
 * Pure function: Resolves moderation outcome based on risk score and thresholds.
 *
 * @param {number|null|undefined} riskScore - Content risk score (0-100)
 * @param {{ lowMax: number, highMin: number }} thresholds - Cutoff limits
 * @returns {'AUTO_APPROVE' | 'ADMIN_REVIEW' | 'AUTO_BLOCK' | 'PENDING_SCORE'}
 */
export function resolveDecision(riskScore, thresholds = { lowMax: 30, highMin: 70 }) {
  if (riskScore === null || riskScore === undefined || isNaN(Number(riskScore))) {
    return 'PENDING_SCORE';
  }

  const score = Number(riskScore);
  const lowMax = thresholds?.lowMax !== undefined ? Number(thresholds.lowMax) : 30;
  const highMin = thresholds?.highMin !== undefined ? Number(thresholds.highMin) : 70;

  if (score <= lowMax) {
    return 'AUTO_APPROVE';
  }
  if (score >= highMin) {
    return 'AUTO_BLOCK';
  }
  return 'ADMIN_REVIEW';
}

/**
 * Safely delivers a notification to the author regarding content moderation status.
 */
export async function notifyAuthor(userId, reason, contentId, type = 'AUTO_BLOCKED') {
  if (!userId) return null;
  try {
    let message = '';
    if (type === 'AUTO_BLOCKED') {
      message = `Your content was auto-blocked by AI moderation. Reason: ${reason || 'Exceeded risk threshold'}`;
    } else if (type === 'REJECTED') {
      message = `Your content was rejected during admin review. Reason: ${reason || 'Does not meet community guidelines'}`;
    } else if (type === 'AUTO_APPROVED' || type === 'APPROVED') {
      message = `Your content has been approved and is now live!`;
    } else if (type === 'REINSTATED') {
      message = `Your content has been reinstated following appeal review.`;
    } else {
      message = reason || 'Content status updated';
    }

    return await Notification.create({
      recipient: userId,
      article: contentId,
      type,
      message
    });
  } catch (err) {
    console.error(`[approvalService] Failed to deliver notification to user ${userId}:`, err.message);
    return null;
  }
}

/**
 * Smart Content Approval Service Layer (Module 2)
 */
export const approvalService = {
  /**
   * Fetches active threshold configuration.
   */
  async getThresholds() {
    return await ModerationThresholds.getSingleton();
  },

  /**
   * Updates threshold configuration (admin only).
   */
  async updateThresholds({ lowMax, highMin, adminId }) {
    return await ModerationThresholds.updateSingleton({ lowMax, highMin, adminId });
  },

  /**
   * Evaluates a content item through the AI risk scoring and routing pipeline.
   *
   * @param {string} contentId - ID/Slug of the content item
   * @param {Object} [options] - Optional evaluation options (e.g. forcedScore for testing)
   */
  async evaluate(contentId, options = {}) {
    const article = await Article.findById(contentId);
    if (!article) {
      const err = new Error(`Content not found with ID: ${contentId}`);
      err.status = 404;
      throw err;
    }

    const thresholds = await this.getThresholds();

    // Determine risk score (from options, article document, or AI scoring engine stub)
    let score = options.forcedScore !== undefined ? options.forcedScore : article.moderation?.riskScore;
    let flags = [];

    if (score === undefined || score === null) {
      const aiResult = await calculateRiskScore(article, options);
      score = aiResult.riskScore;
      flags = aiResult.flags || [];
    }

    // Handle edge case: missing/unscored content
    const decision = resolveDecision(score, thresholds);
    if (decision === 'PENDING_SCORE') {
      article.moderation = {
        ...article.moderation,
        status: 'pending_score',
        riskScore: null,
        decision: null,
        decidedBy: null,
        reason: 'Awaiting AI risk score from moderation engine'
      };
      await article.save();
      return { article, decision: 'PENDING_SCORE', riskScore: null, thresholds };
    }

    // Apply outcome according to risk band
    article.moderation = article.moderation || {};
    article.moderation.riskScore = score;
    article.moderation.decision = decision;
    article.moderation.decidedBy = 'system';
    article.moderation.decidedAt = new Date();

    if (decision === 'AUTO_APPROVE') {
      article.status = 'Published';
      article.publishedAt = article.publishedAt || new Date();
      article.moderation.status = 'published';
      article.moderation.reason = 'Risk score within safe threshold';
    } else if (decision === 'ADMIN_REVIEW') {
      article.status = 'Pending';
      article.moderation.status = 'pending_review';
      article.moderation.reason = 'Risk score requires administrative review';
    } else if (decision === 'AUTO_BLOCK') {
      article.status = 'Rejected';
      article.moderation.status = 'blocked';
      article.moderation.reason = options.reason || 'Auto-blocked by AI: Risk score exceeded acceptable threshold';
    }

    await article.save();

    // Record audit log for Module 7 consumption
    await ModerationAuditLog.create({
      contentId: article._id,
      contentType: 'article',
      action: 'evaluate',
      riskScore: score,
      decision,
      actor: 'system',
      reason: article.moderation.reason,
      metadata: { thresholds: { lowMax: thresholds.lowMax, highMin: thresholds.highMin }, flags }
    });

    // Notify author if auto-blocked
    if (decision === 'AUTO_BLOCK') {
      await notifyAuthor(article.author, article.moderation.reason, article._id, 'AUTO_BLOCKED');
    }

    return {
      article,
      decision,
      riskScore: score,
      thresholds: { lowMax: thresholds.lowMax, highMin: thresholds.highMin }
    };
  },

  /**
   * Applies manual administrative override (Approve / Reject) from the moderation queue.
   *
   * @param {string} contentId - ID of content to decide on
   * @param {Object} params
   * @param {'approve' | 'reject'} params.decision - Admin decision
   * @param {string} [params.reason] - Admin reason note
   * @param {string} params.adminId - Admin user ID
   */
  async manualDecision(contentId, { decision, reason, adminId }) {
    if (!['approve', 'reject'].includes(decision)) {
      const err = new Error("Invalid decision. Must be 'approve' or 'reject'.");
      err.status = 400;
      throw err;
    }

    const article = await Article.findById(contentId);
    if (!article) {
      const err = new Error(`Content not found with ID: ${contentId}`);
      err.status = 404;
      throw err;
    }

    const note = (reason || '').trim();
    article.reviewedBy = adminId;
    article.reviewedAt = new Date();
    article.moderation = article.moderation || {};
    article.moderation.decidedBy = 'admin';
    article.moderation.adminId = adminId;
    article.moderation.decidedAt = new Date();

    let auditAction = '';
    let notificationType = '';

    if (decision === 'approve') {
      article.status = 'Published';
      article.publishedAt = article.publishedAt || new Date();
      article.moderation.status = 'published';
      article.moderation.decision = 'AUTO_APPROVE';
      article.moderation.reason = note || 'Manually approved by administrator';
      auditAction = 'manual_approve';
      notificationType = 'APPROVED';
    } else {
      article.status = 'Rejected';
      article.moderation.status = 'blocked';
      article.moderation.decision = 'AUTO_BLOCK';
      article.moderation.reason = note || 'Rejected by administrator';
      auditAction = 'manual_reject';
      notificationType = 'REJECTED';
    }

    await article.save();

    // Log manual admin action
    await ModerationAuditLog.create({
      contentId: article._id,
      contentType: 'article',
      action: auditAction,
      riskScore: article.moderation.riskScore,
      decision: article.moderation.decision,
      actor: 'admin',
      actorId: adminId,
      reason: article.moderation.reason
    });

    // Notify author of manual decision
    await notifyAuthor(article.author, article.moderation.reason, article._id, notificationType);

    return article;
  },

  /**
   * Reinstates blocked content (supports Module 5: Report & Appeal System).
   *
   * @param {string} contentId
   * @param {Object} [options]
   * @param {string} [options.reason]
   * @param {string} [options.actorId]
   */
  async reinstate(contentId, options = {}) {
    const article = await Article.findById(contentId);
    if (!article) {
      const err = new Error(`Content not found with ID: ${contentId}`);
      err.status = 404;
      throw err;
    }

    const reason = options.reason || 'Reinstated after successful appeal review';
    article.status = 'Published';
    article.publishedAt = article.publishedAt || new Date();
    article.moderation = article.moderation || {};
    article.moderation.status = 'published';
    article.moderation.reason = reason;
    article.moderation.decidedBy = options.actorId ? 'admin' : 'system';
    article.moderation.decidedAt = new Date();
    if (options.actorId) article.moderation.adminId = options.actorId;

    await article.save();

    await ModerationAuditLog.create({
      contentId: article._id,
      contentType: 'article',
      action: 'reinstate',
      riskScore: article.moderation.riskScore,
      decision: 'AUTO_APPROVE',
      actor: options.actorId ? 'admin' : 'system',
      actorId: options.actorId,
      reason
    });

    await notifyAuthor(article.author, reason, article._id, 'REINSTATED');

    return article;
  },

  /**
   * Retrieves paginated moderation queue of items pending review.
   *
   * @param {Object} query - Filter and pagination options
   */
  async getQueue(query = {}) {
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const mongoQuery = {
      $or: [
        { 'moderation.status': 'pending_review' },
        { status: 'Pending', 'moderation.status': { $ne: 'blocked' } }
      ]
    };

    // Risk score range filters
    if (query.riskBand === 'medium') {
      const thresholds = await this.getThresholds();
      mongoQuery['moderation.riskScore'] = { $gt: thresholds.lowMax, $lt: thresholds.highMin };
    } else if (query.riskMin !== undefined || query.riskMax !== undefined) {
      mongoQuery['moderation.riskScore'] = {};
      if (query.riskMin !== undefined) mongoQuery['moderation.riskScore'].$gte = Number(query.riskMin);
      if (query.riskMax !== undefined) mongoQuery['moderation.riskScore'].$lte = Number(query.riskMax);
    }

    // Category / Content type filter
    if (query.category) {
      mongoQuery.category = new RegExp(`^${query.category.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
    }

    // Date range filter
    if (query.dateFrom || query.dateTo) {
      mongoQuery.createdAt = {};
      if (query.dateFrom) mongoQuery.createdAt.$gte = new Date(query.dateFrom);
      if (query.dateTo) mongoQuery.createdAt.$lte = new Date(query.dateTo);
    }

    // Text search filter
    if (query.search?.trim()) {
      mongoQuery.$text = { $search: query.search.trim() };
    }

    // Sorting
    const sortField = query.sortBy === 'riskScore' ? 'moderation.riskScore' : 'createdAt';
    const sortOrder = query.order === 'asc' ? 1 : -1;
    const sort = { [sortField]: sortOrder };

    const [items, total] = await Promise.all([
      Article.find(mongoQuery)
        .populate('author', 'name email avatar')
        .sort(sort)
        .skip(skip)
        .limit(limit),
      Article.countDocuments(mongoQuery)
    ]);

    return {
      items: items.map(doc => {
        const item = doc.toJSON ? doc.toJSON() : doc;
        return {
          ...item,
          id: item._id,
          contentType: 'article',
          riskScore: item.moderation?.riskScore ?? null,
          moderationStatus: item.moderation?.status ?? (item.status === 'Pending' ? 'pending_review' : item.status.toLowerCase()),
          authorName: item.authorName || item.author?.name || 'Unknown'
        };
      }),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1
      }
    };
  },

  /**
   * Aggregates moderation statistics for dashboard widgets and live threshold preview.
   */
  async getStats() {
    const thresholds = await this.getThresholds();

    const [safeCount, needsReviewCount, blockedCount, totalCount, recentArticles] = await Promise.all([
      Article.countDocuments({
        $or: [
          { 'moderation.status': 'published' },
          { status: 'Published' }
        ]
      }),
      Article.countDocuments({
        $or: [
          { 'moderation.status': 'pending_review' },
          { status: 'Pending' }
        ]
      }),
      Article.countDocuments({
        $or: [
          { 'moderation.status': 'blocked' },
          { status: 'Rejected' }
        ]
      }),
      Article.countDocuments({}),
      Article.find({}, { 'moderation.riskScore': 1 }).limit(200)
    ]);

    // Calculate score distribution across recent items to power live threshold adjustment preview
    let safePct = 0;
    let reviewPct = 0;
    let blockedPct = 0;

    const scoredItems = recentArticles
      .map(a => a.moderation?.riskScore)
      .filter(s => s !== null && s !== undefined && !isNaN(s));

    if (scoredItems.length > 0) {
      const safe = scoredItems.filter(s => s <= thresholds.lowMax).length;
      const blocked = scoredItems.filter(s => s >= thresholds.highMin).length;
      const review = scoredItems.length - safe - blocked;

      safePct = Math.round((safe / scoredItems.length) * 100);
      blockedPct = Math.round((blocked / scoredItems.length) * 100);
      reviewPct = 100 - safePct - blockedPct;
    } else {
      // Default baseline distribution if no items scored yet
      const total = (safeCount + needsReviewCount + blockedCount) || 1;
      safePct = Math.round((safeCount / total) * 100);
      reviewPct = Math.round((needsReviewCount / total) * 100);
      blockedPct = Math.max(0, 100 - safePct - reviewPct);
    }

    return {
      counts: {
        safe: safeCount,
        needsReview: needsReviewCount,
        blocked: blockedCount,
        total: totalCount
      },
      thresholds: {
        lowMax: thresholds.lowMax,
        highMin: thresholds.highMin
      },
      distribution: {
        safePct,
        reviewPct,
        blockedPct,
        sampleSize: scoredItems.length || totalCount
      }
    };
  }
};
