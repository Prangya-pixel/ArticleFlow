# Module 2: Smart Content Approval — Documentation

## Overview

The **Smart Content Approval** module acts as the automated decision and routing engine within the AI Moderation architecture. After a content submission receives an AI risk score (from Module 1), Module 2 routes the item to one of three outcomes:

| Risk Band | Risk Score Range | Decision Action | Status Update | Author Notification |
|---|---|---|---|---|
| **Low Risk** | `0 <= score <= lowMax` (default: 0–30) | **Auto-Approve** | `published` | Optional / Live notice |
| **Medium Risk** | `lowMax < score < highMin` (default: 31–69) | **Admin Review** | `pending_review` | None (queued for admin) |
| **High Risk** | `highMin <= score <= 100` (default: 70–100) | **Auto-Block** | `blocked` | Auto-block alert with reason |

---

## 1. REST API Endpoints

All endpoints are hosted under `/api/moderation/approval/`:

### Automated Evaluation
- **`POST /api/moderation/approval/evaluate/:contentId`**
  - **Auth**: Authenticated author / worker / admin (`requireAuth`)
  - **Body (optional)**: `{ forceScore: number, reason: string }`
  - **Description**: Triggers risk scoring (or reads existing score) and routes content according to threshold boundaries. Emits a `ModerationAuditLog` record.

### Moderation Queue (Admin)
- **`GET /api/moderation/approval/queue`**
  - **Auth**: Admin (`requireAuth`, `allowRoles('admin')`)
  - **Query parameters**:
    - `page` (default: 1)
    - `limit` (default: 10)
    - `category` (regex filter)
    - `riskBand` (`'medium'`, `'all'`)
    - `riskMin` & `riskMax` (custom score bounds)
    - `search` (full-text search query)
    - `sortBy` (`'createdAt'` | `'riskScore'`)
    - `order` (`'desc'` | `'asc'`)
  - **Response**: `{ items: [...], pagination: { page, limit, total, totalPages } }`

### Manual Override (Admin)
- **`PATCH /api/moderation/approval/:contentId/decision`**
  - **Auth**: Admin (`requireAuth`, `allowRoles('admin')`)
  - **Body**:
    ```json
    {
      "decision": "approve" | "reject",
      "reason": "Optional reason for approval, required for rejection"
    }
    ```
  - **Description**: Overrides AI routing. Updates content status, emits a `ModerationAuditLog` entry with `actor: 'admin'`, and notifies the author on rejection or approval.

### Threshold Configuration (Admin)
- **`GET /api/moderation/approval/thresholds`**
  - Returns active singleton thresholds: `{ lowMax: 30, highMin: 70, updatedAt, updatedBy }`.
- **`PUT /api/moderation/approval/thresholds`**
  - **Body**: `{ "lowMax": 25, "highMin": 75 }`
  - **Validation**: `0 <= lowMax < highMin <= 100`. Only affects future evaluations unless retroactively triggered.

### Dashboard Live Statistics
- **`GET /api/moderation/approval/stats`**
  - Returns aggregate counts for Safe, Needs Review, Blocked, plus active score distributions to power dashboard summary bars and the Threshold Settings live preview widget.

### Appeal Reinstatement (Module 5 Integration)
- **`POST /api/moderation/approval/reinstate/:contentId`**
  - **Auth**: Admin / System
  - **Body**: `{ "reason": "Explanation of overturned appeal" }`
  - **Description**: Called by Module 5 when an appeal is accepted. Reinstates content to `published` status and logs the reinstatement event.

---

## 2. MongoDB Data Models

### 1. `ModerationAuditLog` (`models/ModerationAuditLog.js`)
Emits audit records designed for consumption by **Module 7: AI Moderation Dashboard & Audit**:
```javascript
{
  contentId: String,          // Matches Article._id (UUID)
  contentType: String,        // 'article' | 'quiz' | 'comment'
  action: String,             // 'evaluate' | 'manual_approve' | 'manual_reject' | 'reinstate'
  riskScore: Number,          // 0-100
  decision: String,           // 'AUTO_APPROVE' | 'ADMIN_REVIEW' | 'AUTO_BLOCK'
  actor: String,              // 'system' | 'admin'
  actorId: ObjectId,          // Admin User ObjectId if manual override
  reason: String,             // Reason explanation
  metadata: Mixed,            // Thresholds snapshot & triggered flags
  createdAt: Date             // Timestamp (indexed)
}
```

### 2. `ModerationThresholds` (`models/ModerationThresholds.js`)
Singleton configuration document:
```javascript
{
  lowMax: { type: Number, default: 30 },
  highMin: { type: Number, default: 70 },
  updatedBy: ObjectId,
  updatedAt: Date
}
```

### 3. Extended `Article.moderation` Subdocument (`models/Article.js`)
```javascript
moderation: {
  riskScore: Number,          // 0-100 or null if pending score
  decision: String,           // 'AUTO_APPROVE' | 'ADMIN_REVIEW' | 'AUTO_BLOCK' | null
  status: String,             // 'pending_score' | 'pending_review' | 'published' | 'blocked'
  decidedBy: String,          // 'system' | 'admin' | null
  decidedAt: Date,
  adminId: ObjectId,          // ref User if decided manually
  reason: String
}
```

---

## 3. How to Plug In the Real Risk-Score Source (Module 1 Integration)

Module 1 (AI Content Moderation risk scoring engine) produces the risk score. To swap out our stub with the real engine:

1. Open [`backend/src/services/aiModerationStub.js`](file:///c:/Users/manus/OneDrive/Desktop/Internship/ArticleFlow/backend/src/services/aiModerationStub.js).
2. Locate the marked section:
   ```javascript
   // ============================================================================
   // STUB: AI Content Moderation Engine (Module 1)
   // TODO: Replace with real call to AI Content Moderation service
   // ============================================================================
   ```
3. Replace the `calculateRiskScore()` implementation or redirect it to Module 1's service:
   ```javascript
   import { scoreContent } from '../modules/aiModeration/index.js';

   export async function calculateRiskScore(content, options = {}) {
     return await scoreContent(content);
   }
   ```
Because `approvalService.evaluate()` expects `{ riskScore, flags }` as returned by `calculateRiskScore`, no changes in `approvalService.js` or controllers are required.

---

## 4. Pure Function & Unit Tests

The pure threshold decision function is exported from [`backend/src/services/approvalService.js`](file:///c:/Users/manus/OneDrive/Desktop/Internship/ArticleFlow/backend/src/services/approvalService.js):

```javascript
export function resolveDecision(riskScore, thresholds = { lowMax: 30, highMin: 70 })
```

### Running Tests
Execute the comprehensive Node test suite:
```powershell
cd backend
npm test
```
All 28 tests cover:
- Boundary conditions (0, 30, 31, 69, 70, 100)
- Missing / null / non-numeric scores (`PENDING_SCORE`)
- Custom threshold parameters
- The three outcome paths (`AUTO_APPROVE`, `ADMIN_REVIEW`, `AUTO_BLOCK`)
- Admin manual approve & reject
- Appeal reinstatement
- Notification and audit log creation

---

## 5. Teammate Integration Cheatsheet

- **Module 1 (AI Risk Engine)**:
  - Write `article.moderation.riskScore = score` before calling `POST /api/moderation/approval/evaluate/:contentId`.
- **Module 5 (Reports & Appeals)**:
  - Call `approvalService.reinstate(contentId, { reason, actorId })` or `POST /api/moderation/approval/reinstate/:contentId` when an appeal overturns a block.
- **Module 7 (Dashboard & Audit)**:
  - Query the `ModerationAuditLog` collection directly or via MongoDB aggregation for complete moderation timeline events.
