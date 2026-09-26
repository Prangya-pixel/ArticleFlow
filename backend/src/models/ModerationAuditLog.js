import mongoose from 'mongoose';

/**
 * ModerationAuditLog Schema
 * Tracks every automated and manual moderation event across content items.
 * Designed for consumption by Module 7 (AI Moderation Dashboard & Audit).
 */
const moderationAuditLogSchema = new mongoose.Schema(
  {
    contentId: {
      type: String,
      required: true,
      index: true
    },
    contentType: {
      type: String,
      enum: ['article', 'quiz', 'comment'],
      default: 'article'
    },
    action: {
      type: String,
      enum: ['evaluate', 'manual_approve', 'manual_reject', 'reinstate'],
      required: true,
      index: true
    },
    riskScore: {
      type: Number,
      min: 0,
      max: 100
    },
    decision: {
      type: String,
      enum: ['AUTO_APPROVE', 'ADMIN_REVIEW', 'AUTO_BLOCK']
    },
    actor: {
      type: String,
      enum: ['system', 'admin'],
      default: 'system',
      required: true
    },
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: {
      type: String,
      trim: true
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false
  }
);

moderationAuditLogSchema.index({ createdAt: -1 });

export default mongoose.model('ModerationAuditLog', moderationAuditLogSchema);
