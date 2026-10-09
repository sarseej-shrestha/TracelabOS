import io
from PIL import Image, ImageDraw
import pytest
from transcription import decode_image, regions, transcribe, MODEL_VERSION


def encoded(image):
    buffer = io.BytesIO()
    image.save(buffer, format="PNG")
    return buffer.getvalue()


def test_separates_spaced_rows_and_reports_measured_normalized_regions():
    image = Image.new("RGB", (200, 160), "white")
    draw = ImageDraw.Draw(image)
    draw.rectangle((20, 10, 90, 30), fill="black")
    draw.rectangle((20, 90, 100, 110), fill="black")
    boxes = regions(image)
    assert len(boxes) == 2 and boxes[0][3] < boxes[1][1]
    result = transcribe(encoded(image), "q", lambda _: "x=7")
    assert (
        result["modelVersion"] == MODEL_VERSION
        and result["status"] == "needs_confirmation"
    )
    assert [line["line"] for line in result["lines"]] == [1, 2]
    assert all(0 <= number <= 1 for line in result["lines"] for number in line["bbox"])
    assert all("confidence" not in line for line in result["lines"])


def test_keeps_a_fraction_bar_and_its_nearby_terms_together():
    image = Image.new("RGB", (120, 100), "white")
    draw = ImageDraw.Draw(image)
    draw.rectangle((45, 10, 55, 22), fill="black")
    draw.rectangle((30, 31, 75, 32), fill="black")
    draw.rectangle((45, 41, 55, 53), fill="black")
    assert len(regions(image)) == 1


def test_blank_image_and_malformed_payload_fail_explicitly():
    with pytest.raises(ValueError):
        transcribe(encoded(Image.new("RGB", (40, 40), "white")), "q", lambda _: "x=7")
    with pytest.raises((ValueError, OSError)):
        decode_image(b"not an image payload")
    with pytest.raises(ValueError):
        decode_image(b"x" * (5 * 1024 * 1024 + 1))


def test_oversized_image_dimensions_are_rejected():
    image = Image.new("1", (4001, 4000), 1)
    with pytest.raises(ValueError):
        decode_image(encoded(image))


def test_model_output_is_bounded_and_never_silently_truncated():
    image = Image.new("RGB", (40, 40), "white")
    ImageDraw.Draw(image).rectangle((10, 10, 20, 20), fill="black")
    for result in ["", "x" * 513, None]:
        with pytest.raises(ValueError):
            transcribe(encoded(image), "q", lambda _: result)


def test_too_many_regions_require_manual_entry():
    image = Image.new("RGB", (100, 1000), "white")
    draw = ImageDraw.Draw(image)
    for y in range(0, 900, 40):
        draw.rectangle((10, y, 40, y + 10), fill="black")
    with pytest.raises(ValueError, match="TOO_MANY_REGIONS"):
        regions(image)
