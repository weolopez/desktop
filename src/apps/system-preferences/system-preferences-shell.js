// System Preferences Shell - Main Component
class SystemPreferencesShell extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.panelsConfig = [];
    }

    async connectedCallback() {
        await this.loadPanelsConfig();
        this.render();
        this.setupEventListeners();
        // Load default panel
        this.loadPanel('desktop');
    }

    async loadPanelsConfig() {
        try {
            const response = await fetch('/desktop/src/apps/system-preferences/panels-config.json');
            this.panelsConfig = await response.json();
        } catch (error) {
            console.error('Failed to load panels config:', error);
            // Fallback to empty or default config if necessary
        }
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    background: #f6f6f6;
                    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
                }

                .settings-container {
                    display: flex;
                    height: 100%;
                }

                .sidebar {
                    width: 200px;
                    background: #e8e8e8;
                    border-right: 1px solid #d0d0d0;
                    padding: 10px 0;
                }

                .sidebar-item {
                    display: flex;
                    align-items: center;
                    padding: 8px 16px;
                    cursor: pointer;
                    font-size: 13px;
                    color: #333;
                    border: none;
                    background: none;
                    width: 100%;
                    text-align: left;
                }

                .sidebar-item:hover {
                    background: #d0d0d0;
                }

                .sidebar-item.active {
                    background: #007AFF;
                    color: white;
                }

                .sidebar-item .icon {
                    margin-right: 8px;
                    font-size: 16px;
                }

                .content {
                    flex: 1;
                    padding: 20px;
                    overflow-y: auto;
                    position: relative;
                }
            </style>

            <div class="settings-container">
                <div class="sidebar">
                    ${this.renderSidebarItems()}
                </div>

                <div class="content" id="content-area">
                    <!-- Dynamic content will be loaded here -->
                </div>
            </div>
        `;
    }

    renderSidebarItems() {
        if (!this.panelsConfig || this.panelsConfig.length === 0) {
            return '<div style="padding: 10px; color: #666;">Loading...</div>';
        }
        
        return this.panelsConfig.map((panel, index) => `
            <button class="sidebar-item ${index === 0 ? 'active' : ''}" data-panel="${panel.id}">
                <span class="icon">${panel.icon}</span>
                ${panel.label}
            </button>
        `).join('');
    }

    setupEventListeners() {
        this.shadowRoot.querySelectorAll('.sidebar-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const panel = e.target.closest('.sidebar-item').dataset.panel;
                this.setActiveSidebarItem(panel);
                this.loadPanel(panel);
            });
        });
    }

    setActiveSidebarItem(panelName) {
        this.shadowRoot.querySelectorAll('.sidebar-item').forEach(item => {
            if (item.dataset.panel === panelName) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }

    async loadPanel(panelName) {
        const contentArea = this.shadowRoot.getElementById('content-area');
        contentArea.innerHTML = ''; // Clear current content

        const panelConfig = this.panelsConfig.find(p => p.id === panelName);
        if (!panelConfig) {
            console.error('Unknown panel:', panelName);
            return;
        }

        try {
            await import(panelConfig.path);
            const component = document.createElement(panelConfig.tagName);
            contentArea.appendChild(component);
        } catch (error) {
            console.error(`Failed to load panel ${panelName}:`, error);
            contentArea.innerHTML = `<div style="color: red; padding: 20px;">Error loading panel: ${error.message}</div>`;
        }
    }
}

customElements.define('system-preferences-shell', SystemPreferencesShell);
