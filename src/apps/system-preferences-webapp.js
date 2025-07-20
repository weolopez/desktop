class SystemPreferencesWebapp extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.desktopComponent = null;
        this.saveToLocalStorage = true; // Default to localStorage
        this.currentConfig = null;
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
                    margin: 20px 0 15px 0;
                    font-size: 16px;
                    font-weight: 600;
                    color: #333;
                }

                h4 {
                    margin: 15px 0 10px 0;
                    font-size: 14px;
                    font-weight: 600;
                    color: #666;
                }

                small {
                    display: block;
                    margin-top: 4px;
                    font-size: 11px;
                    color: #666;
                }

                .primary-button {
                    background: #007AFF;
                    color: white;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 6px;
                    font-size: 13px;
                    cursor: pointer;
                    margin-right: 8px;
                }

                .primary-button:hover {
                    background: #0056CC;
                }

                .secondary-button {
                    background: #f0f0f0;
                    color: #333;
                    border: 1px solid #ccc;
                    padding: 8px 16px;
                    border-radius: 6px;
                    font-size: 13px;
                    cursor: pointer;
                }

                .secondary-button:hover {
                    background: #e0e0e0;
                }

                input[type="range"] {
                    width: 200px;
                    margin: 0 8px;
                }

                .metric {
                    display: flex;
                    justify-content: space-between;
                    padding: 4px 0;
                    border-bottom: 1px solid #eee;
                }

                .metric-label {
                    font-weight: 500;
                    color: #333;
                }

                .metric-value {
                    color: #007AFF;
                    font-family: 'Monaco', monospace;
                    font-size: 12px;
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
                    <button class="sidebar-item" data-panel="system">
                        <span class="icon">⚙️</span>
                        System
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

                    <div class="panel" id="system-panel">
                        <h2>System</h2>
                        
                        <h3>Startup Configuration</h3>
                        <div class="form-group">
                            <label>
                                <input type="checkbox" id="enable-notifications" checked>
                                Enable notification system
                            </label>
                            <small>Loads notification service during startup</small>
                        </div>
                        
                        <div class="form-group">
                            <label>
                                <input type="checkbox" id="enable-event-monitor" checked>
                                Enable event monitoring
                            </label>
                            <small>Loads event monitor for debugging</small>
                        </div>

                        <div class="form-group">
                            <label for="max-concurrent-loads">Max concurrent component loads:</label>
                            <input type="range" id="max-concurrent-loads" min="1" max="8" value="3">
                            <span id="concurrent-loads-value">3</span>
                            <small>Controls how many components load in parallel during startup</small>
                        </div>

                        <div class="form-group">
                            <label for="startup-timeout">Component load timeout (ms):</label>
                            <input type="range" id="startup-timeout" min="1000" max="10000" step="500" value="5000">
                            <span id="timeout-value">5000</span>
                            <small>How long to wait for components to load before giving up</small>
                        </div>

                        <div class="form-group">
                            <label>
                                <input type="checkbox" id="save-to-localstorage" checked>
                                Save settings to localStorage (takes effect immediately)
                            </label>
                            <small>When enabled, settings are saved locally and override config.json</small>
                        </div>

                        <div class="form-group">
                            <button id="save-config-btn" class="primary-button">Download config.json</button>
                            <button id="apply-settings-btn" class="primary-button">Apply Settings Now</button>
                            <button id="reset-config-btn" class="secondary-button">Reset to Defaults</button>
                        </div>

                        <div class="form-group">
                            <h4>Configuration Status</h4>
                            <div class="metric">
                                <span class="metric-label">Configuration source:</span>
                                <span class="metric-value" id="config-source">--</span>
                            </div>
                            <div class="metric">
                                <span class="metric-label">Components enabled:</span>
                                <span class="metric-value" id="enabled-components">--</span>
                            </div>
                        </div>

                        <div class="form-group">
                            <h4>Current Startup Metrics</h4>
                            <div id="startup-metrics">
                                <div class="metric">
                                    <span class="metric-label">Last startup time:</span>
                                    <span class="metric-value" id="last-startup-time">--</span>
                                </div>
                                <div class="metric">
                                    <span class="metric-label">Components loaded:</span>
                                    <span class="metric-value" id="components-loaded">--</span>
                                </div>
                                <div class="metric">
                                    <span class="metric-label">Phases completed:</span>
                                    <span class="metric-value" id="phases-completed">--</span>
                                </div>
                            </div>
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
                this.logEventFlow("APP", e);
                this.switchPanel(e.target.closest('.sidebar-item').dataset.panel);
            });
        });

        // Wallpaper selection
        this.shadowRoot.querySelectorAll('.wallpaper-option').forEach(option => {
            option.addEventListener('click', (e) => {
                this.logEventFlow("APP", e);
                const wallpaper = e.target.dataset.wallpaper;
                this.updateWallpaper(wallpaper);
            });
        });

        // Form controls
        this.shadowRoot.getElementById('dock-position').addEventListener('change', (e) => {
            this.logEventFlow("APP", e);
            this.updateDockPosition(e.target.value);
        });

        this.shadowRoot.getElementById('grid-snap').addEventListener('change', (e) => {
            this.logEventFlow("APP", e);
            this.updateGridSnap(e.target.checked);
        });

        this.shadowRoot.getElementById('show-desktop-icons').addEventListener('change', (e) => {
            this.logEventFlow("APP", e);
            this.updateDesktopIcons(e.target.checked);
        });

        this.shadowRoot.getElementById('accent-color').addEventListener('change', (e) => {
            this.logEventFlow("APP", e);
            this.updateAccentColor(e.target.value);
        });

        this.shadowRoot.getElementById('notification-sounds').addEventListener('change', (e) => {
            this.logEventFlow("APP", e);
            this.updateNotificationSounds(e.target.checked);
        });

        // System panel event listeners
        this.shadowRoot.getElementById('enable-notifications').addEventListener('change', (e) => {
            this.updateConfigSetting('notifications.enabled', e.target.checked);
        });

        this.shadowRoot.getElementById('enable-event-monitor').addEventListener('change', (e) => {
            this.updateConfigSetting('eventMonitoring.enabled', e.target.checked);
        });

        this.shadowRoot.getElementById('max-concurrent-loads').addEventListener('input', (e) => {
            this.shadowRoot.getElementById('concurrent-loads-value').textContent = e.target.value;
            this.updateConfigSetting('performance.maxConcurrentLoads', parseInt(e.target.value));
        });

        this.shadowRoot.getElementById('startup-timeout').addEventListener('input', (e) => {
            this.shadowRoot.getElementById('timeout-value').textContent = e.target.value;
            this.updateConfigSetting('performance.timeoutMs', parseInt(e.target.value));
        });

        this.shadowRoot.getElementById('save-to-localstorage').addEventListener('change', (e) => {
            this.saveToLocalStorage = e.target.checked;
            if (this.saveToLocalStorage) {
                this.saveSettingsToLocalStorage();
                alert('Settings saved to localStorage! Changes will take effect immediately.');
            } else {
                this.clearLocalStorageSettings();
                alert('localStorage settings cleared. Using config.json defaults on next refresh.');
            }
        });

        this.shadowRoot.getElementById('save-config-btn').addEventListener('click', () => {
            this.saveConfigToFile();
        });

        this.shadowRoot.getElementById('apply-settings-btn').addEventListener('click', () => {
            this.applySettingsNow();
        });

        this.shadowRoot.getElementById('reset-config-btn').addEventListener('click', () => {
            this.resetConfigToDefaults();
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

        // Refresh system settings when system panel is opened
        if (panelName === 'system') {
            // Force reload from localStorage to get the most current state
            this.currentConfig = null;
            this.loadSystemSettings();
        }
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

        // Load system settings
        this.loadSystemSettings();
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

    // System configuration methods
    async loadSystemConfig() {
        // First try to load from localStorage (highest priority)
        if (this.loadSettingsFromLocalStorage()) {
            return this.currentConfig;
        }
        
        // Fall back to config.json
        try {
            const response = await fetch('./config.json');
            this.currentConfig = await response.json();
            console.log('📄 Startup configuration loaded from config.json');
            return this.currentConfig;
        } catch (error) {
            console.warn('Failed to load config.json:', error);
            this.currentConfig = this.getDefaultConfig();
            console.log('⚙️ Using default startup configuration');
            return this.currentConfig;
        }
    }

    getDefaultConfig() {
        return {
            startup: {
                phases: [
                    {
                        name: "critical",
                        parallel: true,
                        components: [
                            { name: "AppService", required: true, priority: 1, enabled: true },
                            { name: "WallpaperManager", required: true, priority: 1, enabled: true },
                            { name: "WindowManager", dependencies: ["AppService"], required: true, priority: 1, enabled: true }
                        ]
                    },
                    {
                        name: "ui",
                        parallel: true,
                        waitFor: "critical",
                        components: [
                            { name: "ContextMenuManager", dependencies: ["WallpaperManager"], required: true, priority: 2, enabled: true },
                            { name: "DockComponent", required: true, priority: 2, enabled: true, isWebComponent: true }
                        ]
                    },
                    {
                        name: "optional",
                        parallel: true,
                        waitFor: "ui",
                        defer: true,
                        components: [
                            { name: "NotificationService", required: false, priority: 3, enabled: true, fallbackGraceful: true, includeDisplayComponent: true },
                            { name: "EventMonitor", required: false, priority: 3, enabled: true }
                        ]
                    }
                ],
                performance: {
                    enableLazyLoading: true,
                    maxConcurrentLoads: 3,
                    timeoutMs: 5000,
                    retryAttempts: 2
                },
                features: {
                    notifications: { enabled: true },
                    eventMonitoring: { enabled: true }
                }
            }
        };
    }

    updateConfigSetting(path, value) {
        if (!this.currentConfig) {
            this.currentConfig = this.getDefaultConfig();
        }

        // Set nested property using dot notation
        const keys = path.split('.');
        let obj = this.currentConfig.startup;
        
        for (let i = 0; i < keys.length - 1; i++) {
            if (!obj[keys[i]]) {
                obj[keys[i]] = {};
            }
            obj = obj[keys[i]];
        }
        
        obj[keys[keys.length - 1]] = value;
        
        // Update component enable state directly for component-level settings
        if (path === 'notifications.enabled') {
            const notificationComponent = this.findComponentInConfig('NotificationService');
            if (notificationComponent) {
                notificationComponent.enabled = value;
            }
            // Also update features for backward compatibility
            if (!obj.features) obj.features = {};
            if (!obj.features.notifications) obj.features.notifications = {};
            obj.features.notifications.enabled = value;
        } else if (path === 'eventMonitoring.enabled') {
            const eventMonitorComponent = this.findComponentInConfig('EventMonitor');
            if (eventMonitorComponent) {
                eventMonitorComponent.enabled = value;
            }
            // Also update features for backward compatibility
            if (!obj.features) obj.features = {};
            if (!obj.features.eventMonitoring) obj.features.eventMonitoring = {};
            obj.features.eventMonitoring.enabled = value;
        }

        // Auto-save to localStorage if enabled
        if (this.saveToLocalStorage) {
            this.saveSettingsToLocalStorage();
            // Refresh the enabled components count after saving
            this.updateEnabledComponentsCount();
        }
    }

    findComponentInConfig(componentName) {
        for (const phase of this.currentConfig.startup.phases) {
            const component = phase.components.find(c => c.name === componentName);
            if (component) return component;
        }
        return null;
    }

    updateEnabledComponentsCount() {
        if (!this.currentConfig) return;
        
        // Count enabled components across all phases
        let enabledCount = 0;
        let totalCount = 0;
        for (const phase of this.currentConfig.startup.phases) {
            totalCount += phase.components.length;
            enabledCount += phase.components.filter(c => c.enabled !== false).length;
        }
        this.shadowRoot.getElementById('enabled-components').textContent = `${enabledCount}/${totalCount}`;
    }

    saveSettingsToLocalStorage() {
        try {
            localStorage.setItem('startup-config-override', JSON.stringify(this.currentConfig));
            console.log('📦 Startup configuration saved to localStorage');
            console.log('🔍 DEBUG: NotificationService enabled:', this.findComponentInConfig('NotificationService')?.enabled);
            console.log('🔍 DEBUG: EventMonitor enabled:', this.findComponentInConfig('EventMonitor')?.enabled);
        } catch (error) {
            console.error('Failed to save to localStorage:', error);
        }
    }

    loadSettingsFromLocalStorage() {
        try {
            const stored = localStorage.getItem('startup-config-override');
            if (stored) {
                this.currentConfig = JSON.parse(stored);
                console.log('📦 Startup configuration loaded from localStorage');
                console.log('🔍 DEBUG: Loaded NotificationService enabled:', this.findComponentInConfig('NotificationService')?.enabled);
                console.log('🔍 DEBUG: Loaded EventMonitor enabled:', this.findComponentInConfig('EventMonitor')?.enabled);
                return true;
            }
        } catch (error) {
            console.error('Failed to load from localStorage:', error);
        }
        return false;
    }

    clearLocalStorageSettings() {
        localStorage.removeItem('startup-config-override');
        console.log('📦 Startup configuration cleared from localStorage');
    }

    async saveConfigToFile() {
        try {
            const configBlob = new Blob([JSON.stringify(this.currentConfig, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(configBlob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = 'config.json';
            a.click();
            
            URL.revokeObjectURL(url);
            
            alert('Configuration downloaded! Replace the existing config.json file to make these the default settings.');
        } catch (error) {
            alert('Failed to save configuration: ' + error.message);
        }
    }

    async applySettingsNow() {
        if (this.desktopComponent && this.desktopComponent.startupManager) {
            // Update the startup manager's config
            this.desktopComponent.startupManager.config = this.currentConfig;
            // Save to localStorage if enabled
            if (this.saveToLocalStorage) {
                this.saveSettingsToLocalStorage();
            } else {
                this.clearLocalStorageSettings();
            }            
            alert('Settings applied! Changes will take effect on next startup/refresh.');
        } else {
            alert('Unable to apply settings: StartupManager not found.');
        }
    }

    async resetConfigToDefaults() {
        this.currentConfig = this.getDefaultConfig();
        
        if (this.saveToLocalStorage) {
            this.saveSettingsToLocalStorage();
        } else {
            this.clearLocalStorageSettings();
        }
        
        await this.loadSystemSettings();
        alert('Configuration reset to defaults and saved to localStorage.');
    }

    async loadSystemSettings() {
        const config = await this.loadSystemConfig();
        
        // Check if we have localStorage settings and update checkbox
        const hasLocalStorage = localStorage.getItem('startup-config-override') !== null;
        this.saveToLocalStorage = hasLocalStorage;
        this.shadowRoot.getElementById('save-to-localstorage').checked = hasLocalStorage;
        
        // Update configuration source indicator
        this.shadowRoot.getElementById('config-source').textContent = hasLocalStorage ? 
            'localStorage (highest priority)' : 'config.json (default)';

        // Count enabled components across all phases
        let enabledCount = 0;
        let totalCount = 0;
        for (const phase of config.startup.phases) {
            totalCount += phase.components.length;
            enabledCount += phase.components.filter(c => c.enabled !== false).length;
        }
        this.shadowRoot.getElementById('enabled-components').textContent = `${enabledCount}/${totalCount}`;
        
        // Update UI with current config values based on actual component enabled state
        const notificationComponent = this.findComponentInConfig('NotificationService');
        if (notificationComponent) {
            this.shadowRoot.getElementById('enable-notifications').checked = notificationComponent.enabled !== false;
        }
        
        const eventMonitorComponent = this.findComponentInConfig('EventMonitor');
        if (eventMonitorComponent) {
            this.shadowRoot.getElementById('enable-event-monitor').checked = eventMonitorComponent.enabled !== false;
        }
        
        if (config.startup.performance) {
            this.shadowRoot.getElementById('max-concurrent-loads').value = config.startup.performance.maxConcurrentLoads || 3;
            this.shadowRoot.getElementById('concurrent-loads-value').textContent = config.startup.performance.maxConcurrentLoads || 3;
            
            this.shadowRoot.getElementById('startup-timeout').value = config.startup.performance.timeoutMs || 5000;
            this.shadowRoot.getElementById('timeout-value').textContent = config.startup.performance.timeoutMs || 5000;
        }

        // Load startup metrics if available
        if (this.desktopComponent && this.desktopComponent.startupManager) {
            const metrics = this.desktopComponent.startupManager.getStartupMetrics();
            this.shadowRoot.getElementById('last-startup-time').textContent = `${metrics.totalTime.toFixed(2)}ms`;
            this.shadowRoot.getElementById('components-loaded').textContent = metrics.componentsLoaded;
            this.shadowRoot.getElementById('phases-completed').textContent = metrics.phasesCompleted.join(', ');
        }
    }

    logEventFlow(level, event) {
        const timestamp = Date.now();
        const targetInfo = {
            tagName: event.target.tagName?.toLowerCase() || 'unknown',
            className: event.target.className || '',
            id: event.target.id || '',
            textContent: event.target.textContent?.slice(0, 30) || ''
        };
        
        console.log(`🖱️ [${level}] Event received at ${timestamp}:`, {
            type: event.type,
            target: targetInfo,
            bubbles: event.bubbles,
            composed: event.composed,
            eventPhase: event.eventPhase,
            currentTarget: event.currentTarget.constructor.name,
            appName: 'System Preferences'
        });
        
        // Store event flow data for global access
        if (!window.eventFlowTest) {
            window.eventFlowTest = { events: [] };
        }
        window.eventFlowTest.events.push({
            level,
            timestamp,
            type: event.type,
            target: targetInfo,
            eventPhase: event.eventPhase,
            appName: 'System Preferences'
        });
    }
}

customElements.define('system-preferences-webapp', SystemPreferencesWebapp);