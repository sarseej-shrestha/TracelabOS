import copy
import math
import unittest

from evaluate import ancestors, cluster_interval, evaluate, metrics, reports_match
from generate import generate

CATALOG = [
    {"id": "root", "prerequisites": []},
    {"id": "child", "prerequisites": ["root"]},
]


class ExperimentTests(unittest.TestCase):
    def test_generation_is_reproducible_and_learner_disjoint(self):
        data = generate(CATALOG, learners=8, training=3)
        self.assertEqual(data, generate(CATALOG, learners=8, training=3))
        self.assertNotEqual(data, generate(CATALOG, seed=8, learners=8, training=3))
        for scenario in data["scenarios"]:
            train = {
                learner["id"]
                for learner in scenario["learners"]
                if learner["split"] == "train"
            }
            test = {
                learner["id"]
                for learner in scenario["learners"]
                if learner["split"] == "test"
            }
            self.assertEqual((len(train), len(test), len(train & test)), (3, 5, 0))
            self.assertTrue(
                all(
                    len(skill["observations"]) <= 12
                    for learner in scenario["learners"]
                    for skill in learner["skills"]
                )
            )
        self.assertTrue(
            all(profile["forget"] > 0 for profile in data["scenarios"][1]["profiles"])
        )

    def test_invalid_split(self):
        for training in [0, 8, 9]:
            with self.assertRaises(ValueError):
                generate(CATALOG, learners=8, training=training)

    def test_hand_calculated_metrics(self):
        result = metrics([0.75, 0.25], [True, False])
        self.assertEqual(result["brier"], 0.0625)
        self.assertAlmostEqual(result["logLoss"], -math.log(0.75))
        self.assertEqual(result["ece10"], 0.25)
        self.assertEqual(result["accuracy"], 1)

    def test_reject_invalid_metrics(self):
        for predictions, outcomes in [
            ([], []),
            ([math.nan], [True]),
            ([0], [True]),
            ([1], [True]),
            ([0.5], [1]),
            ([0.5, 0.5], [True]),
        ]:
            with self.assertRaises(ValueError):
                metrics(predictions, outcomes)

    def test_cluster_resampling_is_seeded_and_preserves_constant_metric(self):
        clusters = [
            {"observations": 10, "brier": 0.2},
            {"observations": 20, "brier": 0.2},
        ]
        interval = cluster_interval(clusters, "brier", 7, repeats=100)
        self.assertEqual(interval, cluster_interval(clusters, "brier", 7, repeats=100))
        for value in interval:
            self.assertAlmostEqual(value, 0.2)

    def test_reference_prerequisite_order_and_invalid_graph(self):
        self.assertEqual(ancestors(CATALOG, "child"), ["root"])
        self.assertEqual(ancestors(CATALOG, "root"), [])
        with self.assertRaises(ValueError):
            ancestors([{"id": "x", "prerequisites": ["x"]}], "x")

    def test_report_comparison_requires_hashes_counts_and_close_metrics(self):
        expected = {"hash": "abc", "values": [0.25, 3]}
        self.assertTrue(
            reports_match(expected, {"hash": "abc", "values": [0.25 + 1e-14, 3]})
        )
        self.assertFalse(
            reports_match(expected, {"hash": "changed", "values": [0.25, 3]})
        )
        self.assertFalse(reports_match(expected, {"hash": "abc", "values": [0.26, 3]}))
        self.assertFalse(reports_match(expected, {"hash": "abc", "values": [0.25, 4]}))

    def test_training_leakage_and_outcome_order_are_rejected(self):
        data = {
            "catalog": [{"id": "root", "prerequisites": []}],
            "scenarios": [
                {
                    "name": "small",
                    "learners": [
                        {
                            "id": "training",
                            "split": "train",
                            "skills": [
                                {
                                    "skillId": "root",
                                    "observations": [True],
                                    "finalKnown": True,
                                }
                            ],
                        },
                        {
                            "id": "testing",
                            "split": "test",
                            "skills": [
                                {
                                    "skillId": "root",
                                    "observations": [False],
                                    "finalKnown": False,
                                }
                            ],
                        },
                    ],
                }
            ],
        }
        scores = {
            "scenarios": [
                {
                    "name": "small",
                    "trainingBaseline": 2 / 3,
                    "learners": [
                        {
                            "id": "testing",
                            "predictions": [
                                {
                                    "outcome": False,
                                    "predictions": {
                                        "constant": 2 / 3,
                                        "frequency": 0.5,
                                        "bkt": 0.38,
                                    },
                                }
                            ],
                            "choices": [
                                {
                                    "target": "root",
                                    "baseline": "root",
                                    "rules": "root",
                                    "bkt": "root",
                                }
                            ],
                        }
                    ],
                }
            ]
        }
        self.assertEqual(evaluate(data, scores)[0]["testLearners"], 1)
        for mutation in ["baseline", "learner", "outcome"]:
            changed = copy.deepcopy(scores)
            if mutation == "baseline":
                changed["scenarios"][0]["trainingBaseline"] = 0.5
            elif mutation == "learner":
                changed["scenarios"][0]["learners"][0]["id"] = "training"
            else:
                changed["scenarios"][0]["learners"][0]["predictions"][0]["outcome"] = (
                    True
                )
            with self.assertRaises(ValueError):
                evaluate(data, changed)


if __name__ == "__main__":
    unittest.main()
