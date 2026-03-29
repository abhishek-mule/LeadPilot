# LeadPilot for IndiaMART

<img src="extension/assets/clickpilot_logo.png" alt="LeadPilot Logo" width="200"/>

Starter scaffold for a zero-infrastructure MVP:

- `extension/` contains a Manifest V3 Chrome extension that detects IndiaMART seller pages and extracts lead data from the DOM.
- `apps-script/` contains a Google Apps Script webhook receiver and alert helper for Google Sheets.
- `docs/` contains the architecture and rollout notes.

## MVP flow

1. Seller opens IndiaMART seller panel while logged in.
2. Content script reads visible lead cards from the page DOM.
3. Leads are normalized and deduplicated in the extension.
4. Service worker forwards leads to a destination:
   - Google Apps Script web app endpoint, or
   - local testing sink.
5. Apps Script writes rows to Google Sheets and triggers alerts.

## Local development

1. Open Chrome and go to `chrome://extensions`.
2. Enable Developer mode.
3. Click `Load unpacked`.
4. Select `C:\Users\HP\Downloads\IndiLeads\extension`.
5. Open the IndiaMART seller portal and use the popup to run a capture test.
6. Turn on auto-capture in the settings page after you confirm selectors.

## What is included

- Manifest V3 extension starter
- Content script lead parser
- Background worker transport
- Popup UI for manual capture
- Options page for webhook configuration
- Auto-capture with mutation observation
- Retry queue for failed webhook syncs
- Google Apps Script sample for writing to Sheets and sending alerts

## What you still need

- Confirm real IndiaMART DOM selectors from the live seller panel
- Deploy the Apps Script as a web app
- Create the target Google Sheet and paste its ID into Apps Script
- Decide whether WhatsApp alerts should open WhatsApp Web drafts or send email-only notifications

## Recommended next validation

1. Open a real IndiaMART seller lead list.
2. Inspect one lead card and compare its classes and text blocks with the selector arrays in `extension/content.js`.
3. Run manual capture from the popup.
4. If values are missing, update only the relevant selector list or fallback parser.
5. Once manual capture is reliable, enable auto-capture in settings.
