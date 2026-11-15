# Houston public research proxy

Latest update: the user selected the sharing incentive path. The prepared model is now pinned to gpt-5.4-mini-2026-03-17. Generation remains disabled, with project and balance confirmations pending. 32 offline tests pass; no live OpenAI model request has occurred. See PROMOTION_STATUS.md for current account-report status and OPENAI_SETUP.md for implementation details. Prior Terra/Groq sections are historical.


Revision November 15, 2026: OpenAI Responses API is supported alongside the existing explicit Groq option. The deployed provider is OpenAI with GPT-6.1 Terra selected and generation DISABLED pending the project credential and test-budget approval. See OPENAI_SETUP.md. Responses identify provider and model; the older Groq example below illustrates the shared evidence contract, not the currently selected model.

PC02 owns this proxy under ORD-PC01-0011. PC01 owns Firestore and the website. All requests to Firestore are read-only, including the REST `:runQuery` operation. No client-provided evidence or source URL is accepted.

## Endpoint

`POST <deployed-base-url>/v1/answer`

```json
{
  "question": "What conditions differ between Saffire-I S1 and S2?",
  "accession": "PSI-98",
  "test_uids": [
    "PSI-98|PSI-98_Experimental table_SAFFIRE-1.csv|1",
    "PSI-98|PSI-98_Experimental table_SAFFIRE-1.csv|2"
  ]
}
```

Question: 1–500 characters. Body: at most 4,096 UTF-8 bytes. Provide an accession, 1–6 exact UIDs, or both. If accession and UIDs are both provided, their study IDs must agree. Without an accession, studies are derived only from exact supplied UIDs; no study-name guessing occurs. Unknown studies/UIDs produce insufficient evidence. A blank row is not an experiment.

For an accession-only request, up to six nonblank rows are ranked lexically within that investigation; these are a subset, not exhaustive study coverage. Explicit UIDs are strongly recommended for comparisons. Retrieval supports at most four chunk documents per selected study. Selection overflow or any missing requested UID blocks generation rather than silently substituting another row.

## Response

```json
{
  "status": "generated_requires_source_review",
  "model": "openai/gpt-oss-20b",
  "claims": [{
    "text": "Percent O2 — PSI-98 / S1: \"21.5 - 21.7\"; PSI-98 / S2: \"~ 21.5\". Values are listed exactly as recorded.",
    "evidence_ids": ["row:PSI-98|PSI-98_Experimental table_SAFFIRE-1.csv|1", "row:PSI-98|PSI-98_Experimental table_SAFFIRE-1.csv|2"],
    "numeric_check": {
      "status": "passed_exact_raw",
      "method": "validated_source_selection_and_server_rendering",
      "scientific_comparability": "not_established"
    }
  }],
  "limitations": ["In the supplied evidence, only the selected source cells are assessed; omitted measurements may exist elsewhere in the NASA dataset."],
  "evidence": [{
    "evidence_id": "row:PSI-98|PSI-98_Experimental table_SAFFIRE-1.csv|1",
    "locator": "PSI-98_Experimental table_SAFFIRE-1.csv:data_row=1",
    "text": "Percent O2: 21.5 - 21.7",
    "cells": {"Percent O2": "21.5 - 21.7"},
    "row_type": "test",
    "classification_status": "provisional"
  }]
}
```

The example is abbreviated; actual evidence includes all nonempty original string cells in the selected source rows, accession, UID, original test ID, source document, DOI/PSI URL and review flags. Numeric checks also include the exact original field/raw/evidence identities. Preserve those fields in the evidence viewer.

## Numeric checks and scientific limits

The model selects exact column labels, evidence IDs and complete raw cell strings. The server validates those selections and constructs the displayed text. Model-written narrative, new values, rounding, conversions, altered units, removed approximation markers and copied intervals are rejected. `identical_raw_values` requires the same column label and byte-for-byte equality across at least two cited source cells. The failed S1/S2 oxygen example is a blocking regression test.

Generated limitations are restricted to known codes; the server displays fixed limitations scoped to the supplied evidence. It never turns absence from selected cells into absence from the entire NASA dataset.

`passed_exact_raw` establishes faithful source-cell reproduction, not measurement correctness, relevance, causal equivalence or safe conditions. A dubious value in NASA's table remains dubious. This constrained assistant does not produce unrestricted scientific prose or calibrations not present in the public row cells. Full Readme paragraphs, workbook calibrations and remote media from the local corpus are not available through these Firestore collections. PC01 can display the source rows even when the model cannot answer.

## Statuses

| Status | HTTP | UI behavior |
|---|---:|---|
| `generated_requires_source_review` | 200 | Display checked source values with their citations and limitations. |
| `insufficient_evidence` | 200 | Display evidence and the selection gaps; make no inferred answer. |
| `answer_rejected` | 200 | Display evidence only; model selections failed validation. |
| `provider_unavailable` | 200 | Display evidence only; disabled/missing secret, free quota, timeout or input budget. |
| `evidence_unavailable` | 503 | Retain evidence already loaded by the website; do not invent replacements. |
| `rate_limited` | 429 | Respect `Retry-After: 60`; do not auto-retry. |
| request validation errors | 400/413/415 | Correct the request; no model request is made. |
| `origin_not_allowed` | 403 | Caller origin is not allowed. |
| `limiter_unavailable` / `client_identity_unavailable` | 503 | Limits cannot be enforced; no source/model requests. |

No retry or paid-provider/model substitution occurs. Every call has at most one model generation. Model input messages must fit 7,000 UTF-8 bytes (a conservative transport budget, not an exact tokenizer count); output is capped at 1,200 completion tokens, temperature 0. The model is fixed rather than client selectable.

## Browser integration

CORS permits exactly `https://flame-in-freefall-aqp.web.app`, `https://ignis-combustion-explorer.cheeky-vole-0211.chatgpt.site` and HTTP `localhost` origins (optional port). No wildcard, credentials or arbitrary origin reflection. CORS controls browser access; it is not authentication and non-browser clients can forge Origin. Cloudflare supplies the client IP; arbitrary forwarded-IP headers are ignored. Limits: approximately three requests/minute/IP and twenty requests/minute total **per Cloudflare location**. Cloudflare's binding is not a strict global quota.

Use `textContent` to display text/cell strings. Do not insert source/model strings using `innerHTML`. Always display limitations and record classification/review flags. A rejected/unavailable answer is an evidence-only state, not an invitation to retry repeatedly.

## Deployment and cost

`wrangler.toml` defaults to generation disabled. Enable only after confirming both accounts remain on their free plans and setting `GROQ_API_KEY` through Worker secrets. Code cannot detect or guarantee a provider billing-plan change. Do not activate a paid plan, add a card, or use a paid fallback.

Groq 429 responses return `provider_unavailable` with evidence. If Cloudflare's own free platform quota/CPU limit is exhausted, the Worker may be terminated before it can construct a custom JSON response; the website must retain its already-loaded Firestore evidence. No code can promise an evidence pack from a Worker that the platform did not execute.

`GET /health` is public and reports service/model and whether generation is configured; it never returns credentials. Requests/questions and provider bodies are not logged by this code. Cloudflare logs and traces are enabled with 5% and 1% sampling respectively. This code does not log question bodies, evidence cells or credentials.

## Official references checked November 14, 2026

- [Cloudflare rate-limit binding and accuracy](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/)
- [Workers pricing and free plan](https://developers.cloudflare.com/workers/platform/pricing/)
- [Worker secrets](https://developers.cloudflare.com/workers/configuration/secrets/)
- [Groq supported production models](https://console.groq.com/docs/models)
- [Firestore runQuery REST reference](https://firebase.google.com/docs/firestore/reference/rest/v1/projects.databases.documents/runQuery)
