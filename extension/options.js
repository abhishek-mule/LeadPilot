const webhookInput = document.getElementById("webhookUrl");
const autoCaptureInput = document.getElementById("autoCapture");
const saveButton = document.getElementById("saveButton");
const statusNode = document.getElementById("status");

initialize();

saveButton.addEventListener("click", async () => {
  await chrome.storage.sync.set({
    webhookUrl: webhookInput.value.trim(),
    autoCapture: autoCaptureInput.checked
  });

  statusNode.textContent = "Settings saved.";
});

async function initialize() {
  const settings = await chrome.storage.sync.get({
    webhookUrl: "",
    autoCapture: false
  });

  webhookInput.value = settings.webhookUrl;
  autoCaptureInput.checked = settings.autoCapture;
}
