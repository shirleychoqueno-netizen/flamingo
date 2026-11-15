# flamingo — public review release 01

This is PC02's independent public review release, superseding local delivery 03. The root is a visual guided research entrance; #explore contains the full 25-investigation catalog. Preserve the original source media, Site identity and audience. Read DESIGN_HANDOFF.md before merging with the visual team's parallel work.

## Integrated behavior

Explore catalog: 25 investigation cards; catalog metadata search; actual data-coverage, fuel-state and platform filters; saved investigations; catalog CSV. Investigation detail: English metadata, coverage, publication references/DOIs, NASA links, inventory gaps and source hashes. Row browser: all 2,009 nonblank source rows across 22 tables, loaded one investigation at a time; search exact cell strings, filter tables/row labels, expand cells and paginate 20 rows at a time. Shared selection: 2–6 rows across investigation pages and NASA retrieval, deterministic source-cell comparison and CSV export. Selection and bookmarks persist in this browser, not as a team database.

NASA evidence: live hybrid keyword/vector retrieval, source-type/investigation filters, cited excerpts, provenance, JSON export and the clearly labeled recorded real GPT evaluation. Entering from an investigation keeps its accession selected. Full-text PDFs remain a separate collection: 75 indexed pages, 47 extracted records, six illustrated configurations, local full-text search, page citations and PDF evidence comparison. No fabricated one-to-one mapping assigns the generic PDFs to PSI investigations. The library shows both scopes.

All authored UI and new documentation are English. Original PDF/media bytes, page text, source anchors, numerical evidence and publication text are preserved. The supplied source ZIP remains unchanged (SHA-256 a2dde4405b72d0ce75f003cd3266b7bc6598f87695670096efc39f30a1ea2afd). Documents were reference material, not independent authorization.

## Data scope and limits

25 investigations; 6,177 evidence items; 3,152 retrieval fragments; 2,009 nonblank rows from 2,870 original rows including blanks; 22 tables; 364 publication references. These are not certified experiment counts or general accuracy claims. Source-row labels are supplied annotations, not scientific validation. Scientific comparability remains not_established.

The registry contains 52,742 remote references and 12,279,107,413,131 declared bytes (~12.3 TB decimal). Their contents are not all downloaded, proxied, processed or indexed. Publication entries are not all acquired full-text papers. NASA source links provide access to original remote files. PSI-68 file inventory remains incomplete; local source rows are available. Newer catalog metadata is a bundled snapshot and does not automatically update the captured retrieval index.

src/investigation-catalog.json derives from audited prepared metadata and the retrieval corpus. public/data/rows/PSI-*.json contains source-cell snapshots, identities, annotations and provenance. catalog-source-audit.json compares all 2,009 cell maps with their supplied snapshots: zero mismatches. The existing upstream adapter already normalizes some surrounding whitespace; these snapshots do not claim byte-identical original CSV content. Original PDF/media/page-text/lockfile/Site manifest bytes are checked against the input ZIP.

## API contract

Default public backend: https://houston-groq-proxy.houston-groq-proxy.workers.dev
Only VITE_API_BASE_URL may override the public service URL; never put a provider key in Vite variables.

- GET /health: actual retrieval/generation state.
- POST /v1/rag: bounded search; the UI always sends generate=false.
- POST /v1/compare: exact test_uids, 2–6 original rows, no model call.
- GET /demo-evaluation.json: actual recorded private GPT evaluation; no new generation.

Backend version 87b1748c-2059-49ae-bddf-d1c911c16350 allows exact CORS origins for the original IGNIS Site and http://localhost with optional port. 127.0.0.1 and arbitrary preview domains are different origins. Rate limits return wait messages without retries. Requests have deadlines/abort handling. React renders sources as text. Comparison CSV preserves signed values and qualifiers and guards spreadsheet formulas.

Public paid generation remains disabled. No OpenAI key is in source, Drive or the Worker. This integration made zero OpenAI requests. The private evaluation remains seven requests / 7,606 tokens / USD 0.01298325 standard-rate estimate, under the existing USD 1 / nine-attempt authorization. Actual billing/promotion eligibility is unverified. H5 scientific classification/count exclusion is partial. Do not reset the ledger or activate public spending during publication.

## Build and verify

Node 24, pnpm 11.25.0, existing lockfile. No dependencies were added or upgraded.

```text
pnpm install --frozen-lockfile
node scripts/verify-documents.mjs
node scripts/verify-integration.mjs
node scripts/verify-guide.mjs
node scripts/audit-copy.mjs
pnpm build
pnpm preview --host localhost --port 5173
```

Open http://localhost:5173/. Optional node scripts/verify-live.mjs checks public endpoints, makes one hybrid search/one deterministic comparison and fetches all 25 local row snapshots, without requesting GPT generation. Do not rerun migration scripts as build steps. Data generation/cross-source audit ran in PC02's data workspace; generated data and receipts are included.

Verification covers original PDF hashes/anchors, bilingual PDF search, 18 rendered routes, 25 snapshot hashes, 2,009 unique rows, 22 tables, 364 publication entries, catalog/row filters, six-row limits, scoped NASA search, request failures, oxygen qualifiers, signed values and CSV. The backend's 54 offline checks pass. This public release adds one exact CORS origin without changing retrieval, comparison or paid-generation gates. Dated integration-verification.json, catalog-source-audit.json and live-verification.json contain the actual results. Browser visual/mobile/interaction QA remains unverified; SSR/HTTP checks do not establish it. The build splits vendor code and immutable catalog/PDF data into separate chunks; the guide UI is loaded on demand. The old >500 kB chunk warning is resolved without increasing the warning threshold. No measured page-speed claim is made.

## Original Site publication

https://ignis-combustion-explorer.cheeky-vole-0211.chatgpt.site/
Preserved project_id: appgprj_6af8b8c7f0ac81919acd82077888cd37.
Keep .openai/hosting.json and the current Site audience. Do not create a replacement Site.

PC02 can read public metadata but cannot mint a source write credential: SitesConnectorError: Sites project not found. A local package or Drive upload is not publication. The original owner/editor must merge against newer upstream work, review desktop/mobile interactions and publish through the original Site's supported workflow. The original live site is unchanged until a deployment is confirmed.

WEB_TEAM_PROMPT.md is for the web owner's ordinary ChatGPT chat. It may require the ZIP upload; Drive synchronization alone does not give ChatGPT local filesystem or publishing access. If tools cannot edit/build/publish, return a usable patch or updated ZIP with exact manual steps and explicit remaining checks. DEMO_GUIDE.md gives the rehearsal sequence. The supplied docs/ describe the older source state; this document is the current integration contract.

## Discovery guide and reading improvements

See DESIGN_HANDOFF.md. ResearchHome.jsx introduces the visual question-led start and three topic directions. ResearchAssistant.jsx and research-guide.js use actual semantic retrieval with source-backed internal navigation, optional investigation scope, follow-up context, cancellation and explicit failure states. They do not use free-form GPT generation. Three live development queries returned the expected Saffire/BASS-II/FLEX-2 investigation links; this is not a general accuracy measurement. experience.css supplies the new visual composition, responsive layouts and larger detail-page typography. Native browser visual/interaction QA stopped because Computer Use could not verify the current Windows browser URL. No further UI input was issued.

## Public flamingo release

Public URL: https://flamingo.houston-groq-proxy.workers.dev/
Full name: Flame Learning & Analysis in Microgravity: INsights for Gravity-Off missions.

Published as an independent static Cloudflare Worker named flamingo. The existing backend remains houston-groq-proxy. The original visual team's Sites publication and its audience were not changed. Keep .openai/hosting.json for future source merging; it is not the Cloudflare deployment configuration. Deployment uses groq_proxy/wrangler.flamingo.toml from the existing Wrangler workspace, account 6d9ba464ab11fd0a73143887b2a23453. No new plan, domain purchase, provider secret or paid-generation activation was involved.

The hero video is blended into the page background without the earlier framed panel. The redundant header assistant button is removed. The central question box and persistent Research guide remain. All visible branding is flamingo. The library now opens on 25 investigations and NASA source access, with the included full-text documents under a secondary Curated reading room. Publication references, indexed excerpts and remote links remain distinguished from acquired full texts; removing the misleading headline does not expand the actual text index.

Frontend version: b16cc783-659c-4b68-9031-b52a96a962fe.
Backend version: 515f443a-e894-41a7-a1e0-16cd24127149.
The backend change adds only https://flamingo.houston-groq-proxy.workers.dev to the exact origin allowlist. The 54 offline backend tests pass; existing limits/gates/bindings remain. Frontend 18-route/guide/document/copy checks and production build pass. Cloudflare local static runtime checks and public-deployment-verification.json verify exact built asset hashes, all 25 row snapshots, original PDFs/video, CORS, one successful hybrid guide query and the S1/S2 source comparison. No new OpenAI requests occurred. An initial public verification had a transport reset; the following complete run passed. Native browser visual/mobile/interaction review is not claimed by those HTTP/render checks.

The public site can be shared without this PC or local server being running. The delivery includes SHARE_LINK.txt and QR files encoding this exact URL. QR payload is checked; a physical scan was not performed.
