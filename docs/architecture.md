# Architecture

## Product shape

LeadPilot starts as a browser-first workflow:

- Extension handles authenticated DOM access
- Google Sheets acts as the first CRM
- Google Apps Script acts as the webhook receiver and alert engine

This keeps cost near zero while still letting us add a paid hosted dashboard later.

## Extension responsibilities

### `content.js`

- Runs on IndiaMART seller pages
- Locates lead cards or detail panels
- Watches for DOM updates when auto-capture is enabled
- Extracts:
  - buyer name
  - phone number
  - requirement text
  - city
  - product
  - received timestamp if present
- Builds a stable dedupe key from visible values
- Falls back to text-pattern extraction if selectors fail

### `background.js`

- Stores configuration from the options page
- Receives extracted leads from the popup or auto-capture flow
- Sends leads to the configured Apps Script webhook
- Persists sync status for retry visibility
- Queues failed sync payloads in local storage and retries them on an alarm

### `popup.js`

- Lets the seller trigger manual capture
- Shows last sync result
- Shows pending retry count
- Gives a quick jump to options

### `options.js`

- Stores webhook URL and basic capture settings
- Controls whether auto-capture runs on page load

## Data model

```json
{
  "source": "indiamart",
  "capturedAt": "2026-03-29T10:00:00.000Z",
  "leadId": "sha-like-stable-key",
  "buyerName": "Amit Sharma",
  "phone": "+91XXXXXXXXXX",
  "requirement": "Need 500 kg turmeric powder",
  "city": "Jaipur",
  "product": "Turmeric Powder",
  "receivedAt": "2026-03-29 14:20",
  "status": "new",
  "rawText": "optional full card text"
}
```

## Google Sheet columns

Recommended header row:

`capturedAt | leadId | buyerName | phone | requirement | city | product | receivedAt | status | source | rawText`

## Apps Script responsibilities

- Accept POST requests from the extension
- Validate payload shape
- Skip duplicates by `leadId`
- Append new rows to the sheet
- Trigger email notifications
- Optionally generate a WhatsApp Web deep link for operators

## Recommended roadmap

1. Validate selectors against real IndiaMART pages
2. Tune text fallbacks for the actual lead card wording
3. Enable auto-capture after verifying no false positives
4. Add operator actions like open WhatsApp draft and mark status
5. Replace Sheets sink with hosted dashboard once beta usage proves demand

## Selector hardening strategy

- Prefer semantic attributes if IndiaMART exposes them
- Keep a small ordered selector list for each field
- Add regex-based fallback extraction from full card text
- Treat the raw card text as a debugging asset so you can improve parsing without reloading production data
- When selectors break, patch only the selector arrays first before touching queue or transport logic
