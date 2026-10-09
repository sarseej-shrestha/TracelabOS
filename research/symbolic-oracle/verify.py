"""Independent oracle for generated inputs only; never evaluate uploaded strings."""
import argparse
import json
import platform
import sys
from datetime import datetime, timezone
from pathlib import Path
from fractions import Fraction


def verify(path: Path, output: Path) -> None:
    try:
        import sympy as sp
    except ImportError:
        raise SystemExit("Install research/symbolic-oracle/requirements.txt before running the oracle.")
    cases = json.loads(path.read_text())
    x = sp.Symbol("x", real=True)
    disagreements = []
    for index, case in enumerate(cases):
        equation = sp.Eq(case["a"] * (x + case["b"]), case["a"] * (case["x"] + case["b"]))
        solutions = sp.solve(equation, x)
        expected = sp.Rational(case["x"]) in solutions
        incorrect = sp.Rational(case["x"] + 1) not in solutions
        rational = sp.Rational(case["n"], case["d"]) + sp.Rational(case["d"], case["n"])
        # Fractions supplies a second independent exact-arithmetic implementation.
        py_fraction = Fraction(case["n"], case["d"]) + Fraction(case["d"], case["n"])
        if case["good"] != expected or case["bad"] != incorrect or str(rational) != case["fraction"] or str(py_fraction) != case["fraction"]:
            disagreements.append({"index": index, "case": case, "solutions": str(solutions), "fraction": str(rational)})
    report = {"timestamp": datetime.now(timezone.utc).isoformat(), "python": platform.python_version(), "sympy": sp.__version__, "cases": len(cases), "comparisons": len(cases)*3, "disagreements": disagreements, "scope": "generated linear equations and rational sums; not handwritten-data accuracy or proof of all transformations"}
    output.write_text(json.dumps(report, indent=2) + "\n")
    print(json.dumps({"cases": len(cases), "comparisons": report["comparisons"], "disagreements": len(disagreements)}))
    if disagreements:
        sys.exit(1)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", type=Path, default=Path("artifacts/oracle-vectors.json"))
    parser.add_argument("--output", type=Path, default=Path("artifacts/sympy-results.json"))
    args = parser.parse_args()
    verify(args.input, args.output)
