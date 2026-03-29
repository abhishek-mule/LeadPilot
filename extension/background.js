const DEFAULT_SETTINGS = {
  webhookUrl: "",
  autoCapture: false
};
const DEFAULT_LOCAL_STATE = {
  queue: [],
  lastSync: null
};
const RETRY_ALARM = "leadpilot-retry";
const RETRY_DELAY_MINUTES = 1;

chrome.runtime.onInstalled.addListener(async () => {
  const current = await chrome.storage.sync.get(DEFAULT_SETTINGS);
  await chrome.storage.sync.set({ ...DEFAULT_SETTINGS, ...current });
  const localState = await chrome.storage.local.get(DEFAULT_LOCAL_STATE);
  await chrome.storage.local.set({ ...DEFAULT_LOCAL_STATE, ...localState });
  chrome.alarms.create(RETRY_ALARM, { periodInMinutes: RETRY_DELAY_MINUTES });
});

chrome.runtime.onStartup.addListener(async () => {
  chrome.alarms.create(RETRY_ALARM, { periodInMinutes: RETRY_DELAY_MINUTES });
  await flushQueue();
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === RETRY_ALARM) {
    await flushQueue();
  }
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "capture:submit") {
    enqueuePayload(message.payload)
      .then(() => flushQueue())
      .then((result) => sendResponse({ ok: true, result }))
      .catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }

  if (message?.type === "settings:get") {
    chrome.storage.sync
      .get(DEFAULT_SETTINGS)
      .then((settings) => sendResponse({ ok: true, settings }))
      .catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }

  if (message?.type === "status:get") {
    getStatus()
      .then((status) => sendResponse({ ok: true, status }))
      .catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }

  return false;
});

async function enqueuePayload(payload) {
  if (!payload?.leads?.length) {
    return;
  }

  const { queue = [] } = await chrome.storage.local.get(DEFAULT_LOCAL_STATE);
  const item = {
    id: crypto.randomUUID(),
    payload,
    createdAt: new Date().toISOString(),
    attempts: 0,
    lastError: ""
  };

  queue.push(item);
  await chrome.storage.local.set({ queue });
}

async function flushQueue() {
  const settings = await chrome.storage.sync.get(DEFAULT_SETTINGS);
  const { queue = [] } = await chrome.storage.local.get(DEFAULT_LOCAL_STATE);

  if (!settings.webhookUrl) {
    throw new Error("Webhook URL is not configured");
  }

  if (!queue.length) {
    const status = {
      syncedAt: new Date().toISOString(),
      result: { inserted: 0, skipped: 0, message: "Queue is empty." }
    };
    await chrome.storage.local.set({ lastSync: status });
    return status.result;
  }

  let inserted = 0;
  let skipped = 0;
  const remainingQueue = [];
  let lastMessage = "No queued leads were sent.";

  for (const item of queue) {
    if (!item?.payload?.leads?.length) {
      continue;
    }

    try {
      const response = await fetch(settings.webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(item.payload)
      });

      if (!response.ok) {
        throw new Error(`Webhook failed with status ${response.status}`);
      }

      const json = await response.json();
      inserted += json.inserted || 0;
      skipped += json.skipped || 0;
      lastMessage = json.message || "Queued leads synced successfully.";
    } catch (error) {
      remainingQueue.push({
        ...item,
        attempts: (item.attempts || 0) + 1,
        lastError: error.message
      });
    }
  }

  const status = {
    lastSync: {
      syncedAt: new Date().toISOString(),
      result: {
        inserted,
        skipped,
        pending: remainingQueue.length,
        message: lastMessage
      }
    }
  };

  await chrome.storage.local.set({
    queue: remainingQueue,
    ...status
  });

  return status.lastSync.result;
}

async function getStatus() {
  const { queue = [], lastSync = null } = await chrome.storage.local.get(DEFAULT_LOCAL_STATE);
  return {
    pending: queue.length,
    lastSync
  };
}
