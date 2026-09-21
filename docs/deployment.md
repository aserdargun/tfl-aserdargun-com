# TFL deployment

Production is deployed from `main` through `deploy-swa-tfl-aserdargun-com.yml`. CI and deployment install the lockfile, run TypeScript checks and the simulation, lesson and integration tests, and build the static app. Official GitHub Actions are pinned to verified immutable commits.

| Setting | Value |
| --- | --- |
| GitHub | `aserdargun/tfl-aserdargun-com` |
| Subscription | `aserdargun subscription 3` |
| Resource group | `rg-tfl-aserdargun-com` |
| Static Web App | `swa-tfl-aserdargun-com` |
| Region / tier | West Europe / Free |
| Artifact | `dist` (prebuilt; no API) |
| GitHub secret | `AZURE_STATIC_WEB_APPS_API_TOKEN_SWA_TFL_ASERDARGUN_COM` |
| Concurrency | `swa-tfl-aserdargun-com-production`, cancellation disabled |

The resource is initially created without Azure-generated source integration. One checked-in workflow owns production uploads. Its token is transferred directly to the GitHub secret and is never written into the repository.

`npm run build` creates `dist/release.json` containing the full source commit, build time and SHA-256 hashes of every shipped file. The build verifies required entry points, referenced assets and the comparison worker. CI requires a full commit SHA and a clean checkout. Local builds record `sourceDirty` so uncommitted edits are not mistaken for the exact committed release. `node scripts/release.mjs --verify` independently checks the manifest against the artifact and current source identity.

A release is complete only after the production Actions run succeeds, Azure's production environment reports Ready, the live release commit matches GitHub, representative assets have correct hashes and MIME types, and live desktop/mobile interactions and console output are checked. Custom-domain binding and root portfolio registration are separate operations.

For local development before an initial commit, the release identity is `uncommitted`. Build only from a clean committed checkout when validating a production release.

## Existing production evidence

On 2026-09-21, the canonical HTTPS host served `/release.json` with clean source commit `9fdb6511b54ca7af53b34cf40f88e7a9eb1bc8c5`. The [successful production workflow](https://github.com/aserdargun/tfl-aserdargun-com/actions/runs/34777680958) completed on 2026-09-13. The live entry page, lab manifest, main JavaScript and comparison worker matched that release’s SHA-256 inventory. The root portfolio record was refreshed from this evidence. This identifies the existing production release; the content edits in the current working tree require a separate release, and Azure control-plane status was not rechecked in this content review.
