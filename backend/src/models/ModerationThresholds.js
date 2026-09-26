import mongoose from 'mongoose';

/**
 * ModerationThresholds Schema (Singleton)
 * Configures the risk band boundaries for the automated content approval engine:
 * - score <= lowMax: Auto-approve & publish immediately
 * - lowMax < score < highMin: Admin review queue (pending review)
 * - score >= highMin: Auto-block & notify author
 */
const moderationThresholdsSchema = new mongoose.Schema(
  {
    lowMax: {
      type: Number,
      required: true,
      default: 30,
      min: 0,
      max: 100
    },
    highMin: {
      type: Number,
      required: true,
      default: 70,
      min: 0,
      max: 100
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    versionKey: false
  }
);

// Fallback environment thresholds if database record is not yet initialized
const ENV_LOW_MAX = Number(process.env.MODERATION_LOW_MAX) || 30;
const ENV_HIGH_MIN = Number(process.env.MODERATION_HIGH_MIN) || 70;

/**
 * Get the active singleton thresholds document, creating the default document if missing.
 */
moderationThresholdsSchema.statics.getSingleton = async function () {
  let doc = await this.findOne();
  if (!doc) {
    try {
      doc = await this.create({
        lowMax: ENV_LOW_MAX,
        highMin: ENV_HIGH_MIN,
        updatedAt: new Date()
      });
    } catch {
      // In case of race condition or read-only DB, return fallback memory object
      return {
        lowMax: ENV_LOW_MAX,
        highMin: ENV_HIGH_MIN,
        updatedAt: new Date()
      };
    }
  }
  return doc;
};

/**
 * Update the singleton threshold document with boundary validation.
 */
moderationThresholdsSchema.statics.updateSingleton = async function ({ lowMax, highMin, adminId }) {
  const parsedLow = Number(lowMax);
  const parsedHigh = Number(highMin);

  if (isNaN(parsedLow) || isNaN(parsedHigh)) {
    throw new Error('Threshold values must be numbers between 0 and 100.');
  }

  if (parsedLow < 0 || parsedLow > 100 || parsedHigh < 0 || parsedHigh > 100) {
    throw new Error('Threshold values must be between 0 and 100.');
  }

  if (parsedLow >= parsedHigh) {
    throw new Error('Low-risk threshold (lowMax) must be strictly less than high-risk threshold (highMin).');
  }

  let doc = await this.findOne();
  if (!doc) {
    doc = new this({
      lowMax: parsedLow,
      highMin: parsedHigh,
      updatedBy: adminId,
      updatedAt: new Date()
    });
  } else {
    doc.lowMax = parsedLow;
    doc.highMin = parsedHigh;
    if (adminId) doc.updatedBy = adminId;
    doc.updatedAt = new Date();
  }

  await doc.save();
  return doc;
};

export default mongoose.model('ModerationThresholds', moderationThresholdsSchema);
