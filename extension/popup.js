const captureButton = document.getElementById("captureButton");
const statusNode = document.getElementById("status");

void renderStatus();

captureButton.addEventListener("click", async () => {
  try {
    setStatus("Scanning current tab...");

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab?.id) {
      setStatus("Active tab not found.");
      return;
    }

    if (!isIndiaMartPage(tab.url)) {
      setStatus("Open an IndiaMART seller page first, then try again.");
      return;
    }

    const pageResponse = await chrome.tabs.sendMessage(tab.id, { type: "capture:run" });

    if (!pageResponse?.ok) {
      setStatus("Could not read leads from this page.");
      return;
    }

    setStatus(`Found ${pageResponse.payload.leads.length} leads. Syncing...`);

    const syncResponse = await chrome.runtime.sendMessage({
      type: "capture:submit",
      payload: pageResponse.payload
    });

    if (!syncResponse?.ok) {
      setStatus(syncResponse?.error || "Sync failed.");
      return;
    }

    const { inserted = 0, skipped = 0, message = "Sync complete." } = syncResponse.result || {};
    setStatus(`${message} Inserted ${inserted}, skipped ${skipped}.`);
    await renderStatus();
  } catch (error) {
    if (String(error?.message || "").includes("Receiving end does not exist")) {
      setStatus("Reload the IndiaMART tab and the extension, then try again.");
      return;
    }

    setStatus(error?.message || "Unexpected error.");
  }
});

function setStatus(message) {
  statusNode.textContent = message;
}

async function renderStatus() {
  try {
    const response = await chrome.runtime.sendMessage({ type: "status:get" });

    if (!response?.ok) {
      return;
    }

    const status = response.status;
    if (status?.pending) {
      setStatus(`Pending retries: ${status.pending}`);
      return;
    }

    if (status?.lastSync?.result) {
      const result = status.lastSync.result;
      setStatus(`${result.message} Pending ${result.pending || 0}.`);
    }
  } catch (_error) {
    setStatus("Extension worker not ready. Reload the extension.");
  }
}

function isIndiaMartPage(url) {
  return typeof url === "string" && url.includes("indiamart.com");
}
