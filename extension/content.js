const SELECTORS = {
  card: [
    "[data-lead-card]",
    ".lead-card",
    ".bl_leadCard",
    ".buyerleadcard",
    "[class*='lead'][class*='card']",
    "[class*='buyer'][class*='card']"
  ],
  buyerName: [
    "[data-buyer-name]",
    ".buyer-name",
    ".cust-name",
    "[class*='buyer'][class*='name']",
    "[class*='cust'][class*='name']"
  ],
  phone: [
    "[data-phone]",
    ".buyer-mobile",
    ".mobile-number",
    "[class*='phone']",
    "[class*='mobile']"
  ],
  requirement: [
    "[data-requirement]",
    ".requirement",
    ".buy-requirement",
    "[class*='requirement']",
    "[class*='enquiry']"
  ],
  city: [
    "[data-city]",
    ".buyer-city",
    ".city",
    "[class*='city']",
    "[class*='location']"
  ],
  product: [
    "[data-product]",
    ".product-name",
    ".category-name",
    "[class*='product']",
    "[class*='category']"
  ],
  receivedAt: [
    "[data-received-at]",
    ".lead-time",
    ".received-time",
    "[class*='time']",
    "[class*='date']"
  ]
};
const seenLeadIds = new Set();
let autoCaptureStarted = false;
let observer = null;
let debounceTimer = null;

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "capture:run") {
    const leads = extractLeads({ onlyNew: false });
    sendResponse({
      ok: true,
      payload: {
        source: "indiamart",
        capturedAt: new Date().toISOString(),
        leads
      }
    });
  }
});

initializeAutoCapture();

async function initializeAutoCapture() {
  if (autoCaptureStarted) {
    return;
  }

  autoCaptureStarted = true;
  const response = await chrome.runtime.sendMessage({ type: "settings:get" });
  const settings = response?.settings;

  if (!settings?.autoCapture) {
    return;
  }

  queueAutoCapture();
  observer = new MutationObserver(() => queueAutoCapture());
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

function queueAutoCapture() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    void runAutoCapture();
  }, 1200);
}

async function runAutoCapture() {
  const leads = extractLeads({ onlyNew: true });

  if (!leads.length) {
    return;
  }

  await chrome.runtime.sendMessage({
    type: "capture:submit",
    payload: {
      source: "indiamart",
      capturedAt: new Date().toISOString(),
      leads
    }
  });
}

function extractLeads({ onlyNew }) {
  const cardNodes = findCardNodes();

  return cardNodes
    .map((cardNode) => buildLeadFromCard(cardNode))
    .filter((lead) => lead.buyerName || lead.phone || lead.requirement)
    .filter((lead) => {
      if (!lead.leadId) {
        return false;
      }

      if (!onlyNew) {
        return true;
      }

      if (seenLeadIds.has(lead.leadId)) {
        return false;
      }

      seenLeadIds.add(lead.leadId);
      return true;
    });
}

function findCardNodes() {
  for (const selector of SELECTORS.card) {
    const nodes = [...document.querySelectorAll(selector)];
    if (nodes.length) {
      return nodes;
    }
  }

  return [];
}

function buildLeadFromCard(cardNode) {
  const buyerName = readField(cardNode, SELECTORS.buyerName, inferBuyerName);
  const phone = normalizePhone(readField(cardNode, SELECTORS.phone, inferPhone));
  const requirement = readField(cardNode, SELECTORS.requirement, inferRequirement);
  const city = readField(cardNode, SELECTORS.city, inferCity);
  const product = readField(cardNode, SELECTORS.product, inferProduct);
  const receivedAt = readField(cardNode, SELECTORS.receivedAt, inferReceivedAt);
  const rawText = cardNode.innerText.replace(/\s+/g, " ").trim();

  return {
    leadId: buildLeadId({ buyerName, phone, requirement, city, product, receivedAt }),
    buyerName,
    phone,
    requirement,
    city,
    product,
    receivedAt,
    status: "new",
    rawText
  };
}

function readField(root, selectors, fallbackReader) {
  for (const selector of selectors) {
    const match = root.querySelector(selector);
    const value = match?.textContent?.trim();
    if (value) {
      return value;
    }
  }

  if (typeof fallbackReader === "function") {
    return fallbackReader(root);
  }

  return "";
}

function normalizePhone(input) {
  return input.replace(/[^\d+]/g, "");
}

function buildLeadId(lead) {
  const stableValue = [
    lead.buyerName,
    lead.phone,
    lead.requirement,
    lead.city,
    lead.product,
    lead.receivedAt
  ]
    .join("|")
    .toLowerCase()
    .trim();

  let hash = 0;
  for (let index = 0; index < stableValue.length; index += 1) {
    hash = (hash << 5) - hash + stableValue.charCodeAt(index);
    hash |= 0;
  }

  return `im_${Math.abs(hash)}`;
}

function inferBuyerName(root) {
  const text = root.innerText || "";
  const match = text.match(/(?:buyer|name)\s*[:\-]\s*([^\n|,]+)/i);
  return match?.[1]?.trim() || "";
}

function inferPhone(root) {
  const text = root.innerText || "";
  const match = text.match(/(?:\+91[\s-]?)?\d{10}/);
  return match?.[0]?.trim() || "";
}

function inferRequirement(root) {
  const text = root.innerText || "";
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  return lines.find((line) => /need|require|looking|want|buy/i.test(line)) || "";
}

function inferCity(root) {
  const text = root.innerText || "";
  const match = text.match(/(?:city|location)\s*[:\-]\s*([^\n|,]+)/i);
  return match?.[1]?.trim() || "";
}

function inferProduct(root) {
  const text = root.innerText || "";
  const match = text.match(/(?:product|category|item)\s*[:\-]\s*([^\n|,]+)/i);
  return match?.[1]?.trim() || "";
}

function inferReceivedAt(root) {
  const text = root.innerText || "";
  const match = text.match(/(?:today|yesterday|\d{1,2}[:/ -]\d{1,2}(?::\d{2})?.*)/i);
  return match?.[0]?.trim() || "";
}
