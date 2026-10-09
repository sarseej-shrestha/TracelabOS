import pytest
from dataset import read_ink, render, samples
from metrics import canonical, distance, summarize


@pytest.mark.parametrize(
    "a,b,want",
    [
        ("", "", 0),
        ("", "abc", 3),
        ("abc", "", 3),
        ("kitten", "sitting", 3),
        ("x=7", "x=1", 1),
        ("1/2", "12", 1),
    ],
)
def test_edit_distance(a, b, want):
    assert distance(a, b) == want
    assert distance(b, a) == want


@pytest.mark.parametrize(
    "a,b",
    [
        (r"\left(x+1\right)", "(x+1)"),
        ("x + 1", "x+1"),
        (r"\frac{1}{2}", r"\frac{1}{2}"),
    ],
)
def test_allowed_normalization(a, b):
    assert canonical(a) == canonical(b)


@pytest.mark.parametrize(
    "a,b",
    [
        (r"\leftarrow", r"\rightarrow"),
        ("x-1", "x+1"),
        (r"\frac{1}{2}", "1/2"),
        ("x^2", "x2"),
    ],
)
def test_distinct_symbols_and_forms_remain_distinct(a, b):
    assert canonical(a) != canonical(b)


def test_metrics_count_failures_and_use_nearest_rank_percentiles():
    rows = [
        {
            "expected": "abc",
            "exact": i == 0,
            "edit_distance": i,
            "duration_ms": i + 1,
            "error": "Timeout" if i == 2 else None,
        }
        for i in range(3)
    ]
    actual = summarize(rows)
    assert actual["samples"] == 3
    assert actual["exact_expression_accuracy"] == 1 / 3
    assert actual["character_edit_rate"] == 1 / 3
    assert actual["latency_p50_ms"] == 2
    assert actual["latency_p95_ms"] == 3
    assert actual["provider_errors"] == 1


def test_empty_benchmark_cannot_claim_success():
    with pytest.raises(ValueError):
        summarize([])


def test_renderer_is_bounded_and_retains_dark_strokes():
    image = render([[(0, 0), (100000, 1000)], [(100000, 0)]])
    assert image.width <= 1040 and image.height <= 168
    assert image.convert("L").getextrema()[0] < 20
    with pytest.raises(ValueError):
        render([])


def test_public_ink_metadata_and_coordinates_are_read_without_evaluating_text(tmp_path):
    file = tmp_path / "sample.inkml"
    file.write_text(
        '<ink xmlns="http://www.w3.org/2003/InkML"><annotation type="normalizedLabel">x+1</annotation><trace>1 2 0, 3 4 10</trace></ink>'
    )
    metadata, strokes = read_ink(file)
    assert metadata["normalizedLabel"] == "x+1"
    assert strokes == [[(1.0, 2.0), (3.0, 4.0)]]


def test_selection_rejects_missing_human_test_data(tmp_path):
    with pytest.raises(ValueError):
        samples(tmp_path, 1)
