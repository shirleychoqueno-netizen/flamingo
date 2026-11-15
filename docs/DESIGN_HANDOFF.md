# IGNIS local final candidate — discovery experience 03

This is PC02's independent finished proposal, not a replacement for the visual team's parallel work. Merge the strongest presentation choices later. Original Site identity, audience, source evidence, backend deployment and remote-data scope remain unchanged.

## Experience

The root route is a deliberately short, visual research entrance: real NASA footage, a question box, three research directions and featured experiments. The full catalog moves to #explore, with all 25 investigations and every existing filter, bookmark, evidence entry and export still available. The header offers Explore research, Library and Ask IGNIS. The two PDFs are clearly part of the Library, not a total-database counter on the home header.

The research guide opens from the home question box, direction cards, header, investigation pages or floating button. It makes a real call to the existing hybrid retrieval service, groups retrieved excerpts by known investigation, and offers direct internal investigation/source-evidence links. It supports follow-up query context, an optional current-investigation scope, loading/cancel/error/empty states and a bounded in-memory conversation. Native modal behavior provides keyboard focus containment and Escape closing. These interactions are implemented; native browser interaction QA remains unverified.

This is AI-assisted source discovery, not free-form GPT scientific synthesis. The semantic model powers retrieval; introductory response text and navigation are deterministic. All suggestions have a retrieved original excerpt, a source locator and a known internal destination. The interface discloses semantic/keyword mode and does not present its suggestions as validated scientific conclusions. The existing recorded GPT evaluation remains separately labeled. No OpenAI credential or new public paid generation is needed or enabled.

All 2,009 available nonblank source rows, comparisons, metadata, source hashes and publication references remain accessible inside investigations. The detail pages add section navigation, wider readable layouts and an Ask about this investigation entry. Headings, body copy, form controls, PDF text and scientific tables use a revised type hierarchy. The PDF's local query sidebar starts collapsed to give the document more room; it can still be opened. Reduced-motion preferences are honored by the NASA video and interface motion.

## Merge boundaries

- ResearchHome.jsx: new home composition and topic entry points, using original media bytes.
- ResearchAssistant.jsx: reusable modal guide, conversation and direct navigation.
- research-guide.js: data-backed routing and retrieval behavior, independent of the visual layout.
- experience.css: isolated visual/typography pass, imported last. Review selectors when combining another stylesheet.
- main.jsx: root/home versus #explore routing, guide state, header/rail entries and contextual integration.
- InvestigationExplorer.jsx: retains full 25-study catalog; removes its old hero and adds a guide entry.
- InvestigationDetail.jsx: adds guide entry and section anchors; source-row browsing remains intact.
- StudyView.jsx and VariableCatalog.jsx: reading defaults and residual English-copy cleanup; source values are unchanged.
- vite.config.js: splits immutable PDF/catalog data and vendor code; the guide component is loaded on demand. This improves cache separation; no measured speed/Core Web Vitals claim is made.
- scripts/verify-guide.mjs and scripts/verify-guide-live.mjs: offline and three real development-query checks. They do not establish general retrieval accuracy.

Keep the existing API, public-generation gates, API budget and .openai/hosting.json when combining designs. Do not overwrite newer upstream work blindly. Delivery 02 remains preserved for comparison. The release manifest lists exact source/build hashes; the package excludes dependencies and credentials.

## Review limits

The Computer Use helper stopped because it could not confidently establish the active browser URL on Windows. No further UI input was issued. Code/render/live retrieval/build checks continue independently; desktop/mobile visual review, keyboard/modal interaction, pointer behavior, video layout and live guide navigation in an actual browser still need human review. Browser snapshots or HTTP checks must not be called completed visual QA.

The original Site has not been published from PC02; source-write access remains unavailable. Preview and Drive delivery are local review/handoff, not a public deployment.

## Public release refinement: flamingo

The user's selected name is flamingo: Flame Learning & Analysis in Microgravity: INsights for Gravity-Off missions. Public review URL: https://flamingo.houston-groq-proxy.workers.dev/.

flamingo.css is an additional final override layer: open blended hero footage, no framed video panel, collection-wide library layout. ResearchLibrary.jsx replaces the earlier PDF-led library with direct access to all 25 investigations plus a secondary curated reading room. main.jsx removes the redundant header guide button, keeps the floating Research guide and central question entry, and applies the new brand. ResearchHome.jsx includes the full name and retains the question-led flow. Scientific source data and original media bytes are unchanged.

Public release is confirmed separately on Cloudflare, not by overwriting the original visual team's Site. Its existing Sites identity remains in the source for future merging. The backend allowlist now includes the new exact frontend origin. All public generation flags remain disabled. The old publication-pending notes above describe the original Sites account limitation; they do not mean the independent flamingo Cloudflare URL is unpublished.
