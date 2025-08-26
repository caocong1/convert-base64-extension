document.addEventListener('DOMContentLoaded', function() {
    const domainInput = document.getElementById('domainInput');
    const addBtn = document.getElementById('addBtn');
    const addCurrentBtn = document.getElementById('addCurrentBtn');
    const domainList = document.getElementById('domainList');
    const currentDomainSpan = document.getElementById('currentDomain');
    
    // Style elements
    const customCSSInput = document.getElementById('customCSS');
    const previewSpan = document.getElementById('preview');
    const resetStyleBtn = document.getElementById('resetStyleBtn');
    
    let enabledDomains = [];
    let currentDomain = '';
    let customCSS = '';

    function loadSettings() {
        chrome.storage.sync.get(['enabledDomains', 'customCSS'], function(result) {
            enabledDomains = result.enabledDomains || [];
            customCSS = result.customCSS || getDefaultCSS();
            updateDomainList();
            loadCSSSettings();
            updatePreview();
        });
    }

    function saveSettings() {
        chrome.storage.sync.set({
            'enabledDomains': enabledDomains,
            'customCSS': customCSS
        });
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

    function loadCSSSettings() {
        customCSSInput.value = customCSS;
    }

    function updatePreview() {
        // Clear existing styles
        previewSpan.style.cssText = '';
        
        // Apply custom CSS
        if (customCSS) {
            try {
                // Parse and apply CSS
                const cssRules = customCSS.split(';').filter(rule => rule.trim());
                cssRules.forEach(rule => {
                    const [property, value] = rule.split(':').map(s => s.trim());
                    if (property && value) {
                        // Remove !important from value for style property setting
                        const cleanValue = value.replace(/\s*!important\s*$/i, '');
                        const camelCaseProperty = property.replace(/-([a-z])/g, (match, letter) => letter.toUpperCase());
                        
                        // Set the style property
                        previewSpan.style[camelCaseProperty] = cleanValue;
                        
                        // If it was important, use setProperty instead
                        if (value.includes('!important')) {
                            previewSpan.style.setProperty(property, cleanValue, 'important');
                        }
                    }
                });
            } catch (e) {
                console.warn('Invalid CSS:', e);
            }
        } else {
            // Apply default styles if no custom CSS
            const defaultCSS = getDefaultCSS();
            const cssRules = defaultCSS.split(';').filter(rule => rule.trim());
            cssRules.forEach(rule => {
                const [property, value] = rule.split(':').map(s => s.trim());
                if (property && value) {
                    const cleanValue = value.replace(/\s*!important\s*$/i, '');
                    const camelCaseProperty = property.replace(/-([a-z])/g, (match, letter) => letter.toUpperCase());
                    previewSpan.style[camelCaseProperty] = cleanValue;
                }
            });
        }
    }

    function saveCurrentCSS() {
        customCSS = customCSSInput.value.trim();
        saveSettings();
        updatePreview();
    }

    function updateDomainList() {
        domainList.innerHTML = '';
        
        if (enabledDomains.length === 0) {
            domainList.innerHTML = '<div style="color: #666; font-style: italic;">所有域名都已启用</div>';
            return;
        }
        
        enabledDomains.forEach(function(pattern, index) {
            const domainItem = document.createElement('div');
            domainItem.className = 'domain-item';
            
            // Add pattern type indicator
            let typeIndicator = '';
            if (pattern.includes('*') || pattern.includes('?')) {
                typeIndicator = ' <small style="color: #ff9800;">[通配符]</small>';
            } else if (pattern.startsWith('.')) {
                typeIndicator = ' <small style="color: #2196f3;">[子域名]</small>';
            } else {
                typeIndicator = ' <small style="color: #4caf50;">[精确]</small>';
            }
            
            domainItem.innerHTML = `
                <span><code>${pattern}</code>${typeIndicator}</span>
                <button class="remove-btn" data-index="${index}">删除</button>
            `;
            domainList.appendChild(domainItem);
        });
        
        const removeButtons = domainList.querySelectorAll('.remove-btn');
        removeButtons.forEach(function(btn) {
            btn.addEventListener('click', function() {
                const index = parseInt(this.getAttribute('data-index'));
                enabledDomains.splice(index, 1);
                saveSettings();
                updateDomainList();
            });
        });
    }

    function validatePattern(pattern) {
        // Basic validation
        if (!pattern || pattern.trim() === '') {
            return { valid: false, error: '模式不能为空' };
        }
        
        pattern = pattern.trim().toLowerCase();
        
        // Check for invalid characters
        if (pattern.includes(' ')) {
            return { valid: false, error: '模式不能包含空格' };
        }
        
        // Check for valid domain characters
        const validChars = /^[a-z0-9.*?-]+$/;
        if (!validChars.test(pattern)) {
            return { valid: false, error: '模式包含无效字符' };
        }
        
        return { valid: true, pattern: pattern };
    }

    function addDomain(domain) {
        const validation = validatePattern(domain);
        if (!validation.valid) {
            alert('无效的域名模式: ' + validation.error);
            return;
        }
        
        const pattern = validation.pattern;
        if (!enabledDomains.includes(pattern)) {
            enabledDomains.push(pattern);
            saveSettings();
            updateDomainList();
            domainInput.value = '';
        } else {
            alert('该模式已存在');
        }
    }

    function getCurrentTab() {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            if (tabs[0]) {
                const url = new URL(tabs[0].url);
                currentDomain = url.hostname;
                currentDomainSpan.textContent = currentDomain;
                
                if (enabledDomains.includes(currentDomain)) {
                    addCurrentBtn.textContent = '已添加';
                    addCurrentBtn.disabled = true;
                    addCurrentBtn.style.background = '#666';
                } else {
                    addCurrentBtn.textContent = '添加当前域名';
                    addCurrentBtn.disabled = false;
                    addCurrentBtn.style.background = '#4caf50';
                }
            }
        });
    }

    addBtn.addEventListener('click', function() {
        addDomain(domainInput.value);
    });

    addCurrentBtn.addEventListener('click', function() {
        if (currentDomain && !addCurrentBtn.disabled) {
            addDomain(currentDomain);
            addCurrentBtn.textContent = '已添加';
            addCurrentBtn.disabled = true;
            addCurrentBtn.style.background = '#666';
        }
    });

    domainInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            addDomain(domainInput.value);
        }
    });

    // Style event listeners
    customCSSInput.addEventListener('input', saveCurrentCSS);
    customCSSInput.addEventListener('change', saveCurrentCSS);

    resetStyleBtn.addEventListener('click', function() {
        customCSS = getDefaultCSS();
        loadCSSSettings();
        saveSettings();
        updatePreview();
    });

    loadSettings();
    getCurrentTab();
});