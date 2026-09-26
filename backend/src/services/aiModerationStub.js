// ============================================================================
// STUB: AI Content Moderation Engine (Module 1)
// ----------------------------------------------------------------------------
// This module simulates the risk-scoring engine built by Module 1 teammates.
// Once Module 1 is merged, replace this stub with the actual service call:
//
// TODO: replace with real call to AI Content Moderation service
// Example:
// import { calculateContentRiskScore } from '../modules/aiModeration/index.js';
// ============================================================================

/**
 * Calculates a simulated AI risk score (0 - 100) for a content item.
 * 
 * Heuristics used for stub simulation:
 * - High risk keywords (scam, casino, crypto giveaway, hack, hate, violence) -> 75-95
 * - Medium risk triggers (unverified links, urgent action words, clickbait, contact me) -> 40-60
 * - Clean editorial content -> 5-25
 *
 * @param {Object} content - Content document or payload with title, excerpt, body, etc.
 * @param {Object} [options]
 * @param {number} [options.forcedScore] - Explicit score to force for deterministic testing
 * @returns {Promise<{ riskScore: number, flags: string[], confidence: number }>}
 */
export async function calculateRiskScore(content, options = {}) {
  // Allow explicit score override during testing / simulation
  if (options.forcedScore !== undefined && options.forcedScore !== null) {
    const forced = Math.min(100, Math.max(0, Number(options.forcedScore)));
    return {
      riskScore: forced,
      flags: forced >= 70 ? ['FORCED_HIGH_RISK'] : forced > 30 ? ['FORCED_MEDIUM_RISK'] : ['CLEAN'],
      confidence: 0.99
    };
  }

  // If content already has a risk score computed by Module 1, respect it
  if (content?.moderation?.riskScore !== undefined && content?.moderation?.riskScore !== null) {
    return {
      riskScore: Number(content.moderation.riskScore),
      flags: ['PRE_SCORED'],
      confidence: 0.95
    };
  }

  const textToAnalyze = [
    content?.title || '',
    content?.excerpt || '',
    content?.body || ''
  ].join(' ').toLowerCase();

  const highRiskKeywords = ['scam', 'free crypto', 'phishing', 'viagra', 'casino bonus', 'hack password', 'hate speech', 'illegal download'];
  const mediumRiskKeywords = ['click here now', 'limited time offer', 'contact via telegram', 'earn $1000', 'whatsapp group', 'buy now'];

  const matchedHigh = highRiskKeywords.filter(k => textToAnalyze.includes(k));
  const matchedMedium = mediumRiskKeywords.filter(k => textToAnalyze.includes(k));

  let score = 15; // default clean baseline
  const flags = [];

  if (matchedHigh.length > 0) {
    score = Math.min(95, 75 + matchedHigh.length * 10);
    flags.push(...matchedHigh.map(k => `KEYWORD_${k.toUpperCase().replace(/\s+/g, '_')}`));
  } else if (matchedMedium.length > 0) {
    score = Math.min(65, 42 + matchedMedium.length * 8);
    flags.push(...matchedMedium.map(k => `TRIGGER_${k.toUpperCase().replace(/\s+/g, '_')}`));
  } else {
    // Generate a subtle deterministic variation based on title length
    const variation = ((content?.title?.length || 10) * 7) % 15;
    score = Math.min(28, 10 + variation);
    flags.push('SAFE_EDITORIAL');
  }

  return {
    riskScore: score,
    flags,
    confidence: 0.92
  };
}
