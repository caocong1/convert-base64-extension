(function() {
    'use strict';

    let enabledDomains = [];
    let customCSS = '';
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
        
        // 使用正则表达式查找所有可能的Base64字符串
        const base64Pattern = /[A-Za-z0-9+\/]{4,}={0,2}/g;
        const matches = text.match(base64Pattern);
        
        if (!matches) return;
        
        let hasChanges = false;
        let replacements = [];
        
        matches.forEach(match => {
            // 验证是否为有效的Base64格式
            if (isBase64(match) && match.length > 4) {
                const decoded = decodeBase64(match);
                if (decoded && decoded !== match) {
                    replacements.push({ original: match, decoded: decoded });
                    hasChanges = true;
                }
            }
        });

        if (hasChanges && replacements.length > 0) {
            // 创建文档片段来保存新的内容
            const fragment = document.createDocumentFragment();
            let lastIndex = 0;
            let currentText = text;
            
            replacements.forEach(replacement => {
                const index = currentText.indexOf(replacement.original, lastIndex);
                if (index !== -1) {
                    // 添加Base64之前的文本
                    if (index > lastIndex) {
                        fragment.appendChild(document.createTextNode(currentText.substring(lastIndex, index)));
                    }
                    
                    // 添加解码后的文本（带样式）
                    const span = document.createElement('span');
                    span.className = 'base64-decoded';
                    span.textContent = replacement.decoded;
                    applyCustomStyles(span);
                    fragment.appendChild(span);
                    
                    lastIndex = index + replacement.original.length;
                }
            });
            
            // 添加最后剩余的文本
            if (lastIndex < currentText.length) {
                fragment.appendChild(document.createTextNode(currentText.substring(lastIndex)));
            }
            
            // 替换原始文本节点
            textNode.parentNode.replaceChild(fragment, textNode);
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

    function getDefaultCSS() {
        return `background-color: #e8f5e8 !important;
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

    function applyCustomStyles(element) {
        const cssToApply = customCSS || getDefaultCSS();
        
        // Parse and apply CSS
        const cssRules = cssToApply.split(';').filter(rule => rule.trim());
        cssRules.forEach(rule => {
            const [property, value] = rule.split(':').map(s => s.trim());
            if (property && value) {
                // Remove !important from value for style property setting
                const cleanValue = value.replace(/\s*!important\s*$/i, '');
                
                // Use setProperty to properly handle !important
                if (value.includes('!important')) {
                    element.style.setProperty(property, cleanValue, 'important');
                } else {
                    element.style.setProperty(property, cleanValue);
                }
            }
        });
        
        // Add hover effect if transition is present
        if (cssToApply.includes('transition')) {
            element.addEventListener('mouseenter', function() {
                this.style.setProperty('transform', 'translateY(-1px)', 'important');
                this.style.setProperty('box-shadow', '0 2px 8px rgba(0, 0, 0, 0.15)', 'important');
            });
            
            element.addEventListener('mouseleave', function() {
                this.style.setProperty('transform', 'none', 'important');
                // Reset to original box-shadow if specified in CSS
                const shadowMatch = cssToApply.match(/box-shadow:\s*([^;!]+)/);
                if (shadowMatch) {
                    const shadowValue = shadowMatch[1].replace(/\s*!important\s*$/i, '');
                    this.style.setProperty('box-shadow', shadowValue, 'important');
                }
            });
        }
    }

    function matchesWildcardPattern(pattern, domain) {
        // Convert wildcard pattern to regex
        const regexPattern = pattern
            .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')  // Escape regex special chars
            .replace(/\\?\*/g, '.*')                 // Convert * to .*
            .replace(/\\?\?/g, '.');                 // Convert ? to .
        
        const regex = new RegExp('^' + regexPattern + '$', 'i');
        return regex.test(domain);
    }

    function shouldProcessDomain() {
        if (enabledDomains.length === 0) {
            return true;
        }
        
        return enabledDomains.some(pattern => {
            // Direct match
            if (pattern === currentDomain) {
                return true;
            }
            
            // Wildcard pattern match
            if (pattern.includes('*') || pattern.includes('?')) {
                return matchesWildcardPattern(pattern, currentDomain);
            }
            
            // Subdomain match (if pattern starts with .)
            if (pattern.startsWith('.')) {
                return currentDomain.endsWith(pattern) || currentDomain === pattern.substring(1);
            }
            
            return false;
        });
    }

    function init() {
        chrome.storage.sync.get(['enabledDomains', 'customCSS'], function(result) {
            enabledDomains = result.enabledDomains || [];
            customCSS = result.customCSS || '';
            
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