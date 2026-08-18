const btnStart = document.getElementById('btn-start');
const btnStop = document.getElementById('btn-stop');
const btnClear = document.getElementById('btn-clear');
const inputTitle = document.getElementById('input-title');
const inputLocation = document.getElementById('input-location');
const inputLimit = document.getElementById('input-limit');
const countSaved = document.getElementById('count-saved');
const countDupes = document.getElementById('count-dupes');
const countErrors = document.getElementById('count-errors');
const logEl = document.getElementById('log');

// ─── Listen for messages from background.js ──────────────────────────────────
chrome.runtime.onMessage.addListener((msg) => {
    if (msg.action === "log") {
        appendLog(msg.text);
    } else if (msg.action === "progress") {
        countSaved.textContent = msg.saved;
        countDupes.textContent = msg.duplicates;
        countErrors.textContent = msg.errors;
    } else if (msg.action === "finished") {
        setRunningUI(false);
        appendLog("🏁 " + msg.message);
    }
});

// ─── Start Button ────────────────────────────────────────────────────────────
btnStart.addEventListener('click', async () => {
    const title = inputTitle.value.trim();
    const location = inputLocation.value.trim();
    const limit = parseInt(inputLimit.value, 10) || 20;

    if (!title || !location) {
        appendLog("⚠️ Please enter both Job Title and Location.");
        return;
    }

    setRunningUI(true);
    appendLog(`🚀 Starting: "${title}" in "${location}" (limit: ${limit})`);

    // Build Google search URL
    const query = `site:linkedin.com/in/ "${title}" "${location}"`;
    const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;

    appendLog(`🔎 Searching Google: ${query}`);

    // Get the current active tab and navigate it to Google
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab) {
        appendLog("❌ No active tab found.");
        setRunningUI(false);
        return;
    }

    // Tell background.js to start automation
    chrome.runtime.sendMessage({
        action: "start_auto",
        tabId: tab.id,
        googleUrl: googleUrl,
        limit: limit
    });
});

// ─── Stop Button ─────────────────────────────────────────────────────────────
btnStop.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: "stop_auto" });
    setRunningUI(false);
    appendLog("⛔ Stopping...");
});

// ─── Clear Button ────────────────────────────────────────────────────────────
btnClear.addEventListener('click', () => {
    logEl.textContent = "";
    countSaved.textContent = "0";
    countDupes.textContent = "0";
    countErrors.textContent = "0";
});

// ─── Restore state on panel open ─────────────────────────────────────────────
chrome.runtime.sendMessage({ action: "get_state" }, (state) => {
    if (state && state.automating) {
        setRunningUI(true);
        countSaved.textContent = state.saved || 0;
        countDupes.textContent = state.duplicates || 0;
        countErrors.textContent = state.errors || 0;
    }
});

// ─── Helpers ─────────────────────────────────────────────────────────────────
function setRunningUI(running) {
    if (running) {
        btnStart.classList.add('hidden');
        btnStop.classList.remove('hidden');
        inputTitle.disabled = true;
        inputLocation.disabled = true;
        inputLimit.disabled = true;
    } else {
        btnStart.classList.remove('hidden');
        btnStop.classList.add('hidden');
        inputTitle.disabled = false;
        inputLocation.disabled = false;
        inputLimit.disabled = false;
    }
}

function appendLog(text) {
    const time = new Date().toLocaleTimeString();
    logEl.textContent += `[${time}] ${text}\n`;
    logEl.scrollTop = logEl.scrollHeight;
}
