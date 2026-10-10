"""Independent Decimal hidden-state forward calculation; no student dataset."""

import json
from decimal import Decimal, localcontext
from pathlib import Path


def forward(observations, parameters):
    """Propagate normalized known/unknown mass, observing before transition."""
    with localcontext() as context:
        context.prec = 50
        prior, learn, guess, slip = (
            Decimal(str(parameters[name]))
            for name in ("prior", "learn", "guess", "slip")
        )
        known, unknown = prior, 1 - prior
        for observation in observations:
            known *= (1 - slip) if observation else slip
            unknown *= guess if observation else (1 - guess)
            total = known + unknown
            known, unknown = (
                (known + unknown * learn) / total,
                unknown * (1 - learn) / total,
            )
        return float(known)


def main():
    data = json.loads(Path("artifacts/mastery-oracle-vectors.json").read_text())
    disagreements = []
    max_error = 0.0
    for case in data["cases"]:
        expected = forward(case["observations"], data["parameters"])
        error = abs(expected - case["probability"])
        max_error = max(error, max_error)
        if error > 1e-12:
            disagreements.append(
                {
                    "observations": case["observations"],
                    "expected": expected,
                    "actual": case["probability"],
                }
            )
    report = {
        "method": "50-digit Decimal hidden-state forward recurrence",
        "algorithmVersion": data["algorithmVersion"],
        "cases": len(data["cases"]),
        "parameters": data["parameters"],
        "maximumAbsoluteDifference": max_error,
        "disagreements": disagreements,
        "limitations": "Arithmetic agreement only. Provisional parameters; no calibrated student predictions or learning gains.",
    }
    Path("artifacts/mastery-oracle-results.json").write_text(
        json.dumps(report, indent=2) + "\n"
    )
    print(json.dumps(report, indent=2))
    if disagreements:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
