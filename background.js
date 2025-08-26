chrome.runtime.onInstalled.addListener(function() {
    chrome.storage.sync.get(['enabledDomains', 'customCSS'], function(result) {
        const defaultData = {};
        
        if (!result.enabledDomains) {
            defaultData.enabledDomains = [];
        }
        
        if (!result.customCSS) {
            defaultData.customCSS = `background-color: #e8f5e8 !important;
color: #2e7d32 !important;
border-left: 3px solid #4caf50 !important;
padding: 2px 4px !important;
border-radius: 3px !important;
font-weight: 500 !important;
display: inline-block !important;
margin: 0 2px !important;
box-shadow: 0 1px 3px rgba(76, 175, 80, 0.2) !important;
transition: all 0.2s ease !important;`;
        }
        
        if (Object.keys(defaultData).length > 0) {
            chrome.storage.sync.set(defaultData);
        }
    });
});

chrome.storage.onChanged.addListener(function(changes, namespace) {
    if (namespace === 'sync' && (changes.enabledDomains || changes.customCSS)) {
        chrome.tabs.query({}, function(tabs) {
            tabs.forEach(function(tab) {
                if (tab.url && !tab.url.startsWith('chrome://') && !tab.url.startsWith('chrome-extension://')) {
                    chrome.tabs.reload(tab.id);
                }
            });
        });
    }
});