# Handwriting benchmark protocol — not yet executed

No real OCR results are included. Provider-contract tests are not handwriting accuracy tests.

Collect consented or controlled samples covering fractions, signs, parentheses, exponents, nested layouts, line order, lighting, perspective, blur, and crossed-out steps. Each manifest row must include an opaque sample ID, image checksum, consent/source category, expected ordered expressions, condition tags, and adjudication notes. Label synthetic typeset controls separately from actual handwriting.

Freeze a held-out set before provider selection. Record model/checkpoint version, preprocessing version, inference parameters, elapsed time, provider usage units, and monetary cost if any. Preserve raw responses without trusting self-reported confidence. Never fabricate bounding boxes.

Report exact expression and ordered-line accuracy, symbol edit distance, student correction frequency, downstream first-error disagreements after uncorrected transcription, and p50/p95 latency. Human correction frequency needs observed human review; model string differences alone are not that measurement.

Timeouts, invalid output, quotas, and outages belong in the denominator. A manually transcribed sample is fallback success, not OCR success. Gate hosted selection on measured results and mandatory student confirmation.
