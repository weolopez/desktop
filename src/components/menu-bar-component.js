class MenuBarComponent extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.activeApp = 'Finder';
    }

    connectedCallback() {
        this.render();
        this.setupEventListeners();
        this.updateTime();
        this.timeInterval = setInterval(() => this.updateTime(), 1000);
    }

    disconnectedCallback() {
        if (this.timeInterval) {
            clearInterval(this.timeInterval);
        }
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    width: 100%;
                    height: 24px;
                    position: relative;
                    z-index: 1000;
                }

                .menu-bar {
                    display: flex;
                    align-items: center;
                    height: 100%;
                    background: rgba(246, 246, 246, 0.8);
                    backdrop-filter: blur(20px);
                    border-bottom: 1px solid rgba(0, 0, 0, 0.1);
                    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
                    font-size: 13px;
                    font-weight: 400;
                    user-select: none;
                }

                .menu-left {
                    display: flex;
                    align-items: center;
                    flex: 1;
                }

                .menu-right {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding-right: 12px;
                }

                .apple-menu {
                    display: flex;
                    align-items: center;
                    padding: 0 12px;
                    height: 100%;
                    cursor: pointer;
                    transition: background-color 0.1s ease;
                }

                .apple-menu:hover {
                    background-color: rgba(0, 0, 0, 0.1);
                }

                .apple-logo {
                    font-size: 14px;
                    color: #1d1d1f;
                }
                
                .apple-logo::before {
                    content: "🍎";
                }

                .app-name {
                    font-weight: 600;
                    color: #1d1d1f;
                    padding: 0 12px;
                    height: 100%;
                    display: flex;
                    align-items: center;
                }

                .menu-item {
                    padding: 0 12px;
                    height: 100%;
                    display: flex;
                    align-items: center;
                    cursor: pointer;
                    color: #1d1d1f;
                    transition: background-color 0.1s ease;
                }

                .menu-item:hover {
                    background-color: rgba(0, 122, 255, 0.8);
                    color: white;
                }

                .status-item {
                    display: flex;
                    align-items: center;
                    padding: 0 8px;
                    height: 18px;
                    cursor: pointer;
                    border-radius: 4px;
                    transition: background-color 0.1s ease;
                    color: #1d1d1f;
                    font-size: 13px;
                }

                .status-item:hover {
                    background-color: rgba(0, 0, 0, 0.1);
                }

                .time-display {
                    font-variant-numeric: tabular-nums;
                    min-width: 60px;
                    text-align: center;
                }

                .dropdown-menu {
                    position: absolute;
                    top: 100%;
                    left: 0;
                    background: rgba(255, 255, 255, 0.85);
                    backdrop-filter: blur(20px);
                    border-radius: 8px;
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
                    padding: 4px 0;
                    min-width: 200px;
                    display: none;
                    z-index: 10001;
                }

                .dropdown-item {
                    padding: 6px 16px;
                    cursor: pointer;
                    color: #1d1d1f;
                    transition: background-color 0.1s ease;
                    font-size: 13px;
                }

                .dropdown-item:hover {
                    background-color: rgba(0, 122, 255, 0.8);
                    color: white;
                }

                .dropdown-separator {
                    height: 1px;
                    background: rgba(0, 0, 0, 0.1);
                    margin: 4px 0;
                }
            </style>

            <div class="menu-bar">
                <div class="menu-left">
                    <div class="apple-menu" data-menu="apple">
                        <span class="apple-logo"></span>
                    </div>
                    <div class="app-name">${this.activeApp}</div>
                    <div class="menu-item" data-menu="file">File</div>
                    <div class="menu-item" data-menu="edit">Edit</div>
                    <div class="menu-item" data-menu="view">View</div>
                    <div class="menu-item" data-menu="go">Go</div>
                    <div class="menu-item" data-menu="window">Window</div>
                    <div class="menu-item" data-menu="help">Help</div>
                </div>
                
                <div class="menu-right">
                    <div class="status-item">🔋</div>
                    <div class="status-item">📶</div>
                    <div class="status-item">🔍</div>
                    <div class="status-item">
                        <span class="time-display" id="timeDisplay"></span>
                    </div>
                </div>
            </div>

            <div class="dropdown-menu" id="appleMenu">
                <div class="dropdown-item">About This Mac</div>
                <div class="dropdown-separator"></div>
                <div class="dropdown-item">System Preferences...</div>
                <div class="dropdown-item">App Store...</div>
                <div class="dropdown-separator"></div>
                <div class="dropdown-item">Recent Items</div>
                <div class="dropdown-separator"></div>
                <div class="dropdown-item">Force Quit...</div>
                <div class="dropdown-separator"></div>
                <div class="dropdown-item">Sleep</div>
                <div class="dropdown-item">Restart...</div>
                <div class="dropdown-item">Shut Down...</div>
                <div class="dropdown-separator"></div>
                <div class="dropdown-item">Log Out...</div>
            </div>

            <div class="dropdown-menu" id="fileMenu">
                <div class="dropdown-item">New Folder</div>
                <div class="dropdown-item">New Folder with Selection</div>
                <div class="dropdown-item">New Smart Folder</div>
                <div class="dropdown-item">New Tab</div>
                <div class="dropdown-item">New Window</div>
                <div class="dropdown-separator"></div>
                <div class="dropdown-item">Open</div>
                <div class="dropdown-item">Open With</div>
                <div class="dropdown-separator"></div>
                <div class="dropdown-item">Close Window</div>
            </div>

            <div class="dropdown-menu" id="editMenu">
                <div class="dropdown-item">Undo</div>
                <div class="dropdown-item">Redo</div>
                <div class="dropdown-separator"></div>
                <div class="dropdown-item">Cut</div>
                <div class="dropdown-item">Copy</div>
                <div class="dropdown-item">Paste</div>
                <div class="dropdown-item">Select All</div>
            </div>

            <div class="dropdown-menu" id="viewMenu">
                <div class="dropdown-item">as Icons</div>
                <div class="dropdown-item">as List</div>
                <div class="dropdown-item">as Columns</div>
                <div class="dropdown-item">as Gallery</div>
                <div class="dropdown-separator"></div>
                <div class="dropdown-item">Show Tab Bar</div>
                <div class="dropdown-item">Show All Tabs</div>
                <div class="dropdown-separator"></div>
                <div class="dropdown-item">Show Status Bar</div>
                <div class="dropdown-item">Show Sidebar</div>
                <div class="dropdown-item">Show Preview</div>
            </div>

            <div class="dropdown-menu" id="goMenu">
                <div class="dropdown-item">Back</div>
                <div class="dropdown-item">Forward</div>
                <div class="dropdown-item">Enclosing Folder</div>
                <div class="dropdown-separator"></div>
                <div class="dropdown-item">Recents</div>
                <div class="dropdown-item">Documents</div>
                <div class="dropdown-item">Desktop</div>
                <div class="dropdown-item">Downloads</div>
                <div class="dropdown-item">Home</div>
                <div class="dropdown-item">Applications</div>
                <div class="dropdown-item">Utilities</div>
            </div>

            <div class="dropdown-menu" id="windowMenu">
                <div class="dropdown-item">Minimize</div>
                <div class="dropdown-item">Zoom</div>
                <div class="dropdown-separator"></div>
                <div class="dropdown-item">Move to Trash</div>
                <div class="dropdown-separator"></div>
                <div class="dropdown-item">Bring All to Front</div>
            </div>

            <div class="dropdown-menu" id="helpMenu">
                <div class="dropdown-item">Finder Help</div>
            </div>
        `;
    }

    setupEventListeners() {
        // Listen for app launch events on the parent (desktop-component)
        this.getRootNode().host.addEventListener('app-launched', (e) => {
            this.setActiveApp(e.detail.appName);
        });

        this.getRootNode().host.addEventListener('window-focused', (e) => {
            this.setActiveApp(e.detail.appName);
        });

        // Menu item clicks
        this.shadowRoot.addEventListener('click', (e) => {
            if (e.target.hasAttribute('data-menu')) {
                const menuType = e.target.getAttribute('data-menu');
                this.toggleDropdown(menuType, e.target);
            }

            // Close all dropdowns when clicking elsewhere
            if (!e.target.hasAttribute('data-menu')) {
                this.hideAllDropdowns();
            }
        });

        // Hide dropdowns when clicking outside
        document.addEventListener('click', (e) => {
            if (!this.contains(e.target)) {
                this.hideAllDropdowns();
            }
        });
    }

    toggleDropdown(menuType, element) {
        this.hideAllDropdowns();
        
        const dropdown = this.shadowRoot.getElementById(`${menuType}Menu`);
        if (dropdown) {
            const rect = element.getBoundingClientRect();
            dropdown.style.left = `${rect.left}px`;
            dropdown.style.display = 'block';
        }
    }

    hideAllDropdowns() {
        const dropdowns = this.shadowRoot.querySelectorAll('.dropdown-menu');
        dropdowns.forEach(dropdown => {
            dropdown.style.display = 'none';
        });
    }

    updateTime() {
        const now = new Date();
        const timeString = now.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
        
        const timeDisplay = this.shadowRoot.getElementById('timeDisplay');
        if (timeDisplay) {
            timeDisplay.textContent = timeString;
        }
    }

    setActiveApp(appName) {
        this.activeApp = appName;
        const appNameElement = this.shadowRoot.querySelector('.app-name');
        if (appNameElement) {
            appNameElement.textContent = appName;
        }
    }
}

customElements.define('menu-bar-component', MenuBarComponent);