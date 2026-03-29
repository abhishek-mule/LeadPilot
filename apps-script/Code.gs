const SHEET_ID = "PASTE_GOOGLE_SHEET_ID_HERE";
const SHEET_NAME = "Leads";
const ALERT_EMAIL = "PASTE_ALERT_EMAIL_HERE";

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents || "{}");
    const leads = Array.isArray(body.leads) ? body.leads : [];

    if (!leads.length) {
      return jsonResponse({ inserted: 0, skipped: 0, message: "No leads in payload" });
    }

    const sheet = getLeadSheet_();
    const existingLeadIds = new Set(getExistingLeadIds_(sheet));

    let inserted = 0;
    let skipped = 0;

    leads.forEach((lead) => {
      if (!lead.leadId || existingLeadIds.has(lead.leadId)) {
        skipped += 1;
        return;
      }

      sheet.appendRow([
        body.capturedAt || new Date().toISOString(),
        lead.leadId,
        lead.buyerName || "",
        lead.phone || "",
        lead.requirement || "",
        lead.city || "",
        lead.product || "",
        lead.receivedAt || "",
        lead.status || "new",
        body.source || "indiamart",
        lead.rawText || ""
      ]);

      existingLeadIds.add(lead.leadId);
      inserted += 1;
      sendAlertEmail_(lead);
    });

    return jsonResponse({
      inserted,
      skipped,
      message: inserted ? "Leads synced successfully." : "No new leads to insert."
    });
  } catch (error) {
    return jsonResponse({ error: error.message }, 500);
  }
}

function getLeadSheet_() {
  const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
  const sheet = spreadsheet.getSheetByName(SHEET_NAME) || spreadsheet.insertSheet(SHEET_NAME);

  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      "capturedAt",
      "leadId",
      "buyerName",
      "phone",
      "requirement",
      "city",
      "product",
      "receivedAt",
      "status",
      "source",
      "rawText"
    ]);
  }

  return sheet;
}

function getExistingLeadIds_(sheet) {
  if (sheet.getLastRow() < 2) {
    return [];
  }

  return sheet
    .getRange(2, 2, sheet.getLastRow() - 1, 1)
    .getValues()
    .flat()
    .filter(Boolean);
}

function sendAlertEmail_(lead) {
  if (!ALERT_EMAIL || ALERT_EMAIL.includes("PASTE_")) {
    return;
  }

  const subject = `New IndiaMART Lead: ${lead.buyerName || "Unknown Buyer"}`;
  const lines = [
    `Buyer: ${lead.buyerName || "-"}`,
    `Phone: ${lead.phone || "-"}`,
    `Requirement: ${lead.requirement || "-"}`,
    `City: ${lead.city || "-"}`,
    `Product: ${lead.product || "-"}`,
    "",
    `WhatsApp draft: ${buildWhatsAppLink_(lead)}`
  ];

  MailApp.sendEmail(ALERT_EMAIL, subject, lines.join("\n"));
}

function buildWhatsAppLink_(lead) {
  const digits = (lead.phone || "").replace(/[^\d]/g, "");
  const message = encodeURIComponent(
    `Hi ${lead.buyerName || ""}, we received your requirement for ${lead.product || "your product"}.`
  );

  if (!digits) {
    return "Phone number unavailable";
  }

  return `https://wa.me/${digits}?text=${message}`;
}

function jsonResponse(payload, statusCode) {
  const output = ContentService.createTextOutput(JSON.stringify(payload));
  output.setMimeType(ContentService.MimeType.JSON);

  if (statusCode && output.setResponseCode) {
    output.setResponseCode(statusCode);
  }

  return output;
}
