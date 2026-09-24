"""
Reputation engine for the User Trust & Reputation module.

Holds the scoring rules, score clamping, moderation tier logic, and
transparency helpers (how a user can improve their score).

This module is pure logic — no database or web dependencies — so it is
easy to unit test and reuse.
"""

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

MIN_SCORE = 0
MAX_SCORE = 100
DEFAULT_SCORE = 50  # neutral starting score for new users

# Event type registry.
#   key            -> (points, category, description)
#   category is "positive" or "violation" and drives transparency views.
EVENT_TYPES = {
    # Positive contributions ----------------------------------------------
    "helpful_contribution": (
        +5,
        "positive",
        "Provided a helpful answer or contribution",
    ),
    "positive_feedback": (
        +2,
        "positive",
        "Received positive feedback from other users",
    ),
    "verified_activity": (
        +4,
        "positive",
        "Successfully completed a verified activity",
    ),
    "genuine_report": (
        +3,
        "positive",
        "Filed a genuine violation report",
    ),
    "guideline_streak": (
        +3,
        "positive",
        "Consistently followed community guidelines",
    ),
    # Violations -----------------------------------------------------------
    "spam_warning": (
        -5,
        "violation",
        "Received a spam warning",
    ),
    "confirmed_violation": (
        -15,
        "violation",
        "Confirmed serious violation",
    ),
    "repeated_violation": (
        -10,
        "violation",
        "Repeated rule violation",
    ),
    "invalid_report": (
        -3,
        "violation",
        "Filed an invalid or bad-faith report",
    ),
    "content_removed": (
        -5,
        "violation",
        "Content removed by moderators",
    ),
}

POSITIVE_EVENTS = tuple(k for k, v in EVENT_TYPES.items() if v[1] == "positive")
VIOLATION_EVENTS = tuple(k for k, v in EVENT_TYPES.items() if v[1] == "violation")

# Moderation tiers, keyed by tier name.
MODERATION_TIERS = {
    "normal": {
        "key": "normal",
        "label": "Normal review",
        "description": "High reputation — content goes through normal moderation review.",
        "actions": [],
    },
    "monitor": {
        "key": "monitor",
        "label": "Additional monitoring",
        "description": "Medium reputation — activity receives additional monitoring.",
        "actions": ["Enhanced monitoring of new posts"],
    },
    "restricted": {
        "key": "restricted",
        "label": "Increased review / restrictions",
        "description": (
            "Low reputation with repeated violations — increased review "
            "or temporary restrictions may apply."
        ),
        "actions": [
            "Manual review of new content",
            "Possible temporary posting restrictions",
            "Reports reviewed with extra scrutiny",
        ],
    },
}

_IMPROVEMENT_TIPS = [
    "Provide helpful, well-researched answers and contributions.",
    "Give constructive, respectful feedback to other community members.",
    "Complete verified activities to earn positive reputation.",
    "Report genuine violations only — invalid reports reduce your score.",
    "Follow the community guidelines consistently to build a streak.",
    "Avoid posting spam, abusive, or misleading content.",
    "If your content was removed, review the moderator note and improve it.",
]


# ---------------------------------------------------------------------------
# Scoring
# ---------------------------------------------------------------------------

def clamp(score):
    """Keep a reputation score within the configured 0–100 range."""
    return max(MIN_SCORE, min(MAX_SCORE, int(score)))


def get_points(event_type):
    """Return the reputation change for a known event type, or raise."""
    if event_type not in EVENT_TYPES:
        raise ValueError(f"Unknown event type: {event_type!r}")
    return EVENT_TYPES[event_type][0]


def apply_event(score, event_type):
    """Apply an event's reputation change to `score`, clamped to range."""
    return clamp(score + get_points(event_type))


def event_info(event_type):
    """Return (points, category, description) for an event type."""
    if event_type not in EVENT_TYPES:
        raise ValueError(f"Unknown event type: {event_type!r}")
    return EVENT_TYPES[event_type]


# ---------------------------------------------------------------------------
# Moderation support
# ---------------------------------------------------------------------------

def moderation_tier(score, violation_count=0, repeated_violations=0):
    """
    Decide the moderation tier for a user.

    Reputation is one factor among several:
      * high reputation              -> normal moderation review
      * medium reputation            -> additional monitoring
      * low reputation + repeats     -> increased review / restrictions
    """
    score = clamp(score)
    if score >= 70 and repeated_violations == 0:
        key = "normal"
    elif score >= 40 and repeated_violations < 2:
        # Medium reputation (or a repeat blemish on an otherwise good
        # score) → additional monitoring.
        key = "monitor"
    else:
        key = "restricted"

    tier = dict(MODERATION_TIERS[key])
    tier["score"] = score
    tier["violation_count"] = violation_count
    tier["repeated_violations"] = repeated_violations
    return tier


# ---------------------------------------------------------------------------
# Transparency helpers
# ---------------------------------------------------------------------------

def improvement_tips(score, violation_count=0):
    """Return personalised tips explaining how the user can improve."""
    score = clamp(score)
    tips = []
    if score < 40:
        tips.append(
            "Your score is low. Focus on positive contributions and avoid "
            "further violations to recover."
        )
    elif score < 70:
        tips.append(
            "Your score is average. A few more positive contributions will "
            "move you into the trusted range (70+)."
        )
    else:
        tips.append(
            "Great standing! Keep contributing positively to stay above 70."
        )
    if violation_count:
        tips.append(
            f"You have {violation_count} recorded violation"
            f"{'s' if violation_count > 1 else ''} — avoid new ones; "
            "positive activity gradually outweighs old violations."
        )
    tips.extend(_IMPROVEMENT_TIPS)
    return tips


def summarize_events(events):
    """Split a list of event dicts into positive contributions and violations."""
    positive = [e for e in events if e.get("category") == "positive"]
    violations = [e for e in events if e.get("category") == "violation"]
    return positive, violations
