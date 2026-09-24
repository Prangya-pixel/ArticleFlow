import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { resolveDecision } from '../services/approvalService.js';

describe('Smart Content Approval: resolveDecision()', () => {
  const standardThresholds = { lowMax: 30, highMin: 70 };

  describe('Low-risk band -> AUTO_APPROVE', () => {
    it('should auto-approve minimum score 0', () => {
      assert.equal(resolveDecision(0, standardThresholds), 'AUTO_APPROVE');
    });

    it('should auto-approve intermediate low score 15', () => {
      assert.equal(resolveDecision(15, standardThresholds), 'AUTO_APPROVE');
    });

    it('should auto-approve exactly at lowMax boundary (30)', () => {
      assert.equal(resolveDecision(30, standardThresholds), 'AUTO_APPROVE');
    });

    it('should handle numeric string representation "25"', () => {
      assert.equal(resolveDecision('25', standardThresholds), 'AUTO_APPROVE');
    });
  });

  describe('Medium-risk band -> ADMIN_REVIEW', () => {
    it('should route score just above lowMax (31) to admin review', () => {
      assert.equal(resolveDecision(31, standardThresholds), 'ADMIN_REVIEW');
    });

    it('should route midpoint score (50) to admin review', () => {
      assert.equal(resolveDecision(50, standardThresholds), 'ADMIN_REVIEW');
    });

    it('should route score just below highMin (69) to admin review', () => {
      assert.equal(resolveDecision(69, standardThresholds), 'ADMIN_REVIEW');
    });

    it('should handle decimal scores in medium band (45.7)', () => {
      assert.equal(resolveDecision(45.7, standardThresholds), 'ADMIN_REVIEW');
    });
  });

  describe('High-risk band -> AUTO_BLOCK', () => {
    it('should auto-block exactly at highMin boundary (70)', () => {
      assert.equal(resolveDecision(70, standardThresholds), 'AUTO_BLOCK');
    });

    it('should auto-block intermediate high score 85', () => {
      assert.equal(resolveDecision(85, standardThresholds), 'AUTO_BLOCK');
    });

    it('should auto-block maximum score 100', () => {
      assert.equal(resolveDecision(100, standardThresholds), 'AUTO_BLOCK');
    });

    it('should auto-block score exceeding 100 (e.g. 105)', () => {
      assert.equal(resolveDecision(105, standardThresholds), 'AUTO_BLOCK');
    });
  });

  describe('Missing / un-scored content -> PENDING_SCORE', () => {
    it('should return PENDING_SCORE for null score', () => {
      assert.equal(resolveDecision(null, standardThresholds), 'PENDING_SCORE');
    });

    it('should return PENDING_SCORE for undefined score', () => {
      assert.equal(resolveDecision(undefined, standardThresholds), 'PENDING_SCORE');
    });

    it('should return PENDING_SCORE for non-numeric string', () => {
      assert.equal(resolveDecision('not_a_number', standardThresholds), 'PENDING_SCORE');
    });

    it('should return PENDING_SCORE for NaN', () => {
      assert.equal(resolveDecision(NaN, standardThresholds), 'PENDING_SCORE');
    });
  });

  describe('Custom threshold configurations', () => {
    const conservativeThresholds = { lowMax: 15, highMin: 85 };

    it('should respect custom low cutoff', () => {
      assert.equal(resolveDecision(15, conservativeThresholds), 'AUTO_APPROVE');
      assert.equal(resolveDecision(16, conservativeThresholds), 'ADMIN_REVIEW');
    });

    it('should respect custom high cutoff', () => {
      assert.equal(resolveDecision(84, conservativeThresholds), 'ADMIN_REVIEW');
      assert.equal(resolveDecision(85, conservativeThresholds), 'AUTO_BLOCK');
    });

    it('should use fallback defaults when thresholds parameter is empty', () => {
      assert.equal(resolveDecision(20, {}), 'AUTO_APPROVE');
      assert.equal(resolveDecision(50, {}), 'ADMIN_REVIEW');
      assert.equal(resolveDecision(80, {}), 'AUTO_BLOCK');
    });
  });
});
