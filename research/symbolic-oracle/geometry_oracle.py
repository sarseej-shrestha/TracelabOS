"""Independent dimensional checks of generated geometry paths with a restricted AST."""

import ast
import json
import re
from datetime import datetime, timezone
from pathlib import Path
import sympy as sp

length = sp.Symbol("L", positive=True)
units = {"mm": length / 1000, "cm": length / 100, "m": length}


def quantity(text):
    text = re.sub(r"(mm|cm|m)(?:²|\^2|2)", r"(\1*\1)", text)
    text = re.sub(r"(?<=[\d)])\s*(?=mm|cm|m|\()", "*", text)
    node = ast.parse(text, mode="eval").body

    def visit(item):
        if isinstance(item, ast.Constant) and type(item.value) in (int, float):
            return sp.Rational(str(item.value))
        if isinstance(item, ast.Name) and item.id in units:
            return units[item.id]
        if isinstance(item, ast.UnaryOp) and isinstance(item.op, ast.USub):
            return -visit(item.operand)
        if isinstance(item, ast.BinOp):
            left, right = visit(item.left), visit(item.right)
            if isinstance(item.op, ast.Add):
                return left + right
            if isinstance(item.op, ast.Sub):
                return left - right
            if isinstance(item.op, ast.Mult):
                return left * right
            if isinstance(item.op, ast.Div) and right != 0:
                return left / right
        raise ValueError("Unexpected generated quantity")

    return visit(node)


def expected(case):
    p, skill = case["parameters"], case["skillId"]
    if skill == "rectangle-area":
        return sp.Rational(p["a"] * p["b"], p["half"]) * units["cm"] ** 2
    if skill == "rectangle-perimeter":
        return 2 * (p["a"] + (p["a"] if p["variant"] else p["b"])) * units["cm"]
    if skill == "triangle-area":
        return sp.Rational(p["a"] * p["b"], 2) * units["cm"] ** 2
    if skill == "composite-area":
        return (p["a"] * (p["b"] + p["d"]) + p["c"] * p["b"]) * units["cm"] ** 2
    if skill == "missing-length":
        return p["b"] * units["cm"]
    if skill == "area-unit-conversion":
        return p["a"] * p["b"] * units["m" if p["variant"] else "cm"] ** 2
    raise ValueError("Unknown geometry skill")


def main():
    cases = json.loads(Path("artifacts/geometry-oracle-vectors.json").read_text())
    comparisons, disagreements = 0, []
    for case in cases:
        answer = expected(case)
        for path, complete in zip(
            case["paths"], case["typescriptComplete"], strict=True
        ):
            for line in [case["expression"], *path]:
                comparisons += 1
                measured = quantity(line)
                if not re.search(r"mm|cm|m", line):
                    unit = case["answerUnit"]
                    measured *= units[unit["unit"]] ** unit["power"]
                if sp.simplify(measured - answer) != 0 or not complete:
                    disagreements.append(
                        {
                            "template": case["templateId"],
                            "seed": case["seed"],
                            "line": line,
                            "expected": str(answer),
                            "typescriptComplete": complete,
                        }
                    )
    report = {
        "executedAt": datetime.now(timezone.utc).isoformat(),
        "sympy": sp.__version__,
        "cases": len(cases),
        "templates": len({c["templateId"] for c in cases}),
        "comparisons": comparisons,
        "disagreements": disagreements,
        "scope": "Generated geometry quantities and dimensions checked against independent parameter formulas. Not student-error precision or sketch recognition.",
    }
    Path("artifacts/geometry-oracle-results.json").write_text(
        json.dumps(report, indent=2) + "\n"
    )
    print(json.dumps(report | {"disagreements": len(disagreements)}))
    if disagreements:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
