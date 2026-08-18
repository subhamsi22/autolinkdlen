const API_BASE = "http://localhost/linkedin-ceo/backend";

// Open side panel when toolbar icon is clicked
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

// ─── Messages from panel.js ──────────────────────────────────────────────────
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.action === "start_auto") {
        startAutomation(msg.tabId, msg.googleUrl, msg.limit);
    } else if (msg.action === "stop_auto") {
        stopAutomation("Stopped by user.");
    } else if (msg.action === "get_state") {
        chrome.storage.local.get(['automating', 'saved', 'duplicates', 'errors'], (s) => {
            sendResponse(s);
        });
        return true;
    }
});

// ─── Tab navigation completed listener ───────────────────────────────────────
// This fires EVERY time any tab finishes loading. We check if it's our tab.
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (changeInfo.status !== "complete") return;
    if (!tab.url) return;

    const state = await chrome.storage.local.get(['automating', 'autoTabId']);
    if (!state.automating) return;
    if (tabId !== state.autoTabId) return;

    // Wait for page to render
    await sleep(3000);

    // Re-check if still automating after the sleep
    const recheck = await chrome.storage.local.get(['automating']);
    if (!recheck.automating) return;

    const url = tab.url;

    if (url.includes("linkedin.com/in/")) {
        // LinkedIn profile loaded → scrape and save
        log("📋 LinkedIn profile loaded. Extracting data...");
        await scrapeAndSaveProfile(tabId);

    } else if (url.includes("google.") && url.includes("/search")) {
        // Google search page loaded → extract LinkedIn URLs
        log("🔎 Google search page loaded. Extracting LinkedIn URLs...");
        await extractUrlsFromGoogleAndProcess(tabId);

    } else {
        // Some other page (consent, redirect, etc.) — just wait and retry
        log(`⚠️ Unexpected page: ${url.substring(0, 50)}...`);
        log("Waiting 3s and retrying...");
        await sleep(3000);
        
        // Try navigating to the Google URL again
        const st = await chrome.storage.local.get(['googleUrl', 'automating']);
        if (st.automating && st.googleUrl) {
            chrome.tabs.update(tabId, { url: st.googleUrl });
        }
    }
});

// ─── Start Automation ─────────────────────────────────────────────────────────
async function startAutomation(tabId, googleUrl, limit) {
    await chrome.storage.local.set({
        automating: true,
        autoTabId: tabId,
        googleUrl: googleUrl,
        queue: [],
        nextPageUrl: null,
        processedUrls: [],
        saved: 0,
        duplicates: 0,
        errors: 0,
        limit: limit || 20
    });

    log("🚀 Navigating to Google search...");
    
    // Navigate the tab to Google search
    chrome.tabs.update(tabId, { url: googleUrl });
    // The onUpdated listener will handle the rest
}

// ─── Stop Automation ──────────────────────────────────────────────────────────
async function stopAutomation(message) {
    await chrome.storage.local.set({ automating: false, queue: [] });
    log("🏁 " + message);
    sendToPanel("finished", { message });
}

// ─── Extract URLs from Google ─────────────────────────────────────────────────
async function extractUrlsFromGoogleAndProcess(tabId) {
    try {
        const results = await chrome.scripting.executeScript({
            target: { tabId },
            func: () => {
                // ── THIS RUNS INSIDE THE GOOGLE TAB ──
                const allLinks = document.querySelectorAll('a');
                const urls = [];
                const seen = new Set();

                for (const a of allLinks) {
                    let href = a.href || a.getAttribute('data-href') || a.getAttribute('href') || "";
                    if (!href) continue;

                    // Handle Google /url?q= redirect wrappers
                    if (href.includes('/url?') || href.includes('/url%3F')) {
                        try {
                            const u = new URL(href, window.location.href);
                            href = u.searchParams.get('q') || u.searchParams.get('url') || href;
                        } catch(e) {}
                    }

                    try {
                        href = decodeURIComponent(href);
                    } catch(e) {}

                    // Must be a LinkedIn profile URL
                    if (!href.includes('linkedin.com/in/')) continue;
                    if (href.includes('google.com')) continue;

                    // Clean: remove query params and fragments
                    let clean = href.split('?')[0].split('#')[0];
                    
                    // Ensure trailing slash
                    if (!clean.endsWith('/')) clean += '/';

                    // Skip Google cache/translate links
                    if (clean.includes('webcache') || clean.includes('translate.google') || clean.includes('google.com')) continue;

                    // Skip if already seen on this page
                    if (seen.has(clean)) continue;
                    seen.add(clean);

                    // Get the title text from the closest search result heading
                    let titleText = "";
                    let parent = a.closest('[data-hveid]') || a.closest('.g') || a.closest('[data-sokoban-container]') || a.parentElement;
                    if (parent) {
                        const h3 = parent.querySelector('h3');
                        if (h3) titleText = h3.innerText;
                    }

                    urls.push({ url: clean, googleTitle: titleText });
                }

                // Find "Next" page link
                let nextPageUrl = null;
                const nextBtn = document.querySelector('#pnnext') 
                    || document.querySelector('a[id="pnnext"]')
                    || document.querySelector('a[aria-label*="Next"]')
                    || document.querySelector('a[aria-label*="next"]')
                    || document.querySelector('td.navend a')
                    || Array.from(document.querySelectorAll('a')).find(el => el.innerText && el.innerText.trim().toLowerCase() === 'next');
                
                if (nextBtn && nextBtn.href) {
                    nextPageUrl = nextBtn.href;
                }

                return { urls, nextPageUrl };
            }
        });

        if (!results || !results[0] || !results[0].result) {
            log("❌ Could not read Google page.");
            await stopAutomation("Failed to read Google page.");
            return;
        }

        const { urls, nextPageUrl } = results[0].result;

        // Filter out already-processed URLs
        const state = await chrome.storage.local.get(['processedUrls']);
        const processed = new Set(state.processedUrls || []);
        const newUrls = urls.filter(u => !processed.has(u.url));

        await chrome.storage.local.set({ nextPageUrl });

        if (newUrls.length === 0) {
            if (nextPageUrl) {
                log("⚠️ All profiles on this page already processed. Next page...");
                await sleep(2000);
                chrome.tabs.update(tabId, { url: nextPageUrl });
                return;
            } else {
                await stopAutomation("No more profiles found on Google.");
                return;
            }
        }

        log(`✅ Found ${newUrls.length} new LinkedIn profiles on this Google page!`);
        
        // Store the queue of LinkedIn URLs to visit
        await chrome.storage.local.set({ queue: newUrls.map(u => u.url) });

        // Start visiting the first one
        await sleep(1500);
        await processNext(tabId);

    } catch (err) {
        log("❌ Error reading Google: " + err.message);
        await stopAutomation("Google extraction failed.");
    }
}

// ─── Process next LinkedIn profile in the queue ───────────────────────────────
async function processNext(tabId) {
    const state = await chrome.storage.local.get(['queue', 'automating', 'autoTabId', 'saved', 'limit', 'nextPageUrl']);
    if (!state.automating) return;

    const tid = tabId || state.autoTabId;

    // Check limit
    if ((state.saved || 0) >= (state.limit || 20)) {
        await stopAutomation(`✅ Limit of ${state.limit} reached! Saved: ${state.saved}`);
        return;
    }

    const queue = state.queue || [];

    if (queue.length > 0) {
        const nextUrl = queue.shift();
        await chrome.storage.local.set({ queue });

        const slug = nextUrl.split('/in/')[1] || nextUrl;
        log(`🔗 Opening profile: ${slug}`);

        // Navigate to the LinkedIn profile
        chrome.tabs.update(tid, { url: nextUrl });
        // onUpdated will fire → scrapeAndSaveProfile

    } else if (state.nextPageUrl) {
        log("📄 Queue empty. Going to next Google page...");
        await sleep(2000);
        chrome.tabs.update(tid, { url: state.nextPageUrl });
        // onUpdated will fire → extractUrlsFromGoogleAndProcess

    } else {
        await stopAutomation("✅ All done! No more profiles or pages.");
    }
}

// ─── Scrape the LinkedIn profile and save to DB ───────────────────────────────
async function scrapeAndSaveProfile(tabId) {
    try {
        const results = await chrome.scripting.executeScript({
            target: { tabId },
            func: async () => {
                // ── THIS RUNS INSIDE THE LINKEDIN TAB ──
                const sleepMs = ms => new Promise(r => setTimeout(r, ms));
                
                let fullName = "";
                let jobTitle = "";
                let companyName = "";
                let companyUrl = null;

                // Retry up to 5 times (2.5s total) for SPA DOM rendering
                for (let attempt = 0; attempt < 5; attempt++) {
                    const nameSelectors = [
                        'h1.text-heading-xlarge',
                        'h1.inline',
                        '.pv-top-card-profile-picture ~ div h1',
                        'h1.vcard-name',
                        'h1'
                    ];
                    for (const sel of nameSelectors) {
                        const el = document.querySelector(sel);
                        if (el && el.innerText.trim() && !el.innerText.toLowerCase().includes('sign in') && !el.innerText.toLowerCase().includes('join linkedin')) {
                            fullName = el.innerText.trim();
                            break;
                        }
                    }

                    const titleSelectors = [
                        '.text-body-medium.break-words',
                        'div.text-body-medium',
                        '.pv-text-details__left-panel .text-body-medium',
                        'h2.top-card-layout__headline'
                    ];
                    for (const sel of titleSelectors) {
                        const el = document.querySelector(sel);
                        if (el && el.innerText.trim()) {
                            jobTitle = el.innerText.trim();
                            break;
                        }
                    }

                    if (fullName && fullName !== "Unknown") break;
                    await sleepMs(500);
                }

                // Document Title & Meta tag fallbacks
                if (!fullName || fullName === "Unknown") {
                    const docTitle = document.title || "";
                    if (docTitle && !docTitle.toLowerCase().includes('sign in') && !docTitle.toLowerCase().includes('log in')) {
                        const parts = docTitle.split('|')[0].split('–').join('-').split('-');
                        if (parts.length > 0 && parts[0].trim()) {
                            fullName = parts[0].trim();
                        }
                        if (parts.length > 1 && !jobTitle) {
                            jobTitle = parts[1].trim();
                        }
                        if (parts.length > 2 && !companyName) {
                            companyName = parts[2].trim();
                        }
                    }
                }

                if (!fullName || fullName === "Unknown") {
                    const ogTitle = document.querySelector('meta[property="og:title"]');
                    if (ogTitle && ogTitle.content) {
                        const parts = ogTitle.content.split('|')[0].split('–').join('-').split('-');
                        if (parts.length > 0 && parts[0].trim()) {
                            fullName = parts[0].trim();
                        }
                    }
                }

                // Company extraction
                if (!companyName) {
                    const compLink = document.querySelector('a[href*="/company/"]');
                    if (compLink) {
                        companyUrl = compLink.href.split('?')[0];
                        const span = compLink.querySelector('span[aria-hidden="true"]');
                        companyName = span ? span.innerText.trim() : compLink.innerText.trim();
                    }
                }

                if (!fullName) fullName = "LinkedIn Member";

                return {
                    full_name: fullName,
                    job_title: jobTitle,
                    company_name: companyName,
                    linkedin_profile_url: window.location.href.split('?')[0],
                    company_linkedin_url: companyUrl,
                    source_url: window.location.href
                };
            }
        });

        if (!results || !results[0] || !results[0].result) {
            log("⚠️ Could not read profile. Skipping...");
            await incrementCounter('errors');
            await sleep(2000);
            await processNext(tabId);
            return;
        }

        const profile = results[0].result;
        await saveToDatabase(profile, tabId);

    } catch (err) {
        log("⚠️ Cannot access this profile (private?). Skipping...");
        await incrementCounter('errors');
        await sleep(2000);
        await processNext(tabId);
    }
}

// ─── Save to MySQL via PHP ───────────────────────────────────────────────────
async function saveToDatabase(profile, tabId) {
    const state = await chrome.storage.local.get(['saved', 'duplicates', 'errors', 'processedUrls', 'limit']);
    let { saved = 0, duplicates = 0, errors = 0, processedUrls = [] } = state;

    processedUrls.push(profile.linkedin_profile_url);

    try {
        const resp = await fetch(`${API_BASE}/add_executive.php`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(profile)
        });

        if (!resp.ok) throw new Error("HTTP " + resp.status);
        const data = await resp.json();

        if (data.success) {
            saved++;
            log(`✅ Saved: ${profile.full_name} | ${profile.job_title}`);
        } else if (data.duplicate) {
            duplicates++;
            log(`⚠️ Dupe: ${profile.full_name}`);
        } else {
            errors++;
            log(`❌ DB Error: ${data.message}`);
        }
    } catch (err) {
        errors++;
        log(`❌ Backend error — is XAMPP running? ${err.message}`);
    }

    await chrome.storage.local.set({ saved, duplicates, errors, processedUrls });
    sendToPanel("progress", { saved, duplicates, errors });

    // Check limit
    if (saved >= (state.limit || 20)) {
        await stopAutomation(`✅ Limit of ${state.limit} reached! Saved: ${saved}`);
        return;
    }

    // Human-like delay 3–5s before next
    const delay = Math.floor(Math.random() * 2000) + 3000;
    await sleep(delay);
    await processNext(tabId);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
async function incrementCounter(field) {
    const s = await chrome.storage.local.get([field, 'saved', 'duplicates', 'errors']);
    s[field] = (s[field] || 0) + 1;
    await chrome.storage.local.set({ [field]: s[field] });
    sendToPanel("progress", { saved: s.saved || 0, duplicates: s.duplicates || 0, errors: s.errors || 0 });
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function log(text) {
    sendToPanel("log", { text });
}

function sendToPanel(action, data) {
    chrome.runtime.sendMessage({ action, ...data }).catch(() => {});
}
