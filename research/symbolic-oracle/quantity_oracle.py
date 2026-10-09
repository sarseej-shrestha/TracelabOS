"""Independent exact metric arithmetic, using parameters rather than the TS parser."""

import json
from datetime import datetime, timezone
from pathlib import Path
import sympy as sp


def main():
    cases = json.loads(Path("artifacts/quantity-oracle-vectors.json").read_text())
    scales = {"m": sp.Integer(1), "cm": sp.Rational(1, 100), "mm": sp.Rational(1, 1000)}
    disagreements = []
    for case in cases:
        a = case["a"] * scales[case["unitA"]]
        b = case["b"] * scales[case["unitB"]]
        expected, power = {
            "product": (a * b, 2),
            "quotient": (a / b, 0),
            "sum": (a + b, 1),
            "perimeter": (2 * (a + b), 1),
        }[case["operation"]]
        if str(expected) != case["value"] or power != case["power"]:
            disagreements.append(
                case | {"expected": str(expected), "expectedPower": power}
            )
    report = {
        "executedAt": datetime.now(timezone.utc).isoformat(),
        "sympy": sp.__version__,
        "cases": len(cases),
        "disagreements": disagreements,
        "scope": "Seeded exact metric products, quotients, sums and perimeter quantities, independently calculated from parameters. Does not measure student-error precision or diagram recognition.",
    }
    Path("artifacts/quantity-oracle-results.json").write_text(
        json.dumps(report, indent=2) + "\n"
    )
    print(json.dumps(report | {"disagreements": len(disagreements)}))
    if disagreements:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
