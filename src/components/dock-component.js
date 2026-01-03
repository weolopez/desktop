import { MESSAGES } from '../events/message-types.js';
import eventBus from '../events/event-bus.js';
class DockComponent extends HTMLElement {
    constructor(confg) {
        super();
        this.attachShadow({ mode: 'open' });
        this.minimizedWindows = [];
    }

    async connectedCallback() {
        const configURL = this.getAttribute("config") || '/desktop/dock.js';
        const { APPS } = await import(configURL);

        this.apps = APPS.map(app => ({ ...app, running: app.id === 'finder' }));
        this.apps.filter(a => a.onstartup).forEach(a => this.launchApp(a));
        this.render();
        this.setupEventListeners();
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    pointer-events: auto;
                    width: fit-content;
                    margin: 0 auto;
                }

                .dock-container {
                    display: flex;
                    align-items: end;
                    justify-content: center;
                    padding: 8px 16px;
                    background: rgba(255, 255, 255, 0.2);
                    backdrop-filter: blur(20px);
                    border-radius: 16px;
                    border: 1px solid rgba(255, 255, 255, 0.3);
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
                    gap: 8px;
                    position: relative;
                }

                .dock-apps {
                    display: flex;
                    align-items: end;
                    gap: 16px;
                }

                .dock-separator {
                    width: 1px;
                    height: 32px;
                    background: rgba(255, 255, 255, 0.4);
                    margin: 0 4px;
                    align-self: end;
                }

                .dock-minimized {
                    display: flex;
                    align-items: end;
                    gap: 8px;
                }

                .dock-icon {
                    width: 40px;
                    height: 40px;
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: background 0.2s;
                    position: relative;
                    font-size: 24px;
                    user-select: none;
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    backdrop-filter: blur(10px);
                }

                .dock-icon:hover {
                    background: rgba(255, 255, 255, 0.2);
                }

                .dock-icon.running::after {
                    content: '';
                    position: absolute;
                    bottom: -12px;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 4px;
                    height: 4px;
                    background: #007AFF;
                    border-radius: 50%;
                }

                .dock-icon.minimized {
                    opacity: 0.7;
                    filter: brightness(0.8);
                }

                .dock-icon.minimized::before {
                    content: '';
                    position: absolute;
                    top: 4px;
                    right: 4px;
                    width: 8px;
                    height: 8px;
                    background: #FF9500;
                    border-radius: 50%;
                    border: 1px solid rgba(255, 255, 255, 0.5);
                }
            </style>

            <div class="dock-container">
                <div class="dock-apps">
                    ${this.apps.map(app => `
                        <div class="dock-icon ${app.running ? 'running' : ''}"
                             data-app-id="${app.id}"
                             data-app-url="${app.sourceUrl}"
                             data-app-name="${app.name}">
                            ${app.icon}
                        </div>
                    `).join('')}
                </div>
                
                ${this.minimizedWindows.length > 0 ? `
                    <div class="dock-separator"></div>
                    <div class="dock-minimized">
                        ${this.minimizedWindows.map(window => `
                            <div class="dock-icon minimized"
                                 data-window-id="${window.id}"
                                 data-app-name="${window.name}">
                                ${window.icon}
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
        `;
    }

    setupEventListeners() {
        this.shadowRoot.addEventListener('click', (e) => {
            const icon = e.target.closest('.dock-icon');
            if (!icon) return;

            const { appId, windowId } = icon.dataset;
            windowId ? this.restoreWindow(windowId) : this.launchApp(this.apps.find(a => a.id === appId));
        });
    }

    launchApp(app) {
        if (!app) return;
        const state = JSON.parse(localStorage.getItem('desktopWindowsState') || '[]');
        const running = state.some(w => w.appTag === app.id);
        const launch = app.singleton ? !running : true;
        
        document.dispatchEvent(new CustomEvent('PUBLISH_COMPONENT', { 
            detail: { url: app.sourceUrl, code: '', mimeType: "application/javascript", launch } 
        }));

        app.running = true;
        this.render();
    }

    restoreWindow(windowId) {
        // Remove from minimized windows
        this.minimizedWindows = this.minimizedWindows.filter(w => w.id !== windowId);
        
        // Dispatch event to restore window via EventBus
        eventBus.publish(MESSAGES.WINDOW_RESTORE, { windowId });
        
        this.render();
    }

    minimizeWindow(windowId, appName, appIcon, appTag) {
        // Add to minimized windows if not already there
        if (!this.minimizedWindows.find(w => w.id === windowId)) {
            this.minimizedWindows.push({
                id: windowId,
                name: appName,
                icon: appIcon,
                tag: appTag
            });
            this.render();
        }
    }

    closeApp(appId) {
        const app = this.apps.find(a => a.id === appId);
        if (app) {
            app.running = false;
            this.render();
        }
    }


}

customElements.define('dock-component', DockComponent);