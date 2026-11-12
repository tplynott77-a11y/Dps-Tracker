# Publish and connect your Google Sheet

## 1. Enable GitHub Pages
1. Open this repository's **Settings → Pages** at https://github.com/tplynott77-a11y/Dps-Tracker/settings/pages
2. Under **Build and deployment**, choose **Deploy from a branch**.
3. Set **Branch: main** and **Folder: / (root)**, then click **Save**.
4. The intended public site address is https://tplynott77-a11y.github.io/Dps-Tracker/ (it will not be live until Pages finishes publishing).
5. Reload the Pages settings to confirm the actual GitHub-generated site URL.

## 2. Configure private Google Sheets sign-in
1. Open https://console.cloud.google.com/ and select/create a Google Cloud project under your own account.
2. Under **APIs & Services → Library**, enable the **Google Sheets API** for that project.
3. Configure **Google Auth Platform / OAuth consent screen**. For a personal Google account, use an External audience. If the app remains in Testing, add your own Google email as a **test user**.
4. Create **OAuth Client ID → Web application**.
5. Under **Authorized JavaScript origins**, add **https://tplynott77-a11y.github.io**. Note: an origin has *no* path, so do not include `/Dps-Tracker/` in this setting. You may include `http://localhost` separately for local development if needed.
6. Copy the **Client ID** (ends with `.apps.googleusercontent.com`). **Do not publish a client secret or access token.** This browser app needs no secret or Google API key.
7. Open the published website and choose **Drive Sync**. The existing source Sheet ID is prefilled. Paste the OAuth Web Client ID, click **Connect & Refresh**, approve the **read-only** Google Sheets permission, and review the import.
8. Return to Drive Sync to fetch new or changed rows later. This is manually triggered synchronisation, **not automatic live updates**.

## Important
- This public static site has **no private server database**. It reads the source spreadsheet from the viewer's browser only after that viewer explicitly signs in and has read access.
- The website uses `spreadsheets.readonly` and does **not** edit your original Sheet.
- Imported rows can be cached in the browser's local storage for offline viewing. Avoid using public/shared computers for the private archive.
- Local edits made in the website are **not written back to Google Sheets**. Export a backup if making local edits.
- If a Google sign-in popup reports `origin_mismatch`, check the exact Pages URL's origin in the OAuth client's Authorized JavaScript origins.
- If Google reports **access blocked** or **permission denied**, ensure your account is a test user if required, Sheets API is enabled, and the account can read the private sheet.
