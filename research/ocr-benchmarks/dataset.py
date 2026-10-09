"""Reproducible research-only rendering of human MathWriting test strokes."""

import hashlib
import tarfile
import urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path

from PIL import Image, ImageDraw

URL = "https://storage.googleapis.com/mathwriting_data/mathwriting-2024-excerpt.tgz"
SHA256 = "cba038def001480a89962b25cb20a60df4c4145e94c86ef9d2af65f192cb82bc"


def prepare(root: Path) -> Path:
    root.mkdir(parents=True, exist_ok=True)
    archive = root / "mathwriting-2024-excerpt.tgz"
    if not archive.exists():
        urllib.request.urlretrieve(URL, archive)
    if hashlib.sha256(archive.read_bytes()).hexdigest() != SHA256:
        raise ValueError("Dataset checksum mismatch")
    destination = root / "mathwriting-2024-excerpt"
    if not destination.exists():
        with tarfile.open(archive) as source:
            source.extractall(root, filter="data")
    return destination


def read_ink(path: Path):
    root = ET.parse(path).getroot()
    metadata = {
        e.attrib.get("type"): e.text for e in root if e.tag.endswith("annotation")
    }
    strokes = [
        [
            tuple(float(v) for v in point.strip().split()[:2])
            for point in element.text.split(",")
        ]
        for element in root
        if element.tag.endswith("trace") and element.text
    ]
    return metadata, strokes


def samples(root: Path, count: int = 24):
    """First eligible sorted test IDs, chosen without observing model predictions."""
    selected = []
    for path in sorted((root / "test").glob("*.inkml")):
        metadata, strokes = read_ink(path)
        label = metadata.get("normalizedLabel", "")
        if metadata.get("inkCreationMethod") == "human" and 0 < len(label) <= 64:
            selected.append((path.stem, label, strokes))
        if len(selected) == count:
            break
    if len(selected) != count:
        raise ValueError("Insufficient eligible human test samples")
    return selected


def render(strokes):
    points = [point for stroke in strokes for point in stroke]
    if not points:
        raise ValueError("Empty handwriting")
    x0, y0 = min(p[0] for p in points), min(p[1] for p in points)
    width = max(p[0] for p in points) - x0
    height = max(p[1] for p in points) - y0
    scale = min(1000 / max(width, 1), 128 / max(height, 1))
    size = (max(1, round(width * scale)) + 40, max(1, round(height * scale)) + 40)
    image = Image.new("RGB", (size[0] * 2, size[1] * 2), "white")
    draw = ImageDraw.Draw(image)
    radius = max(1.0, 1.5 * scale) * 2
    for stroke in strokes:
        coords = [
            ((x - x0) * scale * 2 + 40, (y - y0) * scale * 2 + 40) for x, y in stroke
        ]
        if len(coords) > 1:
            draw.line(
                coords, fill="black", width=max(2, round(radius * 2)), joint="curve"
            )
        for x, y in coords:
            draw.ellipse((x - radius, y - radius, x + radius, y + radius), fill="black")
    return image.resize(size, Image.Resampling.LANCZOS)
