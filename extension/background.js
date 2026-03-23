const API_BASE_URL = "http://127.0.0.1:8000/api/v1";
const JOBS_ENDPOINT = `${API_BASE_URL}/jobs/import`;
const EXTENSION_BOOTSTRAP_ENDPOINT = `${API_BASE_URL}/extension/bootstrap`;
const STATE_KEY = "bagTheGooseState";
const PROFILE_KEY = "bagTheGooseProfile";
const AUTH_KEY = "bagTheGooseAuth";
const MAX_LOGS = 20;
const ALLOWED_WEB_APP_ORIGINS = new Set([
  "https://bagthegoose.com",
  "https://www.bagthegoose.com",
  "http://localhost:3000",
  "http://127.0.0.1:3000"
]);

const DEFAULT_PROFILE = {
  desiredRoleKeywords: [
    "software engineer",
    "software developer",
    "backend engineer",
    "frontend engineer",
    "full stack",
    "web developer",
    "intern",
    "new grad",
    "co-op"
  ],
  blockedTitleKeywords: [
    "designer",
    "account executive",
    "sales",
    "nurse"
  ],
  blockedSeniorityKeywords: [
    "senior",
    "staff",
    "principal",
    "lead",
    "manager",
    "director",
    "architect"
  ],
  allowedLocations: [
    "canada",
    "ontario",
    "toronto",
    "waterloo",
    "remote",
    "united states",
    "new york",
    "san francisco"
  ],
  blockedLocations: [],
  blockedCompanies: [],
  blockedDegreeKeywords: [
    "phd required",
    "doctoral degree",
    "masters required",
    "master's degree required"
  ],
  blockedVisaKeywords: [
    "must be authorized to work in the united states without sponsorship",
    "security clearance required",
    "u.s. citizenship required",
    "canadian citizenship required"
  ],
  blockedSkillRequirements: [
    "sap abap"
  ],
  minimumYearsAllowed: 2
};

function createInitialState() {
  return {
    status: "idle",
    running: false,
    scanned: 0,
    shortlisted: 0,
    deepExtracted: 0,
    uploaded: 0,
    skipped: 0,
    errors: 0,
    lastError: null,
    lastUpdatedAt: null,
    lastRunStartedAt: null,
    currentPage: null,
    logs: [],
    seenJobKeys: []
  };
}

async function getState() {
  const stored = await chrome.storage.local.get(STATE_KEY);
  return {
    ...createInitialState(),
    ...(stored[STATE_KEY] || {})
  };
}

async function setState(nextState) {
  const mergedState = {
    ...createInitialState(),
    ...nextState,
    lastUpdatedAt: new Date().toISOString()
  };
  await chrome.storage.local.set({ [STATE_KEY]: mergedState });
  return mergedState;
}

async function updateState(updater) {
  const current = await getState();
  const next = updater(current);
  return setState(next);
}

async function getProfile() {
  const stored = await chrome.storage.local.get(PROFILE_KEY);
  return {
    ...DEFAULT_PROFILE,
    ...(stored[PROFILE_KEY] || {})
  };
}

async function getAuth() {
  const stored = await chrome.storage.local.get(AUTH_KEY);
  return stored[AUTH_KEY] || null;
}

async function setAuth(authState) {
  await chrome.storage.local.set({ [AUTH_KEY]: authState });
  return authState;
}

function isOriginAllowed(senderUrl) {
  if (!senderUrl) {
    return false;
  }

  try {
    const origin = new URL(senderUrl).origin;
    return ALLOWED_WEB_APP_ORIGINS.has(origin);
  } catch {
    return false;
  }
}

function addLog(state, message, level = "info") {
  const entry = {
    id: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    level,
    message,
    createdAt: new Date().toISOString()
  };
  const logs = [entry, ...(state.logs || [])].slice(0, MAX_LOGS);
  return { ...state, logs };
}

async function recordError(message) {
  return updateState((state) => {
    const next = {
      ...state,
      status: "error",
      running: false,
      errors: state.errors + 1,
      lastError: message
    };
    return addLog(next, message, "error");
  });
}

async function postJob(jobPayload) {
  const auth = await getAuth();
  if (!auth?.accessToken) {
    throw new Error("Extension is not authenticated. Visit BagTheGoose while logged in.");
  }

  const response = await fetch(JOBS_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${auth.accessToken}`
    },
    body: JSON.stringify(jobPayload)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Upload failed with ${response.status}: ${errorText}`);
  }

  return response.json();
}

async function exchangeBootstrapGrant(bootstrapToken, senderUrl) {
  const response = await fetch(EXTENSION_BOOTSTRAP_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      bootstrapToken,
      extensionId: chrome.runtime.id,
      extensionVersion: chrome.runtime.getManifest().version,
      sourceOrigin: senderUrl ? new URL(senderUrl).origin : null
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Auth bootstrap failed with ${response.status}: ${errorText}`);
  }

  const authPayload = await response.json();
  await setAuth({
    accessToken: authPayload.accessToken,
    expiresAt: authPayload.expiresAt,
    user: authPayload.user,
    authenticatedAt: new Date().toISOString()
  });

  await updateState((state) =>
    addLog(state, `Authenticated extension for ${authPayload.user.email || authPayload.user.id}.`)
  );

  return authPayload;
}

async function sendMessageToActiveTab(message) {
  const [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true
  });

  if (!tab?.id) {
    throw new Error("No active tab available.");
  }

  try {
    return await chrome.tabs.sendMessage(tab.id, message);
  } catch (error) {
    const messageText = error instanceof Error ? error.message : String(error || "");
    const isMissingReceiver =
      messageText.includes("Receiving end does not exist") ||
      messageText.includes("Could not establish connection");

    if (!isMissingReceiver) {
      throw error;
    }

    if (!tab.url || !tab.url.startsWith("https://www.linkedin.com/jobs/")) {
      throw new Error("Open a LinkedIn jobs page before starting extraction.");
    }

    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["content.js"]
    });

    await updateState((state) =>
      addLog(state, "Injected content script into the active LinkedIn tab.")
    );

    return chrome.tabs.sendMessage(tab.id, message);
  }
}

chrome.runtime.onInstalled.addListener(async () => {
  const existingState = await getState();
  await setState(existingState);
  const profile = await getProfile();
  await chrome.storage.local.set({ [PROFILE_KEY]: profile });
});

chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
  void (async () => {
    try {
      if (!isOriginAllowed(sender.url)) {
        sendResponse({ ok: false, error: "Unauthorized sender origin." });
        return;
      }

      switch (message?.type) {
        case "BAG_THE_GOOSE_PING": {
          sendResponse({
            ok: true,
            extensionId: chrome.runtime.id,
            version: chrome.runtime.getManifest().version
          });
          return;
        }
        case "BAG_THE_GOOSE_BOOTSTRAP_AUTH": {
          if (!message.bootstrapToken) {
            sendResponse({ ok: false, error: "Missing bootstrap token." });
            return;
          }

          const authPayload = await exchangeBootstrapGrant(message.bootstrapToken, sender.url);
          sendResponse({ ok: true, auth: authPayload });
          return;
        }
        default: {
          sendResponse({ ok: false, error: "Unknown external message type." });
        }
      }
    } catch (error) {
      const messageText = error instanceof Error ? error.message : "Unknown auth error.";
      await recordError(messageText);
      sendResponse({ ok: false, error: messageText });
    }
  })();

  return true;
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  void (async () => {
    try {
      switch (message?.type) {
        case "BAG_THE_GOOSE_GET_STATE": {
          const [state, profile, auth] = await Promise.all([getState(), getProfile(), getAuth()]);
          sendResponse({ ok: true, state, profile, auth });
          return;
        }
        case "BAG_THE_GOOSE_RESET_STATE": {
          const next = await setState(createInitialState());
          sendResponse({ ok: true, state: next });
          return;
        }
        case "BAG_THE_GOOSE_START_SCAN": {
          const next = await updateState((state) => {
            const reset = createInitialState();
            reset.status = "extracting";
            reset.running = true;
            reset.currentPage = message.url || null;
            reset.lastRunStartedAt = new Date().toISOString();
            return addLog(reset, "Started LinkedIn scan.");
          });
          await sendMessageToActiveTab({ type: "BAG_THE_GOOSE_RUN_SCAN" });
          sendResponse({ ok: true, state: next });
          return;
        }
        case "BAG_THE_GOOSE_SCAN_COMPLETE": {
          const next = await updateState((state) => {
            const doneState = {
              ...state,
              status: state.errors > 0 ? "completed_with_errors" : "completed",
              running: false
            };
            return addLog(doneState, "Scan completed.");
          });
          sendResponse({ ok: true, state: next });
          return;
        }
        case "BAG_THE_GOOSE_STATE_PATCH": {
          const next = await updateState((state) => {
            let merged = { ...state, ...(message.patch || {}) };
            const increments = message.increments || {};
            for (const [key, value] of Object.entries(increments)) {
              const currentValue = Number(merged[key] || 0);
              merged[key] = currentValue + Number(value || 0);
            }
            if (message.log) {
              merged = addLog(merged, message.log.message, message.log.level);
            }
            return merged;
          });
          sendResponse({ ok: true, state: next });
          return;
        }
        case "BAG_THE_GOOSE_UPLOAD_JOB": {
          const jobPayload = {
            ...message.job,
            prefilter: message.prefilter
          };
          const result = await postJob(jobPayload);
          const dedupeKey = message.prefilter?.dedupeKey;
          const next = await updateState((state) => {
            const seenJobKeys = new Set(state.seenJobKeys || []);
            if (dedupeKey) {
              seenJobKeys.add(dedupeKey);
            }
            const uploadedState = {
              ...state,
              uploaded: state.uploaded + 1,
              seenJobKeys: Array.from(seenJobKeys)
            };
            return addLog(
              uploadedState,
              `Uploaded ${message.job.title} at ${message.job.company}.`
            );
          });
          sendResponse({ ok: true, result, state: next });
          return;
        }
        default: {
          sendResponse({ ok: false, error: "Unknown message type." });
        }
      }
    } catch (error) {
      const messageText = error instanceof Error ? error.message : "Unknown extension error.";
      const next = await recordError(messageText);
      sendResponse({ ok: false, error: messageText, state: next });
    }
  })();

  return true;
});
