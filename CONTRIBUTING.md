# Working together

All product copy, code comments and new project documentation are English. Preserve original NASA source text and evidence values.

Each person clones the GitHub repository into their own local folder. Keep active Git clones outside shared Drive/OneDrive synchronization where possible; use Drive for handoffs, not concurrent edits to the same .git directory.

## Two-person workflow

```text
git switch main
git pull --ff-only
git switch -c visual/describe-your-change
```

Use `visual/...` for presentation work and `data/...` or `backend/...` for evidence/API changes. Agree on who owns shared files such as src/main.jsx and global CSS before changing them. Announce the files you are editing in the team's existing coordination channel.

Work in small coherent commits. Run `pnpm test`, `pnpm run worker:test`, `pnpm build` and `pnpm run check:repository` before opening a pull request. Push the feature branch and request the other person's review. Merge into main only when the combined result is ready for the public site: once Workers Builds is connected, pushes/merges to main deploy production.

For a long-running branch, integrate current main before review. Resolve conflicts while checking both the visual intent and source-data behavior. Do not use force pushes on main. Keep provider generation gates and the exact origin policy intact.

## Data and deployment boundaries

- src/ and presentation styles can evolve independently of worker/.
- public/data/rows and the canonical retrieval corpus are versioned evidence snapshots. Updating them requires source/hashes/identity review, not just a visual edit.
- Root wrangler.toml deploys the existing static Worker flamingo.
- worker/wrangler.toml deploys the existing research API houston-groq-proxy. Deploy backend changes separately and deliberately.
- Preview URLs have different origins. The API intentionally accepts only configured origins. Default previews must not silently broaden CORS or share new production bindings.
- Do not commit credentials, operational evaluation ledgers, local runtime state or paid-evaluation runners. Existing private-model spending authorization is not renewed by cloning the code.

Recommended repository settings: require a pull request for main, at least one peer approval and resolved conversations. Apply branch protection/rulesets if the repository owner's plan supports them. These settings are recommendations until actually configured on GitHub.
