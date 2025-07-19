class SystemPreferencesWebapp extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.desktopComponent = null;
    }

    connectedCallback() {
        // Find the desktop component to control
        this.desktopComponent = document.querySelector('desktop-component');
        this.render();
        this.setupEventListeners();
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    height: 100%;
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
                }

                .panel {
                    display: none;
                }

                .panel.active {
                    display: block;
                }

                .form-group {
                    margin-bottom: 16px;
                }

                .form-group label {
                    display: block;
                    font-weight: 500;
                    margin-bottom: 4px;
                    font-size: 13px;
                    color: #333;
                }

                .form-group select,
                .form-group input {
                    width: 200px;
                    padding: 6px 8px;
                    border: 1px solid #ccc;
                    border-radius: 4px;
                    font-size: 13px;
                }

                .form-group input[type="checkbox"] {
                    width: auto;
                    margin-right: 8px;
                }

                .form-group input[type="color"] {
                    width: 50px;
                    height: 30px;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                }

                .wallpaper-preview {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 10px;
                    margin-top: 10px;
                }

                .wallpaper-option {
                    width: 80px;
                    height: 50px;
                    border-radius: 4px;
                    cursor: pointer;
                    border: 2px solid transparent;
                    position: relative;
                }

                .wallpaper-option.selected {
                    border-color: #007AFF;
                }

                .wallpaper-option.gradient {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                }

                .wallpaper-option.monterey {
                    background: linear-gradient(135deg, #1e3c72 0%, #2a5298 50%, #764ba2 100%);
                }

                .wallpaper-option.big-sur {
                    background: linear-gradient(180deg, #ff9a9e 0%, #fecfef 50%, #fecfef 100%);
                }

                h2 {
                    margin: 0 0 20px 0;
                    font-size: 18px;
                    font-weight: 600;
                }

                h3 {
                    margin: 0 0 12px 0;
                    font-size: 14px;
                    font-weight: 500;
                    color: #666;
                }
            </style>

            <div class="settings-container">
                <div class="sidebar">
                    <button class="sidebar-item active" data-panel="desktop">
                        <span class="icon">🖥️</span>
                        Desktop & Dock
                    </button>
                    <button class="sidebar-item" data-panel="appearance">
                        <span class="icon">🎨</span>
                        Appearance
                    </button>
                    <button class="sidebar-item" data-panel="notifications">
                        <span class="icon">🔔</span>
                        Notifications
                    </button>
                </div>

                <div class="content">
                    <div class="panel active" id="desktop-panel">
                        <h2>Desktop & Dock</h2>
                        
                        <h3>Wallpaper</h3>
                        <div class="wallpaper-preview">
                            <div class="wallpaper-option gradient" data-wallpaper="gradient"></div>
                            <div class="wallpaper-option monterey" data-wallpaper="monterey"></div>
                            <div class="wallpaper-option big-sur" data-wallpaper="big-sur"></div>
                        </div>

                        <h3>Dock</h3>
                        <div class="form-group">
                            <label for="dock-position">Position:</label>
                            <select id="dock-position">
                                <option value="bottom">Bottom</option>
                                <option value="left">Left</option>
                                <option value="right">Right</option>
                            </select>
                        </div>

                        <h3>Desktop</h3>
                        <div class="form-group">
                            <label>
                                <input type="checkbox" id="grid-snap" checked>
                                Snap to grid
                            </label>
                        </div>
                        
                        <div class="form-group">
                            <label>
                                <input type="checkbox" id="show-desktop-icons" checked>
                                Show desktop icons
                            </label>
                        </div>
                    </div>

                    <div class="panel" id="appearance-panel">
                        <h2>Appearance</h2>
                        
                        <div class="form-group">
                            <label for="accent-color">Accent Color:</label>
                            <input type="color" id="accent-color" value="#007AFF">
                        </div>
                    </div>

                    <div class="panel" id="notifications-panel">
                        <h2>Notifications</h2>
                        
                        <div class="form-group">
                            <label>
                                <input type="checkbox" id="notification-sounds" checked>
                                Play notification sounds
                            </label>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    setupEventListeners() {
        // Sidebar navigation
        this.shadowRoot.querySelectorAll('.sidebar-item').forEach(item => {
            item.addEventListener('click', (e) => {
                this.switchPanel(e.target.closest('.sidebar-item').dataset.panel);
            });
        });

        // Wallpaper selection
        this.shadowRoot.querySelectorAll('.wallpaper-option').forEach(option => {
            option.addEventListener('click', (e) => {
                const wallpaper = e.target.dataset.wallpaper;
                this.updateWallpaper(wallpaper);
            });
        });

        // Form controls
        this.shadowRoot.getElementById('dock-position').addEventListener('change', (e) => {
            this.updateDockPosition(e.target.value);
        });

        this.shadowRoot.getElementById('grid-snap').addEventListener('change', (e) => {
            this.updateGridSnap(e.target.checked);
        });

        this.shadowRoot.getElementById('show-desktop-icons').addEventListener('change', (e) => {
            this.updateDesktopIcons(e.target.checked);
        });

        this.shadowRoot.getElementById('accent-color').addEventListener('change', (e) => {
            this.updateAccentColor(e.target.value);
        });

        this.shadowRoot.getElementById('notification-sounds').addEventListener('change', (e) => {
            this.updateNotificationSounds(e.target.checked);
        });

        // Load current values
        this.loadCurrentSettings();
    }

    switchPanel(panelName) {
        // Update sidebar
        this.shadowRoot.querySelectorAll('.sidebar-item').forEach(item => {
            item.classList.remove('active');
        });
        this.shadowRoot.querySelector(`[data-panel="${panelName}"]`).classList.add('active');

        // Update content
        this.shadowRoot.querySelectorAll('.panel').forEach(panel => {
            panel.classList.remove('active');
        });
        this.shadowRoot.getElementById(`${panelName}-panel`).classList.add('active');
    }

    loadCurrentSettings() {
        if (!this.desktopComponent) return;

        // Load wallpaper
        const currentWallpaper = this.desktopComponent.getAttribute('wallpaper') || 'gradient';
        this.shadowRoot.querySelectorAll('.wallpaper-option').forEach(option => {
            option.classList.toggle('selected', option.dataset.wallpaper === currentWallpaper);
        });

        // Load dock position
        const dockPosition = this.desktopComponent.getAttribute('dock-position') || 'bottom';
        this.shadowRoot.getElementById('dock-position').value = dockPosition;

        // Load checkboxes
        const gridSnap = this.desktopComponent.getAttribute('grid-snap') !== 'false';
        this.shadowRoot.getElementById('grid-snap').checked = gridSnap;

        const showIcons = this.desktopComponent.getAttribute('show-desktop-icons') !== 'false';
        this.shadowRoot.getElementById('show-desktop-icons').checked = showIcons;

        const notificationSounds = this.desktopComponent.getAttribute('notification-sounds') !== 'false';
        this.shadowRoot.getElementById('notification-sounds').checked = notificationSounds;

        // Load accent color
        const accentColor = this.desktopComponent.getAttribute('accent-color') || '#007AFF';
        this.shadowRoot.getElementById('accent-color').value = accentColor;
    }

    updateWallpaper(wallpaper) {
        if (this.desktopComponent) {
            this.desktopComponent.setAttribute('wallpaper', wallpaper);
        }
        
        // Update UI
        this.shadowRoot.querySelectorAll('.wallpaper-option').forEach(option => {
            option.classList.toggle('selected', option.dataset.wallpaper === wallpaper);
        });
    }

    updateDockPosition(position) {
        if (this.desktopComponent) {
            this.desktopComponent.setAttribute('dock-position', position);
        }
    }

    updateGridSnap(enabled) {
        if (this.desktopComponent) {
            this.desktopComponent.setAttribute('grid-snap', enabled.toString());
        }
    }

    updateDesktopIcons(visible) {
        if (this.desktopComponent) {
            this.desktopComponent.setAttribute('show-desktop-icons', visible.toString());
        }
    }

    updateAccentColor(color) {
        if (this.desktopComponent) {
            this.desktopComponent.setAttribute('accent-color', color);
        }
    }

    updateNotificationSounds(enabled) {
        if (this.desktopComponent) {
            this.desktopComponent.setAttribute('notification-sounds', enabled.toString());
        }
    }
}

customElements.define('system-preferences-webapp', SystemPreferencesWebapp);