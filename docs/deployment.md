# TFL deployment

Production is deployed from `main` through `deploy-swa-tfl-aserdargun-com.yml`. CI and deployment install the lockfile, run TypeScript checks and 43 simulation/lesson tests, and build the static app. Official GitHub Actions are pinned to verified immutable commits.

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

`npm run build` creates `dist/release.json` containing the full source commit, build time and SHA-256 hashes of every shipped file. The build verifies required entry points, referenced assets and the comparison worker. CI requires a full commit SHA. `node scripts/release.mjs --verify` independently checks the manifest against the artifact and current source identity.

A release is complete only after the production Actions run succeeds, Azure's production environment reports Ready, the live release commit matches GitHub, representative assets have correct hashes and MIME types, and live desktop/mobile interactions and console output are checked. Custom-domain binding and root portfolio registration are separate operations.

For local development before an initial commit, the release identity is `uncommitted`. Build only from a clean committed checkout when validating a production release.
