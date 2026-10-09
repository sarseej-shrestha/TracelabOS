"""Text fidelity metrics, never mathematical correctness or learning outcomes."""

import math
import re


def canonical(text: str) -> str:
    return re.sub(r"\s+", "", re.sub(r"\\(?:left|right)(?![A-Za-z])", "", text))


def distance(a: str, b: str) -> int:
    previous = list(range(len(b) + 1))
    for i, left in enumerate(a, 1):
        current = [i]
        for j, right in enumerate(b, 1):
            current.append(
                min(current[-1] + 1, previous[j] + 1, previous[j - 1] + (left != right))
            )
        previous = current
    return previous[-1]


def summarize(rows):
    if not rows:
        raise ValueError("No measured samples")
    times = sorted(row["duration_ms"] for row in rows)
    edits = sum(row["edit_distance"] for row in rows)
    characters = sum(len(canonical(row["expected"])) for row in rows)
    return {
        "samples": len(rows),
        "exact_matches": sum(row["exact"] for row in rows),
        "exact_expression_accuracy": sum(row["exact"] for row in rows) / len(rows),
        "character_edit_rate": edits / max(1, characters),
        "character_edits": edits,
        "reference_characters": characters,
        "latency_p50_ms": times[math.ceil(len(times) * 0.5) - 1],
        "latency_p95_ms": times[math.ceil(len(times) * 0.95) - 1],
        "provider_errors": sum(row["error"] is not None for row in rows),
    }
