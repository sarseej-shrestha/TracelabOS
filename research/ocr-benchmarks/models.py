"""Local research candidates; no hosted API or clipboard side effects."""

import hashlib
from importlib.metadata import version
from pathlib import Path
from types import SimpleNamespace

PIX2TEXT_REVISION = "1cef9f0bdcd6a4c63df7de1311fb0894593340cc"


def fingerprints(paths):
    result = {}
    for path in sorted(paths):
        with path.open("rb") as stream:
            result[path.name] = hashlib.file_digest(stream, "sha256").hexdigest()
    return result


def load_model(name: str, cache: Path):
    if name == "pix2tex":
        import pix2tex.cli as cli

        cli.clipboard = SimpleNamespace(copy=lambda _: None)
        model = cli.LatexOCR()
        weights = Path(cli.__file__).parent / "model/checkpoints"
        return model, {
            "model": name,
            "package_version": version("pix2tex"),
            "weights": fingerprints(weights.glob("*.pth")),
            "device": "cpu",
            "threads": 4,
        }
    if name == "pix2text":
        from huggingface_hub import snapshot_download
        from optimum.onnxruntime import ORTModelForVision2Seq
        from transformers import TrOCRProcessor
        import onnxruntime as ort

        snapshot = Path(
            snapshot_download(
                "breezedeus/pix2text-mfr-1.5",
                revision=PIX2TEXT_REVISION,
                cache_dir=cache,
                allow_patterns=["*.json", "*.onnx"],
            )
        )
        processor = TrOCRProcessor.from_pretrained(snapshot)
        options = ort.SessionOptions()
        options.intra_op_num_threads = 4
        options.inter_op_num_threads = 1
        model = ORTModelForVision2Seq.from_pretrained(
            snapshot,
            use_cache=False,
            provider="CPUExecutionProvider",
            session_options=options,
        )

        def recognize(image):
            values = processor(
                images=[image.convert("RGB")], return_tensors="pt"
            ).pixel_values
            ids = model.generate(values, max_new_tokens=256, do_sample=False)
            return processor.batch_decode(ids, skip_special_tokens=True)[0]

        return recognize, {
            "model": "pix2text-mfr-1.5",
            "revision": PIX2TEXT_REVISION,
            "runtime_packages": {
                p: version(p)
                for p in ["transformers", "optimum-onnx", "onnxruntime", "torch"]
            },
            "weights": fingerprints(snapshot.glob("*.onnx")),
            "device": "CPUExecutionProvider",
            "threads": 4,
            "max_new_tokens": 256,
        }
    raise ValueError("Unknown OCR candidate")
