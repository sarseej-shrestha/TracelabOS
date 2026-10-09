"""Run actual OCR candidates on a fixed, research-only handwriting pilot."""

import argparse
import hashlib
import json
import os
import platform
import random
import time
from datetime import datetime, timezone
from pathlib import Path

from dataset import SHA256, URL, prepare, render, samples
from metrics import canonical, distance, summarize
from models import load_model
from PIL import ImageFilter


def main():
    os.environ["NO_ALBUMENTATIONS_UPDATE"] = "1"
    os.environ["HF_HUB_DISABLE_TELEMETRY"] = "1"
    os.environ["HF_HUB_DISABLE_XET"] = "1"
    parser = argparse.ArgumentParser()
    parser.add_argument("--model", choices=["pix2tex", "pix2text"], default="pix2tex")
    parser.add_argument("--data", type=Path, default=Path(".data/ocr-research"))
    parser.add_argument("--output", type=Path, default=None)
    parser.add_argument("--count", type=int, default=24)
    args = parser.parse_args()
    import numpy as np
    import torch

    random.seed(20261008)
    np.random.seed(20261008)
    torch.manual_seed(20261008)
    torch.set_num_threads(4)
    started = time.perf_counter()
    model, model_metadata = load_model(args.model, args.data / "models")
    load_ms = (time.perf_counter() - started) * 1000
    selected = samples(prepare(args.data), args.count)
    rendered = args.data / "rendered"
    rendered.mkdir(exist_ok=True)
    # One real warm-up, excluded from latency statistics and recorded separately.
    started = time.perf_counter()
    model(render(selected[0][2]))
    warmup_ms = (time.perf_counter() - started) * 1000
    rows = []
    for sample_id, expected, strokes in selected:
        original = render(strokes)
        for variant, image in [
            ("clean", original),
            ("blur", original.filter(ImageFilter.GaussianBlur(1.2))),
            ("rotation", original.rotate(8, expand=True, fillcolor="white")),
        ]:
            filename = rendered / f"{sample_id}-{variant}.png"
            image.save(filename)
            torch.manual_seed(20261008)
            started = time.perf_counter()
            predicted = ""
            error = None
            try:
                predicted = model(image)
            except Exception as exc:  # noqa: BLE001 - retain every model failure as a measured outcome
                error = type(exc).__name__
            row = {
                "sample_id": sample_id,
                "variant": variant,
                "expected": expected,
                "predicted": predicted,
                "error": error,
                "duration_ms": round((time.perf_counter() - started) * 1000, 3),
                "image_sha256": hashlib.sha256(filename.read_bytes()).hexdigest(),
                "exact": error is None and canonical(expected) == canonical(predicted),
                "edit_distance": distance(canonical(expected), canonical(predicted)),
            }
            rows.append(row)
            print(
                json.dumps(
                    {
                        k: row[k]
                        for k in [
                            "sample_id",
                            "variant",
                            "exact",
                            "duration_ms",
                            "error",
                        ]
                    }
                ),
                flush=True,
            )
    report = {
        "executed_at": datetime.now(timezone.utc).isoformat(),
        **model_metadata,
        "runtime": {
            "python": platform.python_version(),
            "platform": platform.platform(),
            "torch": torch.__version__,
            "cpu_threads": 4,
            "device": "cpu",
            "seed": 20261008,
        },
        "dataset": {
            "url": URL,
            "archive_sha256": SHA256,
            "license": "CC BY-NC-SA 4.0; Wikipedia-derived labels CC BY-SA 4.0",
            "split": "test",
            "selection": f"first {args.count} sorted human test IDs with normalized label length 1..64",
            "count": args.count,
            "source": "Google LLC MathWriting",
        },
        "model_load_ms": round(load_ms, 3),
        "warmup_ms": round(warmup_ms, 3),
        "aggregate": summarize(rows),
        "by_variant": {
            variant: summarize([r for r in rows if r["variant"] == variant])
            for variant in ["clean", "blur", "rotation"]
        },
        "unmeasured": [
            "human correction frequency",
            "line ordering",
            "photographed classroom accuracy",
            "hosted cost",
            "downstream grading error rate",
        ],
        "limitations": "Small formula OCR feasibility pilot. Rasterized pen strokes are genuine handwriting, not paper photographs; formulas extend beyond supported grade 5–8 mathematics. No production model selection or grading precision claim.",
        "rows": rows,
    }
    args.output = args.output or Path(f"artifacts/ocr-{args.model}-pilot.json")
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(report, indent=2) + "\n")
    print(json.dumps(report["aggregate"]), flush=True)


if __name__ == "__main__":
    main()
