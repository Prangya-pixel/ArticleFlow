import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { approvalService, notifyAuthor } from '../services/approvalService.js';
import Article from '../models/Article.js';
import ModerationAuditLog from '../models/ModerationAuditLog.js';
import ModerationThresholds from '../models/ModerationThresholds.js';
import Notification from '../models/Notification.js';

describe('Smart Content Approval Service (approvalService)', () => {
  let createdAuditLogs = [];
  let createdNotifications = [];
  let mockArticleStore = {};

  beforeEach(() => {
    createdAuditLogs = [];
    createdNotifications = [];
    mockArticleStore = {
      'article-low-1': {
        _id: 'article-low-1',
        title: 'Safe Tech Trends 2026',
        excerpt: 'An insightful overview of cloud computing.',
        body: 'Cloud computing continues to evolve with distributed systems.',
        author: 'user-author-123',
        status: 'Pending',
        moderation: {},
        async save() { return this; }
      },
      'article-med-1': {
        _id: 'article-med-1',
        title: 'Exciting Promotion Inside',
        excerpt: 'Limited time offer contact us via telegram for promo.',
        body: 'Click here now to participate in our exclusive giveaway.',
        author: 'user-author-456',
        status: 'Pending',
        moderation: {},
        async save() { return this; }
      },
      'article-high-1': {
        _id: 'article-high-1',
        title: 'Guaranteed Free Crypto Scam',
        excerpt: 'Phishing scam test post.',
        body: 'Free crypto and casino bonus right here!',
        author: 'user-author-789',
        status: 'Pending',
        moderation: {},
        async save() { return this; }
      }
    };

    // Mock Article.findById
    Article.findById = async (id) => mockArticleStore[id] || null;

    // Mock ModerationThresholds.getSingleton
    ModerationThresholds.getSingleton = async () => ({
      lowMax: 30,
      highMin: 70
    });

    // Mock ModerationAuditLog.create
    ModerationAuditLog.create = async (doc) => {
      createdAuditLogs.push(doc);
      return doc;
    };

    // Mock Notification.create
    Notification.create = async (doc) => {
      createdNotifications.push(doc);
      return doc;
    };
  });

  describe('Outcome 1: Low Risk -> AUTO_APPROVE', () => {
    it('should immediately publish low risk content and log audit record', async () => {
      const result = await approvalService.evaluate('article-low-1', { forcedScore: 20 });

      assert.equal(result.decision, 'AUTO_APPROVE');
      assert.equal(result.riskScore, 20);
      assert.equal(result.article.status, 'Published');
      assert.equal(result.article.moderation.status, 'published');
      assert.equal(result.article.moderation.decidedBy, 'system');

      assert.equal(createdAuditLogs.length, 1);
      assert.equal(createdAuditLogs[0].action, 'evaluate');
      assert.equal(createdAuditLogs[0].decision, 'AUTO_APPROVE');
      assert.equal(createdAuditLogs[0].actor, 'system');
      assert.equal(createdAuditLogs[0].contentId, 'article-low-1');
    });
  });

  describe('Outcome 2: Medium Risk -> ADMIN_REVIEW', () => {
    it('should route medium risk content to admin queue and log audit record', async () => {
      const result = await approvalService.evaluate('article-med-1', { forcedScore: 50 });

      assert.equal(result.decision, 'ADMIN_REVIEW');
      assert.equal(result.riskScore, 50);
      assert.equal(result.article.status, 'Pending');
      assert.equal(result.article.moderation.status, 'pending_review');
      assert.equal(result.article.moderation.decidedBy, 'system');

      assert.equal(createdAuditLogs.length, 1);
      assert.equal(createdAuditLogs[0].decision, 'ADMIN_REVIEW');
      assert.equal(createdNotifications.length, 0); // No block notification for pending review
    });
  });

  describe('Outcome 3: High Risk -> AUTO_BLOCK', () => {
    it('should auto-block high risk content, log audit, and notify the author', async () => {
      const result = await approvalService.evaluate('article-high-1', { forcedScore: 85 });

      assert.equal(result.decision, 'AUTO_BLOCK');
      assert.equal(result.riskScore, 85);
      assert.equal(result.article.status, 'Rejected');
      assert.equal(result.article.moderation.status, 'blocked');
      assert.equal(result.article.moderation.decidedBy, 'system');

      assert.equal(createdAuditLogs.length, 1);
      assert.equal(createdAuditLogs[0].decision, 'AUTO_BLOCK');

      assert.equal(createdNotifications.length, 1);
      assert.equal(createdNotifications[0].recipient, 'user-author-789');
      assert.equal(createdNotifications[0].type, 'AUTO_BLOCKED');
    });
  });

  describe('Admin Manual Override', () => {
    it('should approve pending content when admin manually overrides', async () => {
      const updated = await approvalService.manualDecision('article-med-1', {
        decision: 'approve',
        reason: 'Verified by senior editor as valid content.',
        adminId: 'admin-id-999'
      });

      assert.equal(updated.status, 'Published');
      assert.equal(updated.moderation.status, 'published');
      assert.equal(updated.moderation.decidedBy, 'admin');

      assert.equal(createdAuditLogs.length, 1);
      assert.equal(createdAuditLogs[0].action, 'manual_approve');
      assert.equal(createdAuditLogs[0].actor, 'admin');
      assert.equal(createdAuditLogs[0].actorId, 'admin-id-999');

      assert.equal(createdNotifications.length, 1);
      assert.equal(createdNotifications[0].type, 'APPROVED');
    });

    it('should reject pending content and notify author with custom reason', async () => {
      const updated = await approvalService.manualDecision('article-med-1', {
        decision: 'reject',
        reason: 'Violates our commercial promotion policy.',
        adminId: 'admin-id-999'
      });

      assert.equal(updated.status, 'Rejected');
      assert.equal(updated.moderation.status, 'blocked');
      assert.equal(updated.moderation.decidedBy, 'admin');

      assert.equal(createdAuditLogs.length, 1);
      assert.equal(createdAuditLogs[0].action, 'manual_reject');
      assert.equal(createdAuditLogs[0].reason, 'Violates our commercial promotion policy.');

      assert.equal(createdNotifications.length, 1);
      assert.equal(createdNotifications[0].type, 'REJECTED');
      assert.match(createdNotifications[0].message, /Violates our commercial promotion policy/);
    });

    it('should throw error when invalid decision string is provided', async () => {
      await assert.rejects(
        async () => {
          await approvalService.manualDecision('article-med-1', {
            decision: 'invalid_decision',
            adminId: 'admin-id-999'
          });
        },
        /Invalid decision/
      );
    });
  });

  describe('Module 5 Appeal Reinstatement: reinstate()', () => {
    it('should reinstate blocked content to published state and log audit entry', async () => {
      // First auto-block
      await approvalService.evaluate('article-high-1', { forcedScore: 90 });
      createdAuditLogs = [];
      createdNotifications = [];

      // Now reinstate
      const reinstated = await approvalService.reinstate('article-high-1', {
        reason: 'Author submitted proof of legitimate ownership on appeal.',
        actorId: 'admin-appeals-1'
      });

      assert.equal(reinstated.status, 'Published');
      assert.equal(reinstated.moderation.status, 'published');

      assert.equal(createdAuditLogs.length, 1);
      assert.equal(createdAuditLogs[0].action, 'reinstate');
      assert.equal(createdAuditLogs[0].actor, 'admin');

      assert.equal(createdNotifications.length, 1);
      assert.equal(createdNotifications[0].type, 'REINSTATED');
    });
  });

  describe('notifyAuthor() helper', () => {
    it('should return null when userId is missing', async () => {
      const res = await notifyAuthor(null, 'Reason', 'content-id');
      assert.equal(res, null);
    });

    it('should format message appropriately for AUTO_BLOCKED type', async () => {
      await notifyAuthor('user-1', 'Exceeded toxicity score', 'art-1', 'AUTO_BLOCKED');
      assert.equal(createdNotifications.length, 1);
      assert.match(createdNotifications[0].message, /auto-blocked by AI/);
    });
  });
});
