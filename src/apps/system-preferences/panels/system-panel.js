import { BasePanel } from './base-panel.js';

class SystemPanel extends BasePanel {
    constructor() {
        super();
        this.currentConfig = null;
        this.saveToLocalStorage = true;
    }

    getStyles() {
        return `
            ${super.getStyles()}
            
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
        `;
    }

    getTemplate() {
        return `
            <h2>System</h2>
            
            <div id="startup-config-container">
                <!-- Startup configuration will be dynamically generated here -->
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
        `;
    }

    async loadSettings() {
        this.currentConfig = await this.loadSystemConfig();
        this.renderStartupConfig(this.currentConfig);

        // Load storage preference
        const storedPreference = localStorage.getItem('system-preferences-save-to-localstorage');
        this.saveToLocalStorage = storedPreference !== 'false';
        this.shadowRoot.getElementById('save-to-localstorage').checked = this.saveToLocalStorage;

        // Update status metrics
        this.shadowRoot.getElementById('config-source').textContent = this.saveToLocalStorage ? 'localStorage' : 'config.json';
        this.updateEnabledComponentsCount();
        this.updateStartupMetrics();
    }

    setupEventListeners() {
        // System panel event delegation for dynamic content
        const startupConfigContainer = this.shadowRoot.getElementById('startup-config-container');
        startupConfigContainer.addEventListener('change', (e) => {
            if (e.target.matches('.component-toggle')) {
                const componentName = e.target.dataset.component;
                this.updateComponentSetting(componentName, 'enabled', e.target.checked);
            } else if (e.target.matches('.phase-parallel-toggle')) {
                const phaseName = e.target.dataset.phase;
                this.updatePhaseSetting(phaseName, 'parallel', e.target.checked);
            }
        });

        startupConfigContainer.addEventListener('input', (e) => {
            if (e.target.matches('.component-priority-input')) {
                const componentName = e.target.dataset.component;
                this.updateComponentSetting(componentName, 'priority', parseInt(e.target.value));
            }
        });

        this.shadowRoot.getElementById('save-to-localstorage').addEventListener('change', (e) => {
            this.saveToLocalStorage = e.target.checked;
            localStorage.setItem('system-preferences-save-to-localstorage', this.saveToLocalStorage);
            
            if (this.saveToLocalStorage) {
                this.saveSettingsToLocalStorage();
                alert('Settings saved to localStorage! Changes will take effect immediately.');
            } else {
                this.clearLocalStorageSettings();
                alert('localStorage settings cleared. Using config.json defaults on next refresh.');
            }
            
            this.shadowRoot.getElementById('config-source').textContent = this.saveToLocalStorage ? 'localStorage' : 'config.json';
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
    }

    // ... Helper functions for system panel ...

    async loadSystemConfig() {
        const storedConfig = this.loadSettingsFromLocalStorage();
        if (storedConfig) {
            console.log('Loaded startup config from localStorage');
            return storedConfig;
        }

        try {
            const response = await fetch('/desktop/config.json');
            const config = await response.json();
            console.log('Loaded startup config from config.json');
            return config;
        } catch (error) {
            console.error('Failed to load config.json, using default config:', error);
            return this.getDefaultConfig();
        }
    }

    getDefaultConfig() {
        return {
            startup: {
                phases: [
                    {
                        name: "critical",
                        parallel: false,
                        components: [
                            { name: "AppService", required: true, priority: 1, enabled: true },
                            { name: "WindowManager", dependencies: ["AppService"], required: true, priority: 1, enabled: true }
                        ]
                    },
                    {
                        name: "ui",
                        parallel: true,
                        waitFor: "critical",
                        components: [
                            { name: "ContextMenuManager", required: true, priority: 2, enabled: false },
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
        if (!this.currentConfig) return;

        const keys = path.split('.');
        let current = this.currentConfig;
        for (let i = 0; i < keys.length - 1; i++) {
            current = current[keys[i]];
            if (!current) return;
        }
        current[keys[keys.length - 1]] = value;

        this.updateEnabledComponentsCount();
        if (this.saveToLocalStorage) {
            this.saveSettingsToLocalStorage();
        }
    }

    updateComponentSetting(componentName, key, value) {
        if (!this.currentConfig) return;
        for (const phase of this.currentConfig.startup.phases) {
            const component = phase.components.find(c => c.name === componentName);
            if (component) {
                component[key] = value;
                break;
            }
        }
        this.updateEnabledComponentsCount();
        if (this.saveToLocalStorage) {
            this.saveSettingsToLocalStorage();
        }
    }

    updatePhaseSetting(phaseName, key, value) {
        if (!this.currentConfig) return;
        const phase = this.currentConfig.startup.phases.find(p => p.name === phaseName);
        if (phase) {
            phase[key] = value;
        }
        if (this.saveToLocalStorage) {
            this.saveSettingsToLocalStorage();
        }
    }

    updateEnabledComponentsCount() {
        if (!this.currentConfig) return;
        let enabledCount = 0;
        let totalCount = 0;
        this.currentConfig.startup.phases.forEach(phase => {
            phase.components.forEach(component => {
                totalCount++;
                if (component.enabled) {
                    enabledCount++;
                }
            });
        });
        this.shadowRoot.getElementById('enabled-components').textContent = `${enabledCount} / ${totalCount}`;
    }

    saveSettingsToLocalStorage() {
        if (this.currentConfig) {
            localStorage.setItem('startup-config-override', JSON.stringify(this.currentConfig));
        }
    }

    loadSettingsFromLocalStorage() {
        const storedConfig = localStorage.getItem('startup-config-override');
        return storedConfig ? JSON.parse(storedConfig) : null;
    }

    clearLocalStorageSettings() {
        localStorage.removeItem('startup-config-override');
    }

    async saveConfigToFile() {
        try {
            const configString = JSON.stringify(this.currentConfig, null, 2);
            const blob = new Blob([configString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
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
            this.desktopComponent.startupManager.config = this.currentConfig;
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
        
        await this.loadSettings();
        alert('Configuration reset to defaults and saved to localStorage.');
    }

    updateStartupMetrics() {
        if (this.desktopComponent && this.desktopComponent.startupManager) {
            const metrics = this.desktopComponent.startupManager.getStartupMetrics();
            this.shadowRoot.getElementById('last-startup-time').textContent = metrics.totalTime ? `${metrics.totalTime.toFixed(2)}ms` : '--';
            this.shadowRoot.getElementById('components-loaded').textContent = metrics.componentsLoaded || '--';
            this.shadowRoot.getElementById('phases-completed').textContent = metrics.phasesCompleted ? metrics.phasesCompleted.join(', ') : '--';
        }
    }

    renderStartupConfig(config) {
        const container = this.shadowRoot.getElementById('startup-config-container');
        if (!config || !config.startup) {
            container.innerHTML = '<p>Error: Invalid startup configuration.</p>';
            return;
        }

        const { phases, performance } = config.startup;

        let html = '<h3>Startup Configuration</h3>';

        html += `
            <h4>Performance</h4>
            <div class="form-group">
                <label for="max-concurrent-loads">Max Concurrent Loads: <span id="concurrent-loads-value">${performance.maxConcurrentLoads}</span></label>
                <input type="range" id="max-concurrent-loads" min="1" max="10" value="${performance.maxConcurrentLoads}">
            </div>
            <div class="form-group">
                <label for="startup-timeout">Timeout (ms): <span id="timeout-value">${performance.timeoutMs}</span></label>
                <input type="range" id="startup-timeout" min="1000" max="20000" step="1000" value="${performance.timeoutMs}">
            </div>
        `;

        phases.forEach(phase => {
            html += `
                <h4>
                    Phase: ${phase.name}
                    <label style="font-weight: normal; font-size: 12px; margin-left: 10px;">
                        <input type="checkbox" class="phase-parallel-toggle" data-phase="${phase.name}" ${phase.parallel ? 'checked' : ''}>
                        Run in Parallel
                    </label>
                </h4>
            `;
            phase.components
                // Hide any legacy/removed components from being rendered in UI
                .filter(component => component.name !== "WallpaperManager")
                .forEach(component => {
                    html += `
                        <div class="form-group" style="display: flex; align-items: center; justify-content: space-between;">
                            <label>
                                <input type="checkbox" class="component-toggle" data-component="${component.name}" ${component.enabled ? 'checked' : ''} ${component.required ? 'disabled' : ''}>
                                ${component.name} ${component.required ? '(required)' : ''}
                            </label>
                            <span>
                                Priority:
                                <input type="number" class="component-priority-input" data-component="${component.name}" value="${component.priority}" style="width: 60px;">
                            </span>
                        </div>
                    `;
                });
        });

        container.innerHTML = html;

        // Re-attach event listeners for performance sliders
        const maxConcurrentLoads = this.shadowRoot.getElementById('max-concurrent-loads');
        if (maxConcurrentLoads) {
            maxConcurrentLoads.addEventListener('input', (e) => {
                this.shadowRoot.getElementById('concurrent-loads-value').textContent = e.target.value;
                this.updateConfigSetting('startup.performance.maxConcurrentLoads', parseInt(e.target.value));
            });
        }

        const startupTimeout = this.shadowRoot.getElementById('startup-timeout');
        if (startupTimeout) {
            startupTimeout.addEventListener('input', (e) => {
                this.shadowRoot.getElementById('timeout-value').textContent = e.target.value;
                this.updateConfigSetting('startup.performance.timeoutMs', parseInt(e.target.value));
            });
        }
    }
}

customElements.define('sys-pref-system-panel', SystemPanel);
