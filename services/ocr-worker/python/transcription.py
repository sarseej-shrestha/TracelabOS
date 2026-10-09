"""Bounded single-column region proposals. A human must confirm every result."""

import io
from statistics import median
from PIL import Image, ImageOps

MODEL_VERSION = "pix2text-mfr-1.5@1cef9f0:regions-v1"


def decode_image(data: bytes):
    if not 12 <= len(data) <= 5 * 1024 * 1024:
        raise ValueError("IMAGE_SIZE")
    image = Image.open(io.BytesIO(data))
    if image.format not in {"JPEG", "PNG"} or image.width * image.height > 16_000_000:
        raise ValueError("INVALID_IMAGE")
    image.load()
    image = ImageOps.exif_transpose(image).convert("RGB")
    image.thumbnail((2000, 2000))
    return image


def regions(image):
    grayscale = ImageOps.autocontrast(image.convert("L"))
    ink = grayscale.point(lambda value: 255 if value < 160 else 0)
    runs = []
    start = None
    for y in range(image.height + 1):
        active = (
            y < image.height
            and ink.crop((0, y, image.width, y + 1)).getbbox() is not None
        )
        if active and start is None:
            start = y
        if not active and start is not None:
            runs.append([start, y])
            start = None
    if not runs:
        raise ValueError("NO_VISIBLE_WRITING")
    typical = max(8, median(end - start for start, end in runs))
    merged = []
    for start, end in runs:
        gap = start - merged[-1][1] if merged else float("inf")
        if merged and gap <= max(6, typical / 3):
            merged[-1][1] = end
        else:
            merged.append([start, end])
    # A thin horizontal fraction bar connects its nearby numerator and denominator.
    i = 1
    while i < len(merged) - 1:
        start, end = merged[i]
        box = ink.crop((0, start, image.width, end)).getbbox()
        if (
            end - start <= max(3, typical / 4)
            and box
            and box[2] - box[0] >= typical
            and start - merged[i - 1][1] <= typical
            and merged[i + 1][0] - end <= typical
        ):
            merged[i - 1 : i + 2] = [[merged[i - 1][0], merged[i + 1][1]]]
            i = max(1, i - 1)
        else:
            i += 1
    if len(merged) > 20:
        raise ValueError("TOO_MANY_REGIONS")
    boxes = []
    for start, end in merged:
        box = ink.crop((0, start, image.width, end)).getbbox()
        boxes.append(
            (
                max(0, box[0] - 6),
                max(0, start - 6),
                min(image.width, box[2] + 6),
                min(image.height, end + 6),
            )
        )
    return boxes


def transcribe(data: bytes, question_id: str, recognize):
    if not isinstance(question_id, str) or not 1 <= len(question_id) <= 100:
        raise ValueError("INVALID_QUESTION")
    image = decode_image(data)
    lines = []
    for index, (x0, y0, x1, y1) in enumerate(regions(image), 1):
        latex = recognize(image.crop((x0, y0, x1, y1)))
        if not isinstance(latex, str) or not 1 <= len(latex) <= 512:
            raise ValueError("INVALID_MODEL_OUTPUT")
        lines.append(
            {
                "line": index,
                "raw": latex,
                "latex": latex,
                "bbox": [
                    x0 / image.width,
                    y0 / image.height,
                    x1 / image.width,
                    y1 / image.height,
                ],
            }
        )
    return {
        "questionId": question_id,
        "modelVersion": MODEL_VERSION,
        "status": "needs_confirmation",
        "lines": lines,
    }
