import { BasePanel } from './base-panel.js';
import { saveGithubFile, getGithubFile } from '/experiments/editor/wc/db-manager.js';
import { normalizePath, saveFileToGithub } from '/js/fs.js';

class ConfigEditorPanel extends BasePanel {
    constructor() {
        super();


        const urlParams = new URLSearchParams(window.location.search);
        const dockURL = urlParams.get('configURL') || '/desktop/dock.json';

        this.configs = [
            { id: 'dock', label: 'Dock Configuration', path: dockURL },
            { id: 'panels', label: 'System Preferences Panels', path: '/desktop/src/apps/system-preferences/panels-config.json' }
        ];
        this.selectedConfig = this.configs[0];
        this.configData = [];
        this.selectedIndex = 0;
    }

    getStyles() {
        return `
            ${super.getStyles()}
            :host {
                height: 100%;
                display: flex;
                flex-direction: column;
                color: #1e1e1e;
            }
            .header-area {
                padding-bottom: 20px;
                border-bottom: 1px solid rgba(0,0,0,0.1);
                margin-bottom: 20px;
            }
            .config-selector label {
                display: block;
                font-size: 11px;
                font-weight: 600;
                color: #888;
                text-transform: uppercase;
                margin-bottom: 6px;
            }
            .config-selector select {
                width: 100%;
                padding: 8px;
                border: 1px solid #ddd;
                border-radius: 6px;
                background: #fff;
                font-size: 13px;
                outline: none;
            }
            .main-layout {
                display: flex;
                flex: 1;
                gap: 20px;
                min-height: 0;
            }
            .sidebar {
                width: 220px;
                display: flex;
                flex-direction: column;
                background: rgba(0,0,0,0.03);
                border-radius: 10px;
                overflow-y: auto;
                padding: 5px;
            }
            .nav-item {
                padding: 10px 12px;
                border-radius: 6px;
                cursor: pointer;
                font-size: 13px;
                display: flex;
                align-items: center;
                gap: 10px;
                transition: background 0.1s;
                margin-bottom: 2px;
            }
            .nav-icon {
                font-size: 16px;
                width: 20px;
                text-align: center;
            }
            .nav-label {
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            .nav-item:hover {
                background: rgba(0,0,0,0.05);
            }
            .nav-item.active {
                background: #007AFF;
                color: white;
                font-weight: 500;
            }
            .detail-view {
                flex: 1;
                background: #fff;
                border: 1px solid #ddd;
                border-radius: 10px;
                padding: 24px;
                overflow-y: auto;
                display: flex;
                flex-direction: column;
            }
            .detail-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 24px;
                padding-bottom: 16px;
                border-bottom: 1px solid #eee;
            }
            .header-title-group {
                display: flex;
                align-items: center;
                gap: 12px;
            }
            .header-icon {
                font-size: 24px;
            }
            .detail-header h3 {
                margin: 0;
                font-size: 18px;
            }
            .field-group {
                display: flex;
                flex-direction: column;
                gap: 6px;
                margin-bottom: 16px;
            }
            .field-group label {
                font-size: 12px;
                font-weight: 600;
                color: #666;
            }
            .field-group input {
                padding: 10px 12px;
                border: 1px solid #ddd;
                border-radius: 8px;
                font-size: 13px;
                background: #f9f9f9;
                transition: all 0.2s;
            }
            .field-group input:focus {
                outline: none;
                border-color: #007AFF;
                background: #fff;
                box-shadow: 0 0 0 3px rgba(0,122,255,0.1);
            }
            .field-group.checkbox {
                flex-direction: row-reverse;
                justify-content: flex-end;
                align-items: center;
                gap: 12px;
            }
            .field-group.checkbox input {
                width: auto;
                margin: 0;
            }
            .field-group.checkbox label {
                margin: 0;
            }
            .actions-bar {
                margin-top: 20px;
                padding-top: 20px;
                display: flex;
                justify-content: flex-end;
                gap: 12px;
                border-top: 1px solid #eee;
            }
            .danger-button {
                background: #fff;
                color: #FF3B30;
                border: 1px solid #FF3B30;
                padding: 6px 14px;
                border-radius: 6px;
                font-size: 12px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s;
            }
            .danger-button:hover {
                background: #FF3B30;
                color: white;
            }
            .add-button {
                margin: 8px;
                padding: 10px;
                background: transparent;
                border: 1px dashed #ccc;
                color: #666;
                border-radius: 8px;
                font-size: 13px;
                cursor: pointer;
                transition: all 0.2s;
            }
            .add-button:hover {
                border-color: #007AFF;
                color: #007AFF;
                background: rgba(0,122,255,0.05);
            }
            .primary-button {
                background: #007AFF;
                color: white;
                border: none;
                padding: 10px 24px;
                border-radius: 8px;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
                box-shadow: 0 2px 6px rgba(0,122,255,0.2);
                transition: all 0.2s;
            }
            .primary-button:hover {
                background: #0062CC;
                transform: translateY(-1px);
            }
            .empty-state {
                display: flex;
                align-items: center;
                justify-content: center;
                height: 100%;
                color: #999;
                font-style: italic;
            }
        `;
    }

    getTemplate() {
        return `
            <div class="header-area">
                <h2>JSON Configuration Editor</h2>
                <div class="config-selector">
                    <label>Active Configuration</label>
                    <select id="config-file-select">
                        ${this.configs.map(c => `<option value="${c.id}" ${this.selectedConfig.id === c.id ? 'selected' : ''}>${c.label}</option>`).join('')}
                    </select>
                </div>
            </div>

            <div class="main-layout">
                <div class="sidebar">
                    <div id="item-nav-list"></div>
                    <button id="add-item-btn" class="add-button">+ Add New ${this.selectedConfig.id === 'dock' ? 'App' : 'Panel'}</button>
                </div>
                <div id="detail-pane" class="detail-view">
                    <!-- Detail editor elements will be injected here -->
                </div>
            </div>

            <div class="actions-bar">
                <button id="save-config-btn" class="primary-button">Save Changes to Server</button>
            </div>
        `;
    }

    async loadSettings() {
        try {
            const cachedFile = await getGithubFile(this.selectedConfig.path);
            if (cachedFile && cachedFile.content) {
                console.log(`Loaded ${this.selectedConfig.path} from GitHub cache`);
                this.configData = JSON.parse(cachedFile.content);
            } else {
                const response = await fetch(this.selectedConfig.path);
                this.configData = await response.json();
            }
            
            this.selectedIndex = this.configData.length > 0 ? 0 : -1;
            this.renderContent();
        } catch (error) {
            console.error('Error loading config:', error);
            const pane = this.shadowRoot.getElementById('detail-pane');
            if (pane) pane.innerHTML = `<p style="color: red;">Failed to load configuration from server.</p>`;
        }
    }

    renderContent() {
        this.renderItems();
        this.renderDetail();
    }

    renderItems() {
        const list = this.shadowRoot.getElementById('item-nav-list');
        if (!list) return;
        
        list.innerHTML = this.configData.map((item, index) => {
            const label = item.name || item.label || item.id || 'Unnamed Item';
            const icon = item.icon || '📄';
            return `
                <div class="nav-item ${this.selectedIndex === index ? 'active' : ''}" data-index="${index}">
                    <span class="nav-icon">${icon}</span>
                    <span class="nav-label">${this.escapeHtml(label)}</span>
                </div>
            `;
        }).join('');
    }

    renderDetail() {
        const pane = this.shadowRoot.getElementById('detail-pane');
        if (!pane) return;

        if (this.selectedIndex === -1 || !this.configData[this.selectedIndex]) {
            pane.innerHTML = `<div class="empty-state">Select an item from the sidebar to edit its properties.</div>`;
            return;
        }

        const item = this.configData[this.selectedIndex];
        const fields = Object.keys(item).map(key => {
            const value = item[key];
            const inputType = typeof value === 'boolean' ? 'checkbox' : 'text';
            const inputAttr = inputType === 'checkbox' ? (value ? 'checked' : '') : `value="${this.escapeHtml(String(value))}"`;
            
            return `
                <div class="field-group ${inputType}">
                    <label>${key}</label>
                    <input type="${inputType}" data-key="${key}" ${inputAttr}>
                </div>
            `;
        }).join('');

        pane.innerHTML = `
            <div class="detail-header">
                <div class="header-title-group">
                    <span class="header-icon">${item.icon || '📄'}</span>
                    <h3>${this.escapeHtml(item.name || item.label || 'Item Details')}</h3>
                </div>
                <button id="delete-item-btn" class="danger-button">Delete</button>
            </div>
            <div class="fields-list">
                ${fields}
            </div>
        `;

        // Attach local events for this detail view
        pane.querySelector('#delete-item-btn').onclick = () => {
            if (confirm('Are you sure you want to delete this item?')) {
                this.configData.splice(this.selectedIndex, 1);
                this.selectedIndex = this.configData.length > 0 ? 0 : -1;
                this.renderContent();
            }
        };

        pane.querySelectorAll('input').forEach(input => {
            input.oninput = (e) => {
                const key = e.target.dataset.key;
                let value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
                
                if (e.target.type !== 'checkbox') {
                    if (value.toLowerCase() === 'true') value = true;
                    else if (value.toLowerCase() === 'false') value = false;
                    else if (!isNaN(value) && value.trim() !== '') value = Number(value);
                }
                
                this.configData[this.selectedIndex][key] = value;
                
                // If we edited a name field, refresh sidebar
                if (['name', 'label', 'id'].includes(key)) {
                    this.renderItems();
                }
            };
        });
    }

    escapeHtml(str) {
        return str.replace(/[&<>"']/g, function(m) {
            return {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#39;'
            }[m];
        });
    }

    setupEventListeners() {
        this.shadowRoot.getElementById('config-file-select').addEventListener('change', (e) => {
            this.selectedConfig = this.configs.find(c => c.id === e.target.value);
            this.loadSettings();
        });

        this.shadowRoot.getElementById('item-nav-list').addEventListener('click', (e) => {
            const navItem = e.target.closest('.nav-item');
            if (navItem) {
                this.selectedIndex = parseInt(navItem.dataset.index);
                this.renderContent();
            }
        });

        this.shadowRoot.getElementById('add-item-btn').addEventListener('click', () => {
            const newItem = this.selectedConfig.id === 'dock' ? 
                { id: "new-app", name: "New App", icon: "🚀", sourceUrl: "", tag: "", onstartup: false } :
                { id: "new-panel", label: "New Panel", icon: "📦", path: "", tagName: "" };
            
            this.configData.push(newItem);
            this.selectedIndex = this.configData.length - 1;
            this.renderContent();
        });

        this.shadowRoot.getElementById('save-config-btn').addEventListener('click', () => {
            this.saveConfig();
        });
    }

    async saveConfig() {
        try {
            const content = JSON.stringify(this.configData, null, 2);
            const path = normalizePath(this.selectedConfig.path);
            
            // Decoupled from github-explorer: Save directly using shared FS utility
            // This handles SHA lookups automatically and sets status to 'synced' on success
            await saveFileToGithub(path, content, `Update ${this.selectedConfig.label}`);

            alert(`Successfully saved ${this.selectedConfig.label} to GitHub.`);

        } catch (error) {
            console.error(error);
            alert(`Error saving to GitHub: ${error.message}. \n\nThe file has been saved to your local cache. You can try syncing later.`);
        }
    }
}

customElements.define('sys-pref-config-editor-panel', ConfigEditorPanel);
