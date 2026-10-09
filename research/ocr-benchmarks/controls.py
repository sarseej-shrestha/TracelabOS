"""Small typeset controls; not included in handwriting accuracy statistics."""

import argparse
import json
import os
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
from models import load_model


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--font", type=Path, required=True)
    parser.add_argument("--model", choices=["pix2tex", "pix2text"], default="pix2tex")
    args = parser.parse_args()
    os.environ["NO_ALBUMENTATIONS_UPDATE"] = "1"
    import torch

    torch.set_num_threads(4)
    torch.manual_seed(20261008)
    model, _metadata = load_model(args.model, Path(".data/ocr-research/models"))
    rows = []
    for label in ["x = 7", "3(x - 2) = 15", "1 + 2 = 3"]:
        image = Image.new("RGB", (450, 110), "white")
        ImageDraw.Draw(image).text(
            (20, 20), label, font=ImageFont.truetype(str(args.font), 48), fill="black"
        )
        rows.append({"expected": label, "predicted": model(image)})
    output = Path(f"artifacts/ocr-{args.model}-controls.json")
    output.write_text(json.dumps(rows, indent=2) + "\n")
    print(json.dumps(rows))


if __name__ == "__main__":
    main()
