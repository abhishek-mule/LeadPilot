# IndiLeads Apps Script Setup TODO

## [ ] Step 1: Create Google Sheet
- Go to https://sheets.google.com → New blank spreadsheet
- Rename first tab to **"Leads"**
- Copy **Sheet ID** from URL: `https://docs.google.com/spreadsheets/d/SHEET_ID_HERE/edit`

## [ ] Step 2: Create Apps Script Project
- Go to https://script.google.com → New project
- Delete default `function myFunction() {}`

## [ ] Step 3: Paste & Replace Code.gs
```
1. Copy ALL content from apps-script/Code.gs
2. Paste into Code.gs editor
3. Replace:
   - SHEET_ID = "PASTE_GOOGLE_SHEET_ID_HERE" → "your_sheet_id_here"
   - ALERT_EMAIL = "PASTE_ALERT_EMAIL_HERE" → "your-email@gmail.com"
```

## ✅ Step 4: Deploy Web App (IN PROGRESS)
```
Deploy → New deployment
✅ Type: Web app
✅ Execute as: Me  
✅ Who has access: Anyone
→ Copy WEBHOOK_URL (https://script.google.com/macros/s/.../exec)
```

## [ ] Step 5: Configure Extension
```
Chrome → chrome://extensions/ → Load unpacked: IndiLeads folder
Extension icon → Options → Paste WEBHOOK_URL → Save
```

## [ ] Step 6: Test
```
✅ Check Sheet receives leads
✅ Check email alerts with WhatsApp links
```

**Current Status:** Step 4 Authorization - **SAFE TO APPROVE** (your own script)

**Next:** User completes manual steps → Mark checkboxes ✅

