import { MESSAGES } from '../events/message-types.js';
import eventBus from '../events/event-bus.js';
class DockComponent extends HTMLElement {
    static get observedAttributes() {
        return ['config', 'dock-position'];
    }

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.minimizedWindows = [];
    }

    async connectedCallback() {
        if (!this.hasAttribute('dock-position')) {
            this.setAttribute('dock-position', 'bottom');
        }
        const configURL = this.getAttribute("config") || '/desktop/dock.js';
        const { APPS } = await import(configURL);

        this.apps = APPS.map(app => ({ ...app, running: app.id === 'finder' }));
        this.apps.filter(a => a.onstartup).forEach(a => this.launchApp(a));
        this.render();
        this.setupEventListeners();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue) return;
        if (name === 'dock-position') {
            this.render();
        }
    }

    render() {
        const position = this.getAttribute('dock-position') || 'bottom';
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    pointer-events: auto;
                    width: fit-content;
                    position: absolute;
                    z-index: 999;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }

                :host([dock-position="bottom"]) {
                    bottom: 8px;
                    left: 50%;
                    transform: translateX(-50%);
                }

                :host([dock-position="left"]) {
                    left: 8px;
                    top: 50%;
                    transform: translateY(-50%);
                }

                :host([dock-position="right"]) {
                    right: 8px;
                    top: 50%;
                    transform: translateY(-50%);
                }

                .dock-container {
                    display: flex;
                    padding: 8px 16px;
                    background: rgba(255, 255, 255, 0.2);
                    backdrop-filter: blur(20px);
                    border-radius: 16px;
                    border: 1px solid rgba(255, 255, 255, 0.3);
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
                    gap: 8px;
                    position: relative;
                }

                :host([dock-position="bottom"]) .dock-container {
                    flex-direction: row;
                    align-items: end;
                }

                :host([dock-position="left"]) .dock-container,
                :host([dock-position="right"]) .dock-container {
                    flex-direction: column;
                    align-items: center;
                }

                .dock-apps {
                    display: flex;
                    gap: 16px;
                }

                :host([dock-position="bottom"]) .dock-apps {
                    flex-direction: row;
                    align-items: end;
                }

                :host([dock-position="left"]) .dock-apps,
                :host([dock-position="right"]) .dock-apps {
                    flex-direction: column;
                    align-items: center;
                }

                .dock-separator {
                    background: rgba(255, 255, 255, 0.4);
                    margin: 0 4px;
                }

                :host([dock-position="bottom"]) .dock-separator {
                    width: 1px;
                    height: 32px;
                    align-self: end;
                }

                :host([dock-position="left"]) .dock-separator,
                :host([dock-position="right"]) .dock-separator {
                    width: 32px;
                    height: 1px;
                    margin: 4px 0;
                }

                .dock-minimized {
                    display: flex;
                    gap: 8px;
                }

                :host([dock-position="bottom"]) .dock-minimized {
                    flex-direction: row;
                    align-items: end;
                }

                :host([dock-position="left"]) .dock-minimized,
                :host([dock-position="right"]) .dock-minimized {
                    flex-direction: column;
                    align-items: center;
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

        eventBus.subscribe(MESSAGES.APP_LAUNCHED, (app) => {
            alert("App launched event received:", app);
            // app : icon : "📦" name : "github-explorer" sourceUrl : "/experiments/editor/wc/github-explorer.js" tag : "github-explorer"
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