"""SQLite helpers for the User Trust & Reputation module."""

import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).with_name("reputation.db")

SCHEMA = """
CREATE TABLE IF NOT EXISTS users (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    username     TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    score        INTEGER NOT NULL DEFAULT 50,
    created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS events (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type        TEXT NOT NULL,
    category    TEXT NOT NULL CHECK (category IN ('positive', 'violation')),
    description TEXT NOT NULL,
    points      INTEGER NOT NULL,
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_events_user ON events(user_id);
"""


def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db():
    with get_connection() as conn:
        conn.executescript(SCHEMA)


def row_to_dict(row):
    return dict(row) if row is not None else None


# ---------------------------------------------------------------------------
# Users
# ---------------------------------------------------------------------------

def create_user(username, display_name, score=50):
    with get_connection() as conn:
        cur = conn.execute(
            "INSERT INTO users (username, display_name, score) VALUES (?, ?, ?)",
            (username, display_name, score),
        )
        return cur.lastrowid


def get_user(user_id):
    with get_connection() as conn:
        return row_to_dict(conn.execute(
            "SELECT * FROM users WHERE id = ?", (user_id,)
        ).fetchone())


def get_user_by_username(username):
    with get_connection() as conn:
        return row_to_dict(conn.execute(
            "SELECT * FROM users WHERE username = ?", (username,)
        ).fetchone())


def list_users():
    with get_connection() as conn:
        return [dict(r) for r in conn.execute(
            "SELECT * FROM users ORDER BY score DESC, username ASC"
        ).fetchall()]


def update_score(user_id, score):
    with get_connection() as conn:
        conn.execute("UPDATE users SET score = ? WHERE id = ?", (score, user_id))


# ---------------------------------------------------------------------------
# Events
# ---------------------------------------------------------------------------

def add_event(user_id, event_type, category, description, points):
    with get_connection() as conn:
        cur = conn.execute(
            """INSERT INTO events (user_id, type, category, description, points)
               VALUES (?, ?, ?, ?, ?)""",
            (user_id, event_type, category, description, points),
        )
        return cur.lastrowid


def list_events(user_id, limit=100):
    with get_connection() as conn:
        return [dict(r) for r in conn.execute(
            """SELECT * FROM events WHERE user_id = ?
               ORDER BY datetime(created_at) DESC, id DESC LIMIT ?""",
            (user_id, limit),
        ).fetchall()]


def count_violations(user_id):
    with get_connection() as conn:
        row = conn.execute(
            "SELECT COUNT(*) AS n FROM events WHERE user_id = ? AND category = 'violation'",
            (user_id,),
        ).fetchone()
        return row["n"]


def count_repeated_violations(user_id):
    """Count occurrences of the 'repeated_violation' event type."""
    with get_connection() as conn:
        row = conn.execute(
            "SELECT COUNT(*) AS n FROM events WHERE user_id = ? AND type = 'repeated_violation'",
            (user_id,),
        ).fetchone()
        return row["n"]


def event_counts(user_id):
    """Return {event_type: count} for a user (used by the dashboard)."""
    with get_connection() as conn:
        rows = conn.execute(
            "SELECT type, COUNT(*) AS n FROM events WHERE user_id = ? GROUP BY type",
            (user_id,),
        ).fetchall()
        return {r["type"]: r["n"] for r in rows}
