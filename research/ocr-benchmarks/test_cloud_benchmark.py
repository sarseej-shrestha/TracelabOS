import json
from concurrent.futures import ThreadPoolExecutor

import pytest

from cloud_benchmark import (
    MAX_CALLS_PER_DAY,
    model_input,
    parse_prediction,
    reserve_call,
)


def test_fixed_prompts_bound_tokens_and_do_not_expose_general_inference():
    image = "data:image/png;base64,AAAA"
    for model in ["moondream", "mistral"]:
        payload = model_input(model, image)
        assert payload["max_tokens"] == 512
        assert payload["temperature"] == 0
    assert model_input("moondream", image)["reasoning"] is False
    with pytest.raises(ValueError):
        model_input("arbitrary", image)
    with pytest.raises(ValueError):
        model_input("moondream", "https://untrusted.example/photo")


def test_json_transcription_preserves_errors_without_evaluating():
    result = {"answer": json.dumps({"lines": ["3(x-2)=15", "3x-2=15"]})}
    assert parse_prediction(result, "moondream") == "3(x-2)=15\n3x-2=15"
    assert (
        parse_prediction({"response": '```json\n{"lines":["x=7"]}\n```'}, "mistral")
        == "x=7"
    )


@pytest.mark.parametrize(
    "payload",
    [
        {},
        {"answer": 3},
        {"answer": "x" * 8193},
        {"answer": '{"lines":[]}'},
        {"answer": '{"lines":"x=7"}'},
        {"answer": '{"lines":[3]}'},
        {"answer": '{"lines":["x=7"],"grade":100}'},
        {"answer": json.dumps({"lines": ["x=7"] * 25})},
        {"answer": json.dumps({"lines": ["x" * 513]})},
    ],
)
def test_invalid_output_fails_closed(payload):
    with pytest.raises((ValueError, TypeError)):
        parse_prediction(payload, "moondream")


def test_persisted_daily_budget_survives_concurrent_process_handles(tmp_path):
    path = tmp_path / "budget.json"

    def attempt(_):
        try:
            reserve_call(path, "2026-10-11")
            return True
        except ValueError:
            return False

    with ThreadPoolExecutor(max_workers=8) as pool:
        accepted = sum(pool.map(attempt, range(32)))
    assert accepted == MAX_CALLS_PER_DAY
    assert json.loads(path.read_text())["calls"] == MAX_CALLS_PER_DAY
    reserve_call(path, "2026-10-12")
    assert json.loads(path.read_text())["calls"] == 1


def test_corrupt_budget_never_silently_resets(tmp_path):
    path = tmp_path / "budget.json"
    path.write_text('{"day":"2026-10-11","calls":-1}')
    with pytest.raises(ValueError):
        reserve_call(path, "2026-10-11")


def test_mistral_object_response_preserves_literal_latex():
    # Observed hosted response: JSON was already decoded by the provider.
    result = {"response": {"lines": [r"\\nabla I = (I \\times I)"]}}
    assert parse_prediction(result, "mistral") == r"\\nabla I = (I \\times I)"


@pytest.mark.parametrize(
    "payload",
    [
        {"lines": ["x=7"], "grade": 100},
        {"lines": []},
        {"lines": ["x" * 512] * 24},
        {"lines": [False]},
    ],
)
def test_decoded_response_obeys_the_same_strict_contract(payload):
    with pytest.raises(ValueError):
        parse_prediction({"response": payload}, "mistral")


def test_recorded_rescore_is_offline_and_preserves_original_evidence(monkeypatch):
    from pathlib import Path
    from cloud_benchmark import rescore

    def prohibited(*args, **kwargs):
        raise AssertionError("Offline scoring must not use network or credentials")

    monkeypatch.setattr("cloud_benchmark.credential", prohibited)
    monkeypatch.setattr("cloud_benchmark.urllib.request.build_opener", prohibited)
    path = (
        Path(__file__).resolve().parents[2]
        / "artifacts/ocr-hosted-initial-contract.json"
    )
    original = json.loads(path.read_text())
    before = json.dumps(original)
    scored = rescore(original)
    assert json.dumps(original) == before
    for old, new in zip(original["candidates"], scored["candidates"], strict=True):
        assert len(new["rows"]) == 8
        for initial, corrected in zip(old["rows"], new["rows"], strict=True):
            for key in [
                "raw_result",
                "expected",
                "sample_id",
                "image_sha256",
                "duration_ms",
                "http_status",
            ]:
                assert corrected[key] == initial[key]
    assert scored["candidates"][0]["aggregate"]["invalid_outputs"] == 8
    # The eighth response contains unescaped LaTeX in JSON (\\Theta),
    # which must remain rejected instead of silently repairing model output.
    assert scored["candidates"][1]["aggregate"]["invalid_outputs"] == 1
    assert scored["candidates"][1]["rows"][-1]["error"] == "INVALID_TRANSCRIPTION"
    assert scored["candidates"][1]["rows"][-1]["predicted"] == ""
    assert scored["candidates"][1]["reported_usage"]["responses_with_neurons"] == 8
    assert rescore(scored) == scored
