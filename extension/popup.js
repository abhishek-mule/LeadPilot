const captureButton = document.getElementById("captureButton");
const statusNode = document.getElementById("status");

void renderStatus();

captureButton.addEventListener("click", async () => {
  try {
    captureButton.disabled = true;
    captureButton.textContent = "Capturing...";
    setStatus("Scanning current tab...", "loading");

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab?.id) {
      setStatus("Active tab not found.", "error");
      resetButton();
      return;
    }

    if (!isIndiaMartPage(tab.url)) {
      setStatus("Open an IndiaMART seller page first.", "error");
      resetButton();
      return;
    }

    const pageResponse = await chrome.tabs.sendMessage(tab.id, { type: "capture:run" });

    if (!pageResponse?.ok) {
      setStatus("Could not read leads from this page.", "error");
      resetButton();
      return;
    }

    setStatus(`Found ${pageResponse.payload.leads.length} leads. Syncing...`, "loading");

    const syncResponse = await chrome.runtime.sendMessage({
      type: "capture:submit",
      payload: pageResponse.payload
    });

    if (!syncResponse?.ok) {
      setStatus(syncResponse?.error || "Sync failed.", "error");
      resetButton();
      return;
    }

    const { inserted = 0, skipped = 0, message = "Sync complete." } = syncResponse.result || {};
    setStatus(`✓ ${message} Inserted: ${inserted}, Skipped: ${skipped}.`, "success");
    await renderStatus();
  } catch (error) {
    if (String(error?.message || "").includes("Receiving end does not exist")) {
      setStatus("Reload the IndiaMART tab and extension.", "error");
    } else {
      setStatus(error?.message || "Unexpected error.", "error");
    }
  } finally {
    resetButton();
  }
});

function resetButton() {
  captureButton.disabled = false;
  captureButton.textContent = "Capture Leads";
}

function setStatus(message, type = "info") {
  statusNode.textContent = message;
  statusNode.className = `status ${type}`;
}

async function renderStatus() {
  try {
    const response = await chrome.runtime.sendMessage({ type: "status:get" });

    if (!response?.ok) {
      return;
    }

    const status = response.status;
    if (status?.pending) {
      setStatus(`Pending retries: ${status.pending}`, "info");
      return;
    }

    if (status?.lastSync?.result) {
      const result = status.lastSync.result;
      setStatus(`Last sync: ${result.message} | Pending: ${result.pending || 0}`, "info");
    }
  } catch (_error) {
    setStatus("Extension worker not ready. Reload the extension.", "error");
  }
}

function isIndiaMartPage(url) {
  return typeof url === "string" && url.includes("indiamart.com");
}
