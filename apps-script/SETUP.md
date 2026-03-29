# Apps Script Setup

1. Create a Google Sheet and name the first tab `Leads`.
2. Open [script.google.com](https://script.google.com) and create a new Apps Script project.
3. Paste the contents of `Code.gs`.
4. Replace:
   - `SHEET_ID`
   - `ALERT_EMAIL`
5. Deploy as:
   - `Deploy` -> `New deployment`
   - Type: `Web app`
   - Execute as: `Me`
   - Who has access: `Anyone`
6. Copy the deployment URL into the extension settings page.

If you prefer WhatsApp-only alerts, keep email enabled for now and use the generated `wa.me` link inside the alert email.
