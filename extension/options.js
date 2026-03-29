const webhookInput = document.getElementById("webhookUrl");
const autoCaptureInput = document.getElementById("autoCapture");
const saveButton = document.getElementById("saveButton");
const statusNode = document.getElementById("status");

initialize();

saveButton.addEventListener("click", async () => {
  saveButton.disabled = true;
  saveButton.textContent = "Saving...";
  
  await chrome.storage.sync.set({
    webhookUrl: webhookInput.value.trim(),
    autoCapture: autoCaptureInput.checked
  });

  setStatus("Settings saved successfully!", "success");
  
  saveButton.disabled = false;
  saveButton.textContent = "Save Settings";
  
  setTimeout(() => {
    statusNode.textContent = "";
    statusNode.className = "status";
  }, 3000);
});

async function initialize() {
  const settings = await chrome.storage.sync.get({
    webhookUrl: "",
    autoCapture: false
  });

  webhookInput.value = settings.webhookUrl;
  autoCaptureInput.checked = settings.autoCapture;
}

function setStatus(message, type) {
  statusNode.textContent = message;
  statusNode.className = `status ${type}`;
}
