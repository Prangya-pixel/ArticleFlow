"""Unit tests for the reputation engine (pure logic, no DB)."""

import unittest

import reputation as rep


class TestScoring(unittest.TestCase):
    def test_new_user_starts_neutral(self):
        self.assertEqual(rep.DEFAULT_SCORE, 50)

    def test_clamp_keeps_score_in_range(self):
        self.assertEqual(rep.clamp(-20), 0)
        self.assertEqual(rep.clamp(150), 100)
        self.assertEqual(rep.clamp(55), 55)

    def test_example_scenario_from_spec(self):
        # Start at 50 → helpful contributions raise to 65 →
        # confirmed violation lowers it.
        score = rep.DEFAULT_SCORE
        score = rep.apply_event(score, "helpful_contribution")
        score = rep.apply_event(score, "helpful_contribution")
        score = rep.apply_event(score, "helpful_contribution")
        self.assertEqual(score, 65)
        score = rep.apply_event(score, "repeated_violation")
        self.assertEqual(score, 55)

    def test_event_point_values_match_spec(self):
        expected = {
            "helpful_contribution": 5,
            "positive_feedback": 2,
            "genuine_report": 3,
            "spam_warning": -5,
            "confirmed_violation": -15,
            "repeated_violation": -10,
        }
        for event_type, points in expected.items():
            self.assertEqual(rep.get_points(event_type), points, event_type)

    def test_score_never_negative_or_above_max(self):
        score = 5
        for _ in range(5):
            score = rep.apply_event(score, "confirmed_violation")
        self.assertEqual(score, 0)

        score = 95
        for _ in range(5):
            score = rep.apply_event(score, "helpful_contribution")
        self.assertEqual(score, 100)

    def test_unknown_event_rejected(self):
        with self.assertRaises(ValueError):
            rep.get_points("not_a_real_event")


class TestModerationTier(unittest.TestCase):
    def test_high_reputation_gets_normal_review(self):
        self.assertEqual(rep.moderation_tier(85)["key"], "normal")

    def test_medium_reputation_gets_monitoring(self):
        self.assertEqual(rep.moderation_tier(55)["key"], "monitor")
        self.assertEqual(rep.moderation_tier(69)["key"], "monitor")

    def test_low_reputation_gets_increased_review(self):
        self.assertEqual(rep.moderation_tier(20)["key"], "restricted")

    def test_low_reputation_with_repeats_is_restricted(self):
        tier = rep.moderation_tier(35, violation_count=4, repeated_violations=2)
        self.assertEqual(tier["key"], "restricted")

    def test_repeated_violations_escalate_medium_score(self):
        # Medium score but two+ repeated violations → restrictions.
        tier = rep.moderation_tier(50, violation_count=3, repeated_violations=2)
        self.assertEqual(tier["key"], "restricted")

    def test_one_repeat_on_high_score_still_monitored(self):
        tier = rep.moderation_tier(75, violation_count=1, repeated_violations=1)
        self.assertEqual(tier["key"], "monitor")


class TestTransparency(unittest.TestCase):
    def test_summarize_events_splits_categories(self):
        events = [
            {"category": "positive"},
            {"category": "violation"},
            {"category": "positive"},
        ]
        positive, violations = rep.summarize_events(events)
        self.assertEqual(len(positive), 2)
        self.assertEqual(len(violations), 1)

    def test_tips_include_personalised_guidance(self):
        low_tips = rep.improvement_tips(20, violation_count=3)
        self.assertTrue(any("score is low" in t.lower() for t in low_tips))
        self.assertTrue(any("violation" in t.lower() for t in low_tips))

        high_tips = rep.improvement_tips(90)
        self.assertTrue(any("great standing" in t.lower() for t in high_tips))


if __name__ == "__main__":
    unittest.main()
