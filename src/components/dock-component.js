import { MESSAGES } from '../events/message-types.js';
import eventBus from '../events/event-bus.js';

// Inject dock styles once
const DOCK_STYLES = `
  dock-component { position: fixed !important; background: rgba(255,255,255,0.15); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.2); box-shadow: 0 8px 32px rgba(0,0,0,0.3); transition: transform 0.3s ease; z-index: 9999; border-radius: 20px; }
  dock-component[dock-position="bottom"] { bottom: 0 !important; left: 50% !important; top: auto !important; right: auto !important; transform: translateX(-50%); transform-origin: bottom center; padding: 8px 12px; }
  dock-component[dock-position="left"] { left: 0 !important; top: 50% !important; bottom: auto !important; right: auto !important; transform: translateY(-50%); transform-origin: left center; padding: 12px 8px; }
  dock-component[dock-position="right"] { right: 0 !important; top: 50% !important; bottom: auto !important; left: auto !important; transform: translateY(-50%); transform-origin: right center; padding: 12px 8px; }
  dock-component[dock-position="bottom"][hidden] { transform: translateX(-50%) translateY(100%) !important; }
  dock-component[dock-position="left"][hidden] { transform: translateY(-50%) translateX(-100%) !important; }
  dock-component[dock-position="right"][hidden] { transform: translateY(-50%) translateX(100%) !important; }
  dock-context-menu { display: none; position: fixed; background: rgba(40,40,40,0.95); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 4px; min-width: 180px; box-shadow: 0 8px 32px rgba(0,0,0,0.5); z-index: 10000; }
  dock-context-menu.visible { display: block; }
  dock-context-menu .menu-item { padding: 8px 12px; cursor: pointer; border-radius: 4px; color: #fff; font-size: 13px; transition: background 0.15s; white-space: nowrap; }
  dock-context-menu .menu-item:hover { background: rgba(255,255,255,0.1); }
  dock-context-menu .menu-item.disabled { opacity: 0.4; cursor: default; }
  dock-context-menu .menu-item.disabled:hover { background: none; }
  dock-context-menu .menu-item.checked::before { content: '✓ '; }
  dock-context-menu .menu-separator { height: 1px; background: rgba(255,255,255,0.1); margin: 4px 0; }
`;

if (!document.getElementById('dock-component-styles')) {
  const style = Object.assign(document.createElement('style'), { id: 'dock-component-styles', textContent: DOCK_STYLES });
  document.head.appendChild(style);
}

// Context menu helper
const getContextMenu = () => {
  let menu = document.querySelector('dock-context-menu');
  if (!menu) {
    menu = document.createElement('dock-context-menu');
    document.addEventListener('click', () => menu.classList.remove('visible'));
    menu.show = function(x, y, items) {
      this.innerHTML = items.map(item => 
        item.separator && !item.label ? '<div class="menu-separator"></div>'
          : `<div class="menu-item${item.disabled ? ' disabled' : ''}${item.checked ? ' checked' : ''}">${item.label}</div>`
      ).join('');
      const labelItems = items.filter(it => it.label && !it.disabled);
      this.querySelectorAll('.menu-item:not(.disabled)').forEach((el, i) => {
        if (labelItems[i]?.action) el.onclick = e => { e.stopPropagation(); labelItems[i].action(); this.classList.remove('visible'); };
      });
      Object.assign(this.style, { left: x + 'px', top: y + 'px' });
      this.classList.add('visible');
      requestAnimationFrame(() => {
        const r = this.getBoundingClientRect(), { innerWidth: w, innerHeight: h } = window;
        if (r.right > w) this.style.left = (w - r.width - 10) + 'px';
        if (r.bottom > h) this.style.top = (h - r.height - 10) + 'px';
      });
    };
    (document.body || document.documentElement).appendChild(menu);
  }
  return menu;
};

class DockComponent extends HTMLElement {
    static get observedAttributes() {
        return ['config', 'dock-position'];
    }

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.minimizedWindows = [];
        this.autoHide = false;
        this.magnification = 1;
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
        this.setupAutoHide();
        this.updateScale();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue) return;
        if (name === 'dock-position') {
            this.render();
            this.updateScale();
        }
    }

    get position() { return this.getAttribute('dock-position') || 'bottom'; }
    set position(val) { this.setAttribute('dock-position', val); }

    updateScale() { 
        if (this.magnification === 1) {
            this.style.transform = '';  // Let CSS handle it
        } else {
            const base = this.position === 'bottom' ? 'translateX(-50%)' : 'translateY(-50%)';
            this.style.transform = `${base} scale(${this.magnification})`;
        }
    }

    setupAutoHide() {
        let hideTimeout;
        this.addEventListener('mouseenter', () => { clearTimeout(hideTimeout); if (this.autoHide) this.removeAttribute('hidden'); });
        this.addEventListener('mouseleave', () => { if (this.autoHide) hideTimeout = setTimeout(() => this.setAttribute('hidden', ''), 500); });
        document.addEventListener('mousemove', e => {
            if (!this.autoHide || !this.hasAttribute('hidden')) return;
            const { clientX: x, clientY: y } = e, { innerWidth: w, innerHeight: h } = window;
            if ((this.position === 'bottom' && y > h - 5) || (this.position === 'left' && x < 5) || (this.position === 'right' && x > w - 5))
                this.removeAttribute('hidden');
        });
    }

    render() {
        if (!this.apps || this.apps.length === 0) {
            return;
        }
        const position = this.position;
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    pointer-events: auto;
                    width: fit-content;
                    position: fixed !important;
                    background: rgba(255,255,255,0.15);
                    backdrop-filter: blur(20px);
                    border: 1px solid rgba(255,255,255,0.2);
                    box-shadow: 0 8px 32px rgba(0,0,0,0.3);
                    transition: transform 0.3s ease;
                    z-index: 9999;
                    border-radius: 20px;
                }

                :host([dock-position="bottom"]) {
                    bottom: 0 !important;
                    left: 50% !important;
                    top: auto !important;
                    right: auto !important;
                    transform: translateX(-50%);
                    transform-origin: bottom center;
                    padding: 8px 12px;
                }

                :host([dock-position="left"]) {
                    left: 0 !important;
                    top: 50% !important;
                    bottom: auto !important;
                    right: auto !important;
                    transform: translateY(-50%);
                    transform-origin: left center;
                    padding: 12px 8px;
                }

                :host([dock-position="right"]) {
                    right: 0 !important;
                    top: 50% !important;
                    bottom: auto !important;
                    left: auto !important;
                    transform: translateY(-50%);
                    transform-origin: right center;
                    padding: 12px 8px;
                }

                :host([dock-position="bottom"][hidden]) {
                    transform: translateX(-50%) translateY(100%) !important;
                }

                :host([dock-position="left"][hidden]) {
                    transform: translateY(-50%) translateX(-100%) !important;
                }

                :host([dock-position="right"][hidden]) {
                    transform: translateY(-50%) translateX(100%) !important;
                }

                .dock-container {
                    display: flex;
                    gap: 8px;
                }

                :host([dock-position="bottom"]) .dock-container { flex-direction: row; height: 64px; align-items: flex-end; }
                :host([dock-position="left"]) .dock-container,
                :host([dock-position="right"]) .dock-container { flex-direction: column; width: 64px; }

                .dock-apps, .dock-minimized {
                    display: flex;
                    gap: 8px;
                }

                :host([dock-position="bottom"]) .dock-apps,
                :host([dock-position="bottom"]) .dock-minimized { flex-direction: row; align-items: flex-end; }
                :host([dock-position="left"]) .dock-apps,
                :host([dock-position="left"]) .dock-minimized,
                :host([dock-position="right"]) .dock-apps,
                :host([dock-position="right"]) .dock-minimized { flex-direction: column; }

                .dock-separator {
                    background: rgba(255, 255, 255, 0.4);
                    align-self: center;
                }
                :host([dock-position="bottom"]) .dock-separator { width: 1px; height: 40px; }
                :host([dock-position="left"]) .dock-separator,
                :host([dock-position="right"]) .dock-separator { width: 40px; height: 1px; }

                .dock-icon {
                    width: 48px;
                    height: 48px;
                    background: rgba(255, 255, 255, 0.2);
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(255, 255, 255, 0.3);
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    position: relative;
                    font-size: 24px;
                    user-select: none;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15), inset 0 1px 1px rgba(255,255,255,0.3);
                    transition: transform 0.2s ease;
                }

                :host([dock-position="bottom"]) .dock-icon { transform-origin: center bottom; }
                :host([dock-position="left"]) .dock-icon { transform-origin: left center; }
                :host([dock-position="right"]) .dock-icon { transform-origin: right center; }

                .dock-icon:hover { z-index: 10; }
                :host([dock-position="bottom"]) .dock-icon:hover { transform: scale(1.4) translateY(-8px); }
                :host([dock-position="left"]) .dock-icon:hover { transform: scale(1.4) translateX(8px); }
                :host([dock-position="right"]) .dock-icon:hover { transform: scale(1.4) translateX(-8px); }

                @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-15px); } }
                @keyframes bounceX { 0%, 100% { transform: translateX(0); } 50% { transform: translateX(var(--bounce-dir, -15px)); } }
                
                .dock-icon.bouncing { animation: bounce 0.5s ease-in-out infinite; }
                :host([dock-position="left"]) .dock-icon.bouncing { --bounce-dir: 15px; animation-name: bounceX; }
                :host([dock-position="right"]) .dock-icon.bouncing { --bounce-dir: -15px; animation-name: bounceX; }

                .dock-icon.new-app { animation: popIn 0.3s ease; }
                @keyframes popIn { 0% { transform: scale(0); opacity: 0; } 50% { transform: scale(1.2); } 100% { transform: scale(1); opacity: 1; } }

                .running-indicator {
                    position: absolute;
                    width: 4px;
                    height: 4px;
                    border-radius: 50%;
                    background: #fff;
                    opacity: 0;
                    transition: opacity 0.2s;
                }
                :host([dock-position="bottom"]) .running-indicator { bottom: -8px; left: 50%; transform: translateX(-50%); }
                :host([dock-position="left"]) .running-indicator { left: -8px; top: 50%; transform: translateY(-50%); }
                :host([dock-position="right"]) .running-indicator { right: -8px; top: 50%; transform: translateY(-50%); }
                .running-indicator.visible { opacity: 1; }

                .dock-icon.minimized { opacity: 0.7; }
                .dock-icon.minimized::before {
                    content: '';
                    position: absolute;
                    top: 4px;
                    right: 4px;
                    width: 6px;
                    height: 6px;
                    background: #FF9500;
                    border-radius: 50%;
                }
            </style>

            <div class="dock-container">
                <div class="dock-apps">
                    ${this.apps.map(app => `
                        <div class="dock-icon${app.launching ? ' bouncing' : ''}"
                             data-app-id="${app.id}"
                             data-app-url="${app.sourceUrl}"
                             data-app-name="${app.name}">
                            ${app.icon}
                            <div class="running-indicator${app.running ? ' visible' : ''}"></div>
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

        this.shadowRoot.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const icon = e.target.closest('.dock-icon');
            
            if (icon) {
                const appId = icon.dataset.appId;
                const app = this.apps.find(a => a.id === appId);
                if (app) {
                    getContextMenu().show(e.clientX, e.clientY, [
                        { label: app.running ? 'Quit' : 'Open', action: () => app.running ? this.closeApp(appId) : this.launchApp(app) },
                        { separator: true },
                        { label: 'Remove from Dock', action: () => { this.apps = this.apps.filter(a => a.id !== appId); this.render(); } },
                        { label: 'Show in Finder', disabled: true }
                    ]);
                }
            } else {
                // Dock context menu
                getContextMenu().show(e.clientX, e.clientY, [
                    { label: 'Position', separator: true },
                    { label: 'Left', action: () => this.position = 'left', checked: this.position === 'left' },
                    { label: 'Bottom', action: () => this.position = 'bottom', checked: this.position === 'bottom' },
                    { label: 'Right', action: () => this.position = 'right', checked: this.position === 'right' },
                    { separator: true },
                    { label: 'Magnification', separator: true },
                    ...[[0.6, 'Small'], [0.8, 'Medium'], [1, 'Large']].map(([v, l]) => 
                        ({ label: l, action: () => { this.magnification = v; this.updateScale(); }, checked: this.magnification === v })),
                    { separator: true },
                    { label: this.autoHide ? 'Turn Hiding Off' : 'Turn Hiding On', action: () => { this.autoHide = !this.autoHide; if (!this.autoHide) this.removeAttribute('hidden'); } },
                    { separator: true },
                    { label: 'Dock Preferences...', action: () => eventBus.publish(MESSAGES.OPEN_PREFERENCES, { tab: 'dock' }) }
                ]);
            }
        });

        eventBus.subscribe(MESSAGES.APP_LAUNCHED, (app) => {
            const dockApp = this.apps.find(a => a.id === app.tag || a.name === app.name);
            if (dockApp) {
                dockApp.running = true;
                dockApp.launching = false;
                this.render();
            }
        });

        eventBus.subscribe(MESSAGES.WINDOW_MINIMIZED, ({ windowId, appName, appIcon, appTag }) => {
            this.minimizeWindow(windowId, appName, appIcon, appTag);
        });

        eventBus.subscribe(MESSAGES.WINDOW_CLOSED, ({ appTag }) => {
            this.closeApp(appTag);
        });
    }

    launchApp(app) {
        if (!app) return;
        const state = JSON.parse(localStorage.getItem('desktopWindowsState') || '[]');
        const running = state.some(w => w.appTag === app.id);
        const launch = app.singleton ? !running : true;
        
        // Start bounce animation
        app.launching = true;
        this.render();

        document.dispatchEvent(new CustomEvent('PUBLISH_COMPONENT', { 
            detail: { url: app.sourceUrl, code: '', mimeType: "application/javascript", launch } 
        }));

        // Stop bouncing after delay if APP_LAUNCHED doesn't fire
        setTimeout(() => {
            if (app.launching) {
                app.launching = false;
                app.running = true;
                this.render();
            }
        }, 3000);
    }

    restoreWindow(windowId) {
        this.minimizedWindows = this.minimizedWindows.filter(w => w.id !== windowId);
        eventBus.publish(MESSAGES.WINDOW_RESTORE, { windowId });
        this.render();
    }

    minimizeWindow(windowId, appName, appIcon, appTag) {
        if (!this.minimizedWindows.find(w => w.id === windowId)) {
            this.minimizedWindows.push({ id: windowId, name: appName, icon: appIcon, tag: appTag });
            this.render();
        }
    }

    closeApp(appId) {
        const app = this.apps.find(a => a.id === appId);
        if (app) {
            app.running = false;
            app.launching = false;
            this.render();
        }
    }
}

customElements.define('dock-component', DockComponent);