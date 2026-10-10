"""Predictive metrics and separate policy diagnostics on synthetic held-out learners."""

import hashlib
import json
import math
import random
import sys
from pathlib import Path

MODELS = ("constant", "frequency", "bkt")
POLICIES = ("baseline", "rules", "bkt")


def metrics(predictions, outcomes):
    if (
        not predictions
        or len(predictions) != len(outcomes)
        or any(not math.isfinite(p) or not 0 < p < 1 for p in predictions)
    ):
        raise ValueError(
            "Finite interior probabilities and nonempty matching outcomes required"
        )
    if any(type(outcome) is not bool for outcome in outcomes):
        raise ValueError("Outcomes must be Boolean")
    count = len(outcomes)
    brier = (
        sum((p - y) ** 2 for p, y in zip(predictions, outcomes, strict=True)) / count
    )
    loss = (
        -sum(
            math.log(p if y else 1 - p)
            for p, y in zip(predictions, outcomes, strict=True)
        )
        / count
    )
    ece = 0
    for bucket in range(10):
        values = [
            (p, y)
            for p, y in zip(predictions, outcomes, strict=True)
            if min(9, int(p * 10)) == bucket
        ]
        if values:
            ece += abs(sum(p - y for p, y in values)) / count
    return {
        "brier": brier,
        "logLoss": loss,
        "ece10": ece,
        "accuracy": sum(
            (p >= 0.5) == y for p, y in zip(predictions, outcomes, strict=True)
        )
        / count,
        "observations": count,
    }


def cluster_interval(clusters, metric, seed, repeats=1000):
    """Resample whole learner clusters; retain observation-weighted metric."""
    rng = random.Random(seed)
    samples = []
    for _ in range(repeats):
        chosen = rng.choices(clusters, k=len(clusters))
        total = sum(row["observations"] for row in chosen)
        samples.append(sum(row[metric] * row["observations"] for row in chosen) / total)
    samples.sort()
    return [samples[int(0.025 * (repeats - 1))], samples[int(0.975 * (repeats - 1))]]


def ancestors(catalog, target):
    nodes = {skill["id"]: skill["prerequisites"] for skill in catalog}
    visited, active, ordered = set(), set(), []

    def visit(skill):
        if skill in active or skill not in nodes:
            raise ValueError("Invalid curriculum graph")
        if skill in visited:
            return
        active.add(skill)
        for prerequisite in nodes[skill]:
            visit(prerequisite)
        active.remove(skill)
        visited.add(skill)
        ordered.append(skill)

    visit(target)
    return [skill for skill in ordered if skill != target]


def evaluate(data, scores):
    if {s["name"] for s in data["scenarios"]} != {
        s["name"] for s in scores["scenarios"]
    }:
        raise ValueError("Scenario mismatch")
    output = []
    for scenario_index, scenario in enumerate(data["scenarios"]):
        scored = next(s for s in scores["scenarios"] if s["name"] == scenario["name"])
        held_out = {
            learner["id"]: learner
            for learner in scenario["learners"]
            if learner["split"] == "test"
        }
        scored_ids = [learner["id"] for learner in scored["learners"]]
        if len(set(scored_ids)) != len(scored_ids) or set(scored_ids) != set(held_out):
            raise ValueError("Evaluation must contain exactly the held-out learners")
        training = [
            outcome
            for learner in scenario["learners"]
            if learner["split"] == "train"
            for skill in learner["skills"]
            for outcome in skill["observations"]
        ]
        expected_constant = (sum(training) + 1) / (len(training) + 2)
        if not math.isclose(
            scored["trainingBaseline"], expected_constant, abs_tol=1e-15, rel_tol=0
        ):
            raise ValueError("Baseline must use training learners only")
        model_results = {}
        for model in MODELS:
            all_predictions, all_outcomes, clusters = [], [], []
            for learner in scored["learners"]:
                expected = [
                    value
                    for skill in held_out[learner["id"]]["skills"]
                    for value in skill["observations"]
                ]
                outcomes = [row["outcome"] for row in learner["predictions"]]
                if outcomes != expected:
                    raise ValueError("Outcome order mismatch")
                predictions = [
                    row["predictions"][model] for row in learner["predictions"]
                ]
                all_predictions.extend(predictions)
                all_outcomes.extend(outcomes)
                if outcomes:
                    clusters.append(metrics(predictions, outcomes))
            measured = metrics(all_predictions, all_outcomes)
            measured["brierLearnerBootstrap95"] = cluster_interval(
                clusters, "brier", 20261010 + scenario_index
            )
            measured["logLossLearnerBootstrap95"] = cluster_interval(
                clusters, "logLoss", 20261010 + scenario_index
            )
            model_results[model] = measured
        policy_results = {
            policy: {
                "contexts": 0,
                "referenceMatches": 0,
                "unmetLatentPrerequisites": 0,
                "selectedLatentlyKnown": 0,
            }
            for policy in POLICIES
        }
        catalog_ids = {skill["id"] for skill in data["catalog"]}
        for learner in scored["learners"]:
            truth = {
                skill["skillId"]: skill["finalKnown"]
                for skill in held_out[learner["id"]]["skills"]
            }
            targets = [row["target"] for row in learner["choices"]]
            if set(targets) != catalog_ids or len(targets) != len(catalog_ids):
                raise ValueError("Practice targets must cover the curriculum once")
            for row in learner["choices"]:
                reference = next(
                    (
                        skill
                        for skill in ancestors(data["catalog"], row["target"])
                        if not truth[skill]
                    ),
                    row["target"],
                )
                for policy in POLICIES:
                    choice = row[policy]
                    if choice not in catalog_ids:
                        raise ValueError("Unknown practice choice")
                    measured = policy_results[policy]
                    measured["contexts"] += 1
                    measured["referenceMatches"] += choice == reference
                    measured["unmetLatentPrerequisites"] += any(
                        not truth[skill] for skill in ancestors(data["catalog"], choice)
                    )
                    measured["selectedLatentlyKnown"] += truth[choice]
        for measured in policy_results.values():
            measured["referenceAgreement"] = (
                measured["referenceMatches"] / measured["contexts"]
            )
            measured["unmetLatentPrerequisiteRate"] = (
                measured["unmetLatentPrerequisites"] / measured["contexts"]
            )
            measured["selectedLatentlyKnownRate"] = (
                measured["selectedLatentlyKnown"] / measured["contexts"]
            )
        output.append(
            {
                "scenario": scenario["name"],
                "trainingLearners": len(scenario["learners"]) - len(held_out),
                "testLearners": len(held_out),
                "trainingConstant": scored["trainingBaseline"],
                "predictionMetrics": model_results,
                "practiceDiagnostics": policy_results,
            }
        )
    return output


def reports_match(expected, actual):
    if isinstance(expected, dict):
        return (
            isinstance(actual, dict)
            and expected.keys() == actual.keys()
            and all(
                reports_match(value, actual[key]) for key, value in expected.items()
            )
        )
    if isinstance(expected, list):
        return (
            isinstance(actual, list)
            and len(expected) == len(actual)
            and all(reports_match(a, b) for a, b in zip(expected, actual, strict=True))
        )
    if isinstance(expected, float):
        return isinstance(actual, (int, float)) and math.isclose(
            expected, actual, rel_tol=0, abs_tol=1e-12
        )
    return expected == actual


def main():
    directory = Path(".data/adaptive-evaluation")
    raw = (directory / "trajectories.json").read_bytes()
    scores_raw = (directory / "predictions.json").read_bytes()
    data, scores = json.loads(raw), json.loads(scores_raw)
    digest = hashlib.sha256(raw).hexdigest()
    if digest != scores["datasetSha256"]:
        raise ValueError("Scored dataset checksum mismatch")
    report = {
        "experimentVersion": scores["experimentVersion"],
        "generatorVersion": data["generatorVersion"],
        "algorithmVersion": scores["algorithmVersion"],
        "seed": data["seed"],
        "datasetSha256": digest,
        "scoresSha256": hashlib.sha256(scores_raw).hexdigest(),
        "bktParameters": scores["parameters"],
        "bootstrapReplicates": 1000,
        "scenarios": evaluate(data, scores),
        "limitations": [
            "Synthetic data only; not evidence of student-learning improvement or real-world calibration.",
            "BKT is intentionally matched to the first generator; the second varies skill parameters and adds forgetting.",
            "Practice choices are evaluated on frozen histories, not intervention-driven learning trajectories.",
            "The latent-state reference uses the same prerequisite ordering; it is not an optimal teaching policy.",
            "Intervals resample synthetic learners and do not represent parameter uncertainty or real population effects.",
            "Skill histories are generated independently, so prerequisite learning dependence is not modeled.",
        ],
    }
    path = Path("artifacts/adaptive-strategy-results.json")
    if sys.argv[1:] == ["--check"]:
        if not reports_match(json.loads(path.read_text()), report):
            raise ValueError(
                "Published adaptive report differs; investigate and regenerate explicitly"
            )
    elif sys.argv[1:]:
        raise ValueError("Usage: evaluate.py [--check]")
    path.write_text(json.dumps(report, indent=2) + "\n")
    print(
        json.dumps(
            {
                "scenarios": [
                    {
                        "name": scenario["scenario"],
                        "brier": {
                            model: values["brier"]
                            for model, values in scenario["predictionMetrics"].items()
                        },
                    }
                    for scenario in report["scenarios"]
                ]
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
