import mongoose from 'mongoose'

const moderationAuditEventSchema = new mongoose.Schema(
  {
    caseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ModerationCase',
      default: null,
    },

    targetType: {
      type: String,
      enum: ['ARTICLE', 'QUIZ', 'COMMENT', 'USER', 'REPORT', 'APPEAL'],
      required: true,
      index: true,
    },

    targetId: {
      type: String,
      required: true,
      index: true,
    },

    eventType: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    actorType: {
      type: String,
      enum: ['AI', 'ADMIN', 'USER', 'SYSTEM'],
      required: true,
    },

    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    riskScore: {
      type: Number,
      min: 0,
      max: 1,
      default: null,
    },

    riskLevel: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', null],
      default: null,
    },

    status: {
      type: String,
      enum: [
        'AUTO_APPROVED',
        'ADMIN_REVIEWED',
        'PENDING_REVIEW',
        'AUTO_BLOCKED',
        'ADMIN_BLOCKED',
        'APPEALED',
        'DISMISSED',
      ],
      required: true,
    },

    reason: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false,
  }
)

moderationAuditEventSchema.index({ targetType: 1, targetId: 1, createdAt: -1 })
moderationAuditEventSchema.index({ status: 1, createdAt: -1 })

export default mongoose.model('ModerationAuditEvent', moderationAuditEventSchema)
