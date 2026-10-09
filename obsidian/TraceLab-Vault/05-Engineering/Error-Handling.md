# Error Handling

Zod failures return INVALID_INPUT and field paths; domain parsing failures do not expose internals. HTTP errors use stable codes and request IDs. Unknown server errors log only request_id and INTERNAL_ERROR. UI catches errors and displays dismissible alerts. OCR adapter outcomes distinguish unavailable provider, timeout, invalid output, and provider failure, always allowing manual entry. Missing permissions return scoped 404 responses.

Related: [[00-START-HERE]] · [[Current-State]]
