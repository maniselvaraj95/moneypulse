# MoneyPulse connection-proof PWA

This first deployment verifies GitHub Pages, PWA installation, Google Sign in, the restricted MoneyPulse Apps Script API, and the private Google Sheets connection.

## Before publishing
1. Open `config.js`.
2. Replace `PASTE_YOUR_WEB_CLIENT_ID_HERE` with the Google Web Client ID.
3. Replace `PASTE_YOUR_APPS_SCRIPT_EXEC_URL_HERE` with the Apps Script Web App URL ending `/exec`.
4. Never add a client secret, identity token, Google Sheet ID, Gmail allowlist, CSV file, or financial data to this repository.

## GitHub Pages
Publish from the `main` branch and repository root. The expected site path is `/moneypulse/`.

## Security
Only the health check is public. Authenticated operations are verified again by Apps Script against the configured Client ID and allowed email.
