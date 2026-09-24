# User Trust & Reputation Module

A full-stack implementation of a user trust / reputation system: every user has a
score from **0–100**, new users start at a neutral **50**, and the score changes
based on positive contributions, violations, and moderation history. Reputation is
then used as one input to moderation decisions, with full transparency for users.

## Features

- **Reputation score** — 0–100 range, neutral start at 50, clamped on every change.
- **Positive contributions** — helpful answers (+5), positive feedback (+2),
  verified activities (+4), genuine reports (+3), guideline streaks (+3).
- **Violations** — spam warnings (−5), confirmed serious violations (−15),
  repeated violations (−10), invalid reports (−3), moderator-removed content (−5).
- **Moderation support** — automatic tiering:
  | Tier | Condition | Action |
  |---|---|---|
  | Normal review | score ≥ 70, no repeated violations | Normal moderation review |
  | Additional monitoring | score 40–69 (and < 70) | Enhanced monitoring of new posts |
  | Increased review / restrictions | score < 40, or repeated violations ≥ 2 | Manual review, possible temporary restrictions |
- **Transparency** — users see their current score, full event history, positive
  contributions, warnings/violations, and personalised improvement tips.
- **Web dashboard** + **JSON REST API**.

## Project structure

```
├── app.py              # Flask app: web views + JSON API
├── reputation.py       # Pure scoring / tiering / tips engine
├── database.py         # SQLite schema and queries
├── seed.py             # Demo users and event histories
├── templates/          # Jinja2 templates (dashboard, user detail)
├── static/style.css    # Dashboard styles
├── tests/
│   └── test_reputation.py
├── requirements.txt
└── reputation.db       # Created automatically on first run
```

## Getting started

```bash
pip install -r requirements.txt
python app.py
```

Open <http://127.0.0.1:5000>. The database is created and seeded with demo users
on first run. Delete `reputation.db` to reset.

## Running tests

```bash
python -m unittest discover tests -v
```

## API

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/event-types` | All event types with points and categories |
| GET | `/api/users` | All users with score, tier, events, tips |
| POST | `/api/users` | Create a user (`{"username": "...", "display_name": "..."}`) |
| GET | `/api/users/<id>` | Full transparency profile for one user |
| POST | `/api/users/<id>/events` | Record an event: `{"type": "helpful_contribution"}` → returns old/new score and tier |
| GET | `/api/leaderboard` | Top 10 and needs-attention lists |

### Example

```bash
curl -X POST http://127.0.0.1:5000/api/users/5/events \
  -H "Content-Type: application/json" \
  -d '{"type": "helpful_contribution"}'
```

```json
{
  "previous_score": 50,
  "new_score": 55,
  "tier": {"key": "monitor", "label": "Additional monitoring", ...},
  "event": {"type": "helpful_contribution", "points": 5, ...}
}
```

## Design notes

- **Reputation is one factor among several.** The tier engine accepts violation
  counts alongside the score, so moderators can combine it with other signals.
- `reputation.py` has no database or web dependencies, so the scoring rules are
  trivially unit-tested and reusable.
- Scores are clamped to 0–100 after every event — a user can never go negative
  or exceed the maximum.
