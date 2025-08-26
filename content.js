(function() {
    'use strict';

    let enabledDomains = [];
    const currentDomain = window.location.hostname;

    function isBase64(str) {
        if (str.length < 4) return false;
        if (str.length % 4 !== 0) return false;
        
        const base64Regex = /^[A-Za-z0-9+\/]*={0,2}$/;
        return base64Regex.test(str);
    }

    function decodeBase64(str) {
        try {
            const decoded = atob(str);
            if (decoded && decoded.length > 0) {
                const isValidText = /^[\x20-\x7E\s]*$/.test(decoded);
                return isValidText ? decoded : null;
            }
            return null;
        } catch (e) {
            return null;
        }
    }

    function processTextNode(textNode) {
        const text = textNode.textContent;
        const words = text.split(/(\s+)/);
        let hasChanges = false;
        
        const processedWords = words.map(word => {
            const trimmed = word.trim();
            if (trimmed.length > 4 && isBase64(trimmed)) {
                const decoded = decodeBase64(trimmed);
                if (decoded && decoded !== trimmed) {
                    hasChanges = true;
                    return word.replace(trimmed, decoded);
                }
            }
            return word;
        });

        if (hasChanges) {
            const newText = processedWords.join('');
            if (newText !== text) {
                const span = document.createElement('span');
                span.className = 'base64-decoded';
                span.textContent = newText;
                textNode.parentNode.replaceChild(span, textNode);
            }
        }
    }

    function processAllTextNodes() {
        const walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: function(node) {
                    if (node.parentElement.tagName === 'SCRIPT' || 
                        node.parentElement.tagName === 'STYLE' ||
                        node.parentElement.classList.contains('base64-decoded')) {
                        return NodeFilter.FILTER_REJECT;
                    }
                    return NodeFilter.FILTER_ACCEPT;
                }
            }
        );

        const textNodes = [];
        let node;
        while (node = walker.nextNode()) {
            textNodes.push(node);
        }

        textNodes.forEach(processTextNode);
    }

    function shouldProcessDomain() {
        return enabledDomains.length === 0 || enabledDomains.includes(currentDomain);
    }

    function init() {
        chrome.storage.sync.get(['enabledDomains'], function(result) {
            enabledDomains = result.enabledDomains || [];
            
            if (shouldProcessDomain()) {
                processAllTextNodes();
                
                const observer = new MutationObserver(function(mutations) {
                    mutations.forEach(function(mutation) {
                        mutation.addedNodes.forEach(function(node) {
                            if (node.nodeType === Node.TEXT_NODE) {
                                processTextNode(node);
                            } else if (node.nodeType === Node.ELEMENT_NODE) {
                                const walker = document.createTreeWalker(
                                    node,
                                    NodeFilter.SHOW_TEXT,
                                    {
                                        acceptNode: function(n) {
                                            if (n.parentElement.tagName === 'SCRIPT' || 
                                                n.parentElement.tagName === 'STYLE' ||
                                                n.parentElement.classList.contains('base64-decoded')) {
                                                return NodeFilter.FILTER_REJECT;
                                            }
                                            return NodeFilter.FILTER_ACCEPT;
                                        }
                                    }
                                );
                                
                                let textNode;
                                while (textNode = walker.nextNode()) {
                                    processTextNode(textNode);
                                }
                            }
                        });
                    });
                });

                observer.observe(document.body, {
                    childList: true,
                    subtree: true
                });
            }
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();