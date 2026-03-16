const STATE_KEY = "bagTheGooseState";

const elements = {
  status: document.getElementById("statusLabel"),
  scanned: document.getElementById("scannedValue"),
  shortlisted: document.getElementById("shortlistedValue"),
  deepExtracted: document.getElementById("deepExtractedValue"),
  uploaded: document.getElementById("uploadedValue"),
  skipped: document.getElementById("skippedValue"),
  errors: document.getElementById("errorsValue"),
  page: document.getElementById("pageValue"),
  error: document.getElementById("errorValue"),
  logs: document.getElementById("logList"),
  startButton: document.getElementById("startButton"),
  resetButton: document.getElementById("resetButton")
};

function renderState(state) {
  elements.status.textContent = state.status || "idle";
  elements.scanned.textContent = String(state.scanned || 0);
  elements.shortlisted.textContent = String(state.shortlisted || 0);
  elements.deepExtracted.textContent = String(state.deepExtracted || 0);
  elements.uploaded.textContent = String(state.uploaded || 0);
  elements.skipped.textContent = String(state.skipped || 0);
  elements.errors.textContent = String(state.errors || 0);
  elements.page.textContent = state.currentPage || "No active scan";
  elements.error.textContent = state.lastError || "None";
  elements.startButton.disabled = Boolean(state.running);

  const logs = state.logs || [];
  elements.logs.innerHTML = "";

  if (logs.length === 0) {
    const li = document.createElement("li");
    li.className = "popup__log";
    li.textContent = "No activity yet.";
    elements.logs.appendChild(li);
    return;
  }

  for (const entry of logs) {
    const li = document.createElement("li");
    li.className = `popup__log popup__log--${entry.level || "info"}`;
    li.textContent = entry.message;
    elements.logs.appendChild(li);
  }
}

async function fetchState() {
  const response = await chrome.runtime.sendMessage({ type: "BAG_THE_GOOSE_GET_STATE" });
  if (response?.ok) {
    renderState(response.state);
  }
}

async function getActiveTabUrl() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab?.url || null;
}

elements.startButton.addEventListener("click", async () => {
  const url = await getActiveTabUrl();
  await chrome.runtime.sendMessage({
    type: "BAG_THE_GOOSE_START_SCAN",
    url
  });
  await fetchState();
});

elements.resetButton.addEventListener("click", async () => {
  await chrome.runtime.sendMessage({ type: "BAG_THE_GOOSE_RESET_STATE" });
  await fetchState();
});

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== "local" || !changes[STATE_KEY]) {
    return;
  }

  renderState(changes[STATE_KEY].newValue || {});
});

void fetchState();
