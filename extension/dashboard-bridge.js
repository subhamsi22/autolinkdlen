// Lets the local dashboard ask the extension to open a drafted LinkedIn message.
// The dashboard cannot access chrome.runtime directly because it is an ordinary web page.
window.addEventListener('message', (event) => {
    if (event.source !== window || event.origin !== window.location.origin) return;

    const data = event.data;
    if (!data || data.source !== 'linkedin-leads-dashboard' || data.action !== 'open_message_compose') return;

    chrome.runtime.sendMessage({
        action: 'open_message_compose',
        profileUrl: data.profileUrl,
        message: data.message
    }, (response) => {
        window.postMessage({
            source: 'linkedin-leads-extension',
            requestId: data.requestId,
            success: Boolean(response && response.success),
            message: response && response.message
        }, window.location.origin);
    });
});
