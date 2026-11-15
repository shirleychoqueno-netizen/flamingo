# Product priorities supplied by the team

Reference: FLAMINGO_PRIORIDADES_RETO_Y_RUBRICA.md, supplied November 15, 2026. This is a working product backlog derived from the team's document, not a newly verified official challenge rubric or a declaration that the features below are shipped. Product code and current validation receipts remain the source of implementation status.

## Main objective

Make the complete question → relevant investigation → inspectable evidence → cautious interpretation → comparison/export workflow easy to recognize for a combustion researcher or spacecraft fire-safety engineer.

The existing guide performs real hybrid retrieval and source-backed navigation. It does not generate unrestricted public scientific answers. The highest-value proposed addition is a clearly sourced interpretation layer that preserves that distinction.

## Prioritized backlog

| Priority | Work | Current evidence / acceptance |
| --- | --- | --- |
| P0 | Verify question-to-source and comparison/export links in the actual browser | Existing render/data/HTTP checks cover parts of the path; full browser interaction/mobile review remains pending. Lexical fallback and recorded GPT status must stay explicit. |
| P0 | Assess prevention/detection/suppression coverage | Use actual indexed source types and per-study metadata. Do not infer complete measurements from a study title. |
| P1 | Prepare three source-backed evidence notes | BASS-II calibration, Saffire-I S1/S2 conditions, and one detection/suppression case (SAME/SAME-R or FLEX/FLEX-2). These notes are proposed, not implemented or team-reviewed by this repository setup. |
| P1 | Distinguish observation from interpretation | Each note needs Research question, Reported observation, Fire-safety relevance, Conditions and limitations, Evidence, Review status and relevant source/row actions. |
| P1 | Make summarization, relevance ranking and interpretation visible | Reuse existing pages and metadata; relevance rank must not become a hazard score or scientific confidence percentage. |
| P2 | Rehearse reproducible public demonstrations | Prefer BASS-II calibration for document context and Saffire for source-row comparison. Do not force a row comparison for a documentation question. |
| P2 | Present validation and scope accurately | Cite existing integrity audits and small development evaluations. A proposed task-based user study is not measured impact until performed. |
| P3 | Refine accessibility and presentation where the workflow needs it | Preserve the flamingo brand and current layout, review keyboard/mobile behavior and avoid repeated warnings in every view. |

## Scientific review before publishing interpretation

- BASS-II: retrieve actual calibration notes/configuration context; do not invent a universal voltage-to-flow equation or assume instrument units.
- Saffire-I: retain S1 oxygen `21.5 - 21.7` and S2 `~ 21.5`. Distinguish burn time from flame-spread speed; descriptive differences do not establish a causal airflow effect.
- Detection/suppression: use only available evidence. If the indexed content supports only an objective or coverage description, publish a clearly labeled scope/evidence-gap note instead of numerical effectiveness claims.
- A draft must remain a draft. Use a Team-reviewed label only after the team has actually reviewed it; do not imply external expert validation.
- The existing H5 classification case, 43 aggregate provenance warnings and PSI-68 remote inventory gap remain relevant.

## Claims and collaboration boundaries

Remote 12.3 TB references are not fully processed contents; 364 bibliography entries are not all acquired papers. Source rows are not automatically independently validated experiments. Pretrained embeddings are not a newly trained combustion predictor. Public retrieval and the prior recorded/private GPT evaluation remain separate, with public paid generation disabled.

The supplied rubric names Impact, Creativity, Validity, Relevance, Presentation and Diversity, with levels 1–4 and no supplied weights. It does not establish an achieved score. Published availability is not proof of real-world scientific usefulness; any stronger impact claim needs documented evaluation.

Implement follow-up work on a feature branch after agreeing on shared-file ownership with the visual team. Keep source identities, exact values, English product copy, generation gates and the existing deployment target intact. Do not contact external study participants or change account permissions merely because they appear in a proposed evaluation plan.
