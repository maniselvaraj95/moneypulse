# MoneyPulse Integrated v9

## Deploy Apps Script
1. Back up the Google Sheet and existing Apps Script.
2. Replace `Code.gs` with `apps-script/Code.gs`.
3. Preserve Script Properties `ALLOWED_EMAIL` and `GOOGLE_CLIENT_ID`.
4. Run `testMoneyPulseFinal`, then deploy a new version of the existing Web App.

## Deploy PWA
1. Restore the real public Web Client ID and Apps Script `/exec` URL in `config.js`.
2. Upload all root files and folders to GitHub Pages.
3. Remove old `ui-v8-patch.*` files from `index.html`; this build is consolidated.
4. Clear site data/service worker once, then reload.

## Safety
Test with temporary records first. Delete is permanent. Cancelling a CSV import stops unprocessed batches; already committed rows remain and are reported.
