"""Independent curriculum oracle. Parse a restricted generated AST; never use eval."""

import ast
import json
import re
from datetime import datetime, timezone
from pathlib import Path

import sympy as sp

x = sp.Symbol("x", real=True)


def expression(text):
    node = ast.parse(re.sub(r"(?<=\d)x", "*x", text), mode="eval").body

    def visit(item):
        if isinstance(item, ast.Constant) and type(item.value) is int:
            return sp.Integer(item.value)
        if isinstance(item, ast.Name) and item.id == "x":
            return x
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
        raise ValueError("Unexpected generated expression")

    return visit(node)


def expected(case):
    p = case["parameters"]
    left, right = sp.Rational(p["a"], p["b"]), sp.Rational(p["c"], p["d"])
    skill = case["skillId"]
    if skill == "fraction-equivalence":
        return sp.Integer(p["a"] * p["k"]) if p["variant"] else left
    if skill == "fraction-addition":
        return left + right
    if skill == "fraction-subtraction":
        return left - right
    if skill == "fraction-multiplication":
        return left * (p["k"] if p["variant"] else right)
    if skill == "fraction-division":
        return left / (p["k"] if p["variant"] else right)
    if skill == "mixed-number-addition":
        return p["w"] + p["v"] + left + right
    raise ValueError("Unknown skill")


def main():
    cases = json.loads(Path("artifacts/fraction-oracle-vectors.json").read_text())
    disagreements, comparisons = [], 0
    for case in cases:
        answer = expected(case)
        for path, complete in zip(
            case["paths"], case["typescriptComplete"], strict=True
        ):
            for line in [case["expression"], *path]:
                comparisons += 1
                parts = line.split("=")
                if len(parts) == 1:
                    correct = sp.simplify(expression(line) - answer) == 0
                elif len(parts) == 2:
                    correct = sp.solve(
                        expression(parts[0]) - expression(parts[1]), x
                    ) == [answer]
                else:
                    correct = False
                if not correct or not complete:
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
        "scope": "Generated fraction curriculum: each expression/reference/alternative checked against independent parameter arithmetic; not OCR accuracy or an educational outcome.",
    }
    Path("artifacts/fraction-oracle-results.json").write_text(
        json.dumps(report, indent=2) + "\n"
    )
    print(
        json.dumps(
            {k: v for k, v in report.items() if k != "disagreements"}
            | {"disagreements": len(disagreements)}
        )
    )
    if disagreements:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
