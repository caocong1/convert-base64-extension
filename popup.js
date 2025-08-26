document.addEventListener('DOMContentLoaded', function() {
    const domainInput = document.getElementById('domainInput');
    const addBtn = document.getElementById('addBtn');
    const addCurrentBtn = document.getElementById('addCurrentBtn');
    const domainList = document.getElementById('domainList');
    const currentDomainSpan = document.getElementById('currentDomain');
    
    let enabledDomains = [];
    let currentDomain = '';

    function loadSettings() {
        chrome.storage.sync.get(['enabledDomains'], function(result) {
            enabledDomains = result.enabledDomains || [];
            updateDomainList();
        });
    }

    function saveSettings() {
        chrome.storage.sync.set({
            'enabledDomains': enabledDomains
        });
    }

    function updateDomainList() {
        domainList.innerHTML = '';
        
        if (enabledDomains.length === 0) {
            domainList.innerHTML = '<div style="color: #666; font-style: italic;">所有域名都已启用</div>';
            return;
        }
        
        enabledDomains.forEach(function(domain, index) {
            const domainItem = document.createElement('div');
            domainItem.className = 'domain-item';
            domainItem.innerHTML = `
                <span>${domain}</span>
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

    function addDomain(domain) {
        if (!domain) return;
        
        domain = domain.trim().toLowerCase();
        if (domain && !enabledDomains.includes(domain)) {
            enabledDomains.push(domain);
            saveSettings();
            updateDomainList();
        }
        domainInput.value = '';
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

    loadSettings();
    getCurrentTab();
});