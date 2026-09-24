"""Seed the database with demo users and event histories."""

import database as db
import reputation as rep


def seed_if_empty():
    """Populate demo data only when the users table is empty."""
    with db.get_connection() as conn:
        count = conn.execute("SELECT COUNT(*) AS n FROM users").fetchone()["n"]
    if count:
        return

    demo_users = [
        # (username, display_name, [(type, offset_minutes_ago), ...])
        ("arjun", "Arjun Mehta", [
            # Walked from 50 → 65 with contributions, then a serious
            # violation (−15) plus positive feedback → 52.
            ("helpful_contribution", 900),
            ("helpful_contribution", 700),
            ("helpful_contribution", 500),
            ("confirmed_violation", 120),
            ("positive_feedback", 60),
        ]),
        ("priya", "Priya Sharma", [
            ("helpful_contribution", 2000),
            ("helpful_contribution", 1800),
            ("verified_activity", 1500),
            ("genuine_report", 1200),
            ("guideline_streak", 900),
            ("positive_feedback", 400),
            ("positive_feedback", 200),
            ("helpful_contribution", 100),
        ]),
        ("vikram", "Vikram Rao", [
            ("helpful_contribution", 3000),
            ("spam_warning", 1000),
            ("content_removed", 600),
            ("repeated_violation", 300),
            ("invalid_report", 150),
        ]),
        ("sana", "Sana Iqbal", [
            ("verified_activity", 5000),
            ("helpful_contribution", 4000),
            ("positive_feedback", 2500),
            ("genuine_report", 1800),
        ]),
        ("rohit", "Rohit Verma", []),  # brand-new user, neutral score
    ]

    for username, display_name, events in demo_users:
        user_id = db.create_user(username, display_name, rep.DEFAULT_SCORE)
        score = rep.DEFAULT_SCORE
        for event_type, _ago in events:
            points, category, description = rep.event_info(event_type)
            score = rep.clamp(score + points)
            db.add_event(user_id, event_type, category, description, points)
        db.update_score(user_id, score)
