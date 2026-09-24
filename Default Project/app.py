"""
Flask application for the User Trust & Reputation module.

Run:
    python app.py
Then open http://127.0.0.1:5000
"""

from flask import Flask, jsonify, render_template, request

import database as db
import reputation as rep
from seed import seed_if_empty

app = Flask(__name__)
init = db.init_db
init()
seed_if_empty()


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def user_profile(user):
    """Build the full transparency profile for a user."""
    events = db.list_events(user["id"])
    positive, violations = rep.summarize_events(events)
    tier = rep.moderation_tier(
        user["score"],
        violation_count=len(violations),
        repeated_violations=db.count_repeated_violations(user["id"]),
    )
    return {
        **user,
        "tier": tier,
        "events": events,
        "positive_contributions": positive,
        "violations": violations,
        "violation_count": len(violations),
        "counts": db.event_counts(user["id"]),
        "tips": rep.improvement_tips(user["score"], len(violations)),
        "score_min": rep.MIN_SCORE,
        "score_max": rep.MAX_SCORE,
    }


# ---------------------------------------------------------------------------
# Web views
# ---------------------------------------------------------------------------

@app.route("/")
def dashboard():
    users = [user_profile(u) for u in db.list_users()]
    return render_template(
        "dashboard.html",
        users=users,
        event_types=rep.EVENT_TYPES,
        default_score=rep.DEFAULT_SCORE,
    )


@app.route("/users/<int:user_id>")
def user_page(user_id):
    user = db.get_user(user_id)
    if user is None:
        return render_template("not_found.html"), 404
    return render_template(
        "user.html", profile=user_profile(user), event_types=rep.EVENT_TYPES
    )


# ---------------------------------------------------------------------------
# JSON API
# ---------------------------------------------------------------------------

@app.get("/api/event-types")
def api_event_types():
    return jsonify({
        k: {"points": v[0], "category": v[1], "description": v[2]}
        for k, v in rep.EVENT_TYPES.items()
    })


@app.get("/api/users")
def api_list_users():
    return jsonify([user_profile(u) for u in db.list_users()])


@app.post("/api/users")
def api_create_user():
    data = request.get_json(silent=True) or {}
    username = (data.get("username") or "").strip()
    display_name = (data.get("display_name") or username).strip()
    if not username:
        return jsonify({"error": "username is required"}), 400
    if db.get_user_by_username(username):
        return jsonify({"error": "username already exists"}), 409
    user_id = db.create_user(username, display_name or username, rep.DEFAULT_SCORE)
    return jsonify(user_profile(db.get_user(user_id))), 201


@app.get("/api/users/<int:user_id>")
def api_get_user(user_id):
    user = db.get_user(user_id)
    if user is None:
        return jsonify({"error": "user not found"}), 404
    return jsonify(user_profile(user))


@app.post("/api/users/<int:user_id>/events")
def api_add_event(user_id):
    user = db.get_user(user_id)
    if user is None:
        return jsonify({"error": "user not found"}), 404

    data = request.get_json(silent=True) or {}
    event_type = data.get("type")
    try:
        points, category, description = rep.event_info(event_type)
    except ValueError as exc:
        return jsonify({"error": str(exc), "valid_types": list(rep.EVENT_TYPES)}), 400

    new_score = rep.apply_event(user["score"], event_type)
    db.add_event(user_id, event_type, category, description, points)
    db.update_score(user_id, new_score)

    profile = user_profile(db.get_user(user_id))
    return jsonify({
        "event": {
            "type": event_type,
            "points": points,
            "category": category,
            "description": data.get("description") or description,
        },
        "previous_score": user["score"],
        "new_score": new_score,
        "tier": profile["tier"],
        "user": profile,
    }), 201


@app.get("/api/leaderboard")
def api_leaderboard():
    users = db.list_users()
    top = users[:10]
    bottom = sorted(users, key=lambda u: u["score"])[:10]
    return jsonify({"top": top, "needs_attention": bottom})


if __name__ == "__main__":
    app.run(debug=True)
