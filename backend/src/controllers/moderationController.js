import { approvalService } from '../services/approvalService.js';

/**
 * Controller for Smart Content Approval Module (Module 2)
 */

/**
 * POST /api/moderation/approval/evaluate/:contentId
 * Runs automated evaluation pipeline for a content item.
 */
export async function evaluateContent(req, res, next) {
  try {
    const { contentId } = req.params;
    const { forceScore, reason } = req.body || {};

    const result = await approvalService.evaluate(contentId, {
      forcedScore: forceScore !== undefined ? Number(forceScore) : undefined,
      reason
    });

    return res.status(200).json({
      message: `Content evaluation complete. Outcome: ${result.decision}`,
      ...result
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/moderation/approval/queue
 * Returns paginated list of items awaiting admin moderation review.
 */
export async function getModerationQueue(req, res, next) {
  try {
    const queue = await approvalService.getQueue(req.query);
    return res.status(200).json(queue);
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/moderation/approval/:contentId/decision
 * Admin manual decision (approve or reject) overriding automated outcome.
 */
export async function submitDecision(req, res, next) {
  try {
    const { contentId } = req.params;
    const { decision, reason } = req.body || {};

    if (!decision || !['approve', 'reject'].includes(decision)) {
      return res.status(400).json({ message: "Decision is required and must be 'approve' or 'reject'." });
    }

    if (decision === 'reject' && !reason?.trim()) {
      return res.status(400).json({ message: "A reason is required when rejecting content." });
    }

    const updated = await approvalService.manualDecision(contentId, {
      decision,
      reason: reason?.trim(),
      adminId: req.user?._id
    });

    return res.status(200).json({
      message: `Content successfully ${decision === 'approve' ? 'approved' : 'rejected'}.`,
      content: updated
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/moderation/approval/thresholds
 * Reads active risk-band configuration.
 */
export async function getThresholds(req, res, next) {
  try {
    const thresholds = await approvalService.getThresholds();
    return res.status(200).json(thresholds);
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/moderation/approval/thresholds
 * Updates risk-band thresholds (admin only).
 */
export async function updateThresholds(req, res, next) {
  try {
    const { lowMax, highMin } = req.body || {};

    if (lowMax === undefined || highMin === undefined) {
      return res.status(400).json({ message: 'Both lowMax and highMin thresholds are required.' });
    }

    const updated = await approvalService.updateThresholds({
      lowMax,
      highMin,
      adminId: req.user?._id
    });

    return res.status(200).json({
      message: 'Moderation thresholds updated successfully.',
      thresholds: updated
    });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
}

/**
 * POST /api/moderation/approval/reinstate/:contentId
 * Reinstates blocked content (supports Module 5: Report & Appeal System).
 */
export async function reinstateContent(req, res, next) {
  try {
    const { contentId } = req.params;
    const { reason } = req.body || {};

    const content = await approvalService.reinstate(contentId, {
      reason,
      actorId: req.user?._id
    });

    return res.status(200).json({
      message: 'Content successfully reinstated.',
      content
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/moderation/approval/stats
 * Provides live aggregate statistics for admin dashboard widgets and threshold simulation.
 */
export async function getModerationStats(req, res, next) {
  try {
    const stats = await approvalService.getStats();
    return res.status(200).json(stats);
  } catch (error) {
    next(error);
  }
}
