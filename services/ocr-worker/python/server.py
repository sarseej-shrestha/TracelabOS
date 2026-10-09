"""Experimental authenticated localhost inference, outside the application process."""

import base64
import hmac
from http.server import BaseHTTPRequestHandler, HTTPServer
import json
import os
from pathlib import Path
import sys
from transcription import MODEL_VERSION, transcribe

ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT / "research/ocr-benchmarks"))


def main():
    token = os.environ.get("TRACELAB_OCR_TOKEN", "")
    if len(token) < 32:
        raise ValueError("Set TRACELAB_OCR_TOKEN to at least 32 random characters")
    os.environ["HF_HUB_DISABLE_TELEMETRY"] = "1"
    os.environ["HF_HUB_DISABLE_XET"] = "1"
    from models import load_model
    import torch

    torch.set_num_threads(4)
    recognize, _metadata = load_model("pix2text", ROOT / ".data/ocr-research/models")

    class Handler(BaseHTTPRequestHandler):
        def setup(self):
            super().setup()
            self.connection.settimeout(15)

        def log_message(self, _format, *_args):
            pass  # Never log request bodies, photographs or tokens.

        def reply(self, status, body):
            encoded = json.dumps(body).encode()
            self.send_response(status)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(encoded)))
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            try:
                self.wfile.write(encoded)
            except (BrokenPipeError, ConnectionResetError):
                pass

        def do_GET(self):
            self.reply(
                200 if self.path == "/health" else 404,
                {"modelVersion": MODEL_VERSION, "experimental": True},
            )

        def do_POST(self):
            if self.path != "/transcribe":
                self.reply(404, {"error": "NOT_FOUND"})
                return
            supplied = self.headers.get("Authorization", "")
            if not hmac.compare_digest(supplied, f"Bearer {token}"):
                self.reply(401, {"error": "UNAUTHORIZED"})
                return
            try:
                size = int(self.headers.get("Content-Length", "0"))
                if not 1 <= size <= 7 * 1024 * 1024:
                    self.reply(413, {"error": "BODY_TOO_LARGE"})
                    return
                request = json.loads(self.rfile.read(size))
                image = base64.b64decode(request["image"], validate=True)
                result = transcribe(image, request["questionId"], recognize)
            except (ValueError, KeyError, TypeError, OSError):
                self.reply(422, {"error": "EXTRACTION_FAILED"})
                return
            except RuntimeError:
                self.reply(503, {"error": "MODEL_UNAVAILABLE"})
                return
            self.reply(200, result)

    server = HTTPServer(
        ("127.0.0.1", int(os.environ.get("TRACELAB_OCR_PORT", "8020"))), Handler
    )
    print(
        json.dumps(
            {
                "listening": "127.0.0.1",
                "port": server.server_port,
                "modelVersion": MODEL_VERSION,
            }
        ),
        flush=True,
    )
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
