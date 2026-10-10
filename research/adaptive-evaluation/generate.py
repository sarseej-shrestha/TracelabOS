"""Frozen synthetic scenarios only; no student records or learned model parameters."""

import json
import random
from pathlib import Path

SEED = 20261010
SCENARIOS = ("matched_no_forgetting", "heterogeneous_with_forgetting")


def generate(catalog, seed=SEED, learners=180, training=60):
    if not 0 < training < learners:
        raise ValueError("Training and test learners must be nonempty and disjoint")
    scenarios = []
    for scenario_index, name in enumerate(SCENARIOS):
        rng = random.Random(seed + scenario_index)
        cohort = []
        profiles = []
        for index, skill in enumerate(catalog):
            profile = {
                "prior": 0.2,
                "learn": 0.1,
                "guess": 0.25,
                "slip": 0.1,
                "forget": 0.0,
            }
            if scenario_index:
                profile = dict(
                    zip(
                        ("prior", "learn", "guess", "slip", "forget"),
                        (
                            (0.1, 0.05, 0.15, 0.05, 0.03),
                            (0.3, 0.1, 0.25, 0.1, 0.03),
                            (0.5, 0.15, 0.35, 0.2, 0.03),
                        )[index % 3],
                        strict=True,
                    )
                )
            profiles.append({"skillId": skill["id"], **profile})
        for learner_index in range(learners):
            records = []
            for profile in profiles:
                known = rng.random() < profile["prior"]
                observations = []
                for _ in range(rng.randrange(13)):
                    observations.append(
                        rng.random()
                        < (1 - profile["slip"] if known else profile["guess"])
                    )
                    known = (
                        rng.random() >= profile["forget"]
                        if known
                        else rng.random() < profile["learn"]
                    )
                records.append(
                    {
                        "skillId": profile["skillId"],
                        "observations": observations,
                        "finalKnown": known,
                    }
                )
            cohort.append(
                {
                    "id": f"synthetic-{scenario_index}-{learner_index:03}",
                    "split": "train" if learner_index < training else "test",
                    "skills": records,
                }
            )
        scenarios.append({"name": name, "profiles": profiles, "learners": cohort})
    return {
        "generatorVersion": "synthetic-trajectories-1",
        "seed": seed,
        "catalog": catalog,
        "scenarios": scenarios,
    }


def main():
    directory = Path(".data/adaptive-evaluation")
    catalog = json.loads((directory / "catalog.json").read_text())
    data = generate(catalog)
    (directory / "trajectories.json").write_text(
        json.dumps(data, sort_keys=True, separators=(",", ":")) + "\n"
    )
    print(
        json.dumps(
            {
                "seed": SEED,
                "scenarios": len(data["scenarios"]),
                "learnersPerScenario": 180,
                "trainPerScenario": 60,
                "testPerScenario": 120,
            }
        )
    )


if __name__ == "__main__":
    main()
