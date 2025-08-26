chrome.runtime.onInstalled.addListener(function() {
    chrome.storage.sync.get(['enabledDomains'], function(result) {
        if (!result.enabledDomains) {
            chrome.storage.sync.set({
                'enabledDomains': []
            });
        }
    });
});

chrome.storage.onChanged.addListener(function(changes, namespace) {
    if (namespace === 'sync' && changes.enabledDomains) {
        chrome.tabs.query({}, function(tabs) {
            tabs.forEach(function(tab) {
                if (tab.url && !tab.url.startsWith('chrome://') && !tab.url.startsWith('chrome-extension://')) {
                    chrome.tabs.reload(tab.id);
                }
            });
        });
    }
});