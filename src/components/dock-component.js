import { APPS } from '../config.js';
import { AppService } from '../services/app-service.js';
class DockComponent extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.apps = APPS.map(app => ({ ...app, running: app.id === 'finder' })); // Only Finder starts running
        this.minimizedWindows = [];
        this.magnification = true;
        this.appService = new AppService(this.shadowRoot);
    }

    connectedCallback() {
        this.render();
        this.setupEventListeners();
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    pointer-events: auto;
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
                    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                    position: relative;
                    font-size: 24px;
                    user-select: none;
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    backdrop-filter: blur(10px);
                }

                .dock-icon:hover {
                    transform: translateY(-8px) scale(1.2);
                    background: rgba(255, 255, 255, 0.2);
                    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
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

                .tooltip {
                    position: absolute;
                    bottom: 70px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: rgba(0, 0, 0, 0.8);
                    color: white;
                    padding: 4px 8px;
                    border-radius: 4px;
                    font-size: 11px;
                    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
                    white-space: nowrap;
                    opacity: 0;
                    pointer-events: none;
                    transition: opacity 0.2s ease;
                    z-index: 10002;
                }

                .dock-icon:hover .tooltip {
                    opacity: 1;
                }

                .context-menu {
                    position: absolute;
                    background: rgba(255, 255, 255, 0.85);
                    backdrop-filter: blur(20px);
                    border-radius: 8px;
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
                    padding: 4px 0;
                    min-width: 180px;
                    display: none;
                    z-index: 10001;
                    font-size: 13px;
                    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
                }

                .context-menu-item {
                    padding: 6px 16px;
                    cursor: pointer;
                    color: #1d1d1f;
                    transition: background-color 0.1s ease;
                }

                .context-menu-item:hover {
                    background-color: rgba(0, 122, 255, 0.8);
                    color: white;
                }

                .context-menu-separator {
                    height: 1px;
                    background: rgba(0, 0, 0, 0.1);
                    margin: 4px 0;
                }

                .dock-trash {
                    width: 40px;
                    height: 40px;
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                    position: relative;
                    font-size: 24px;
                    user-select: none;
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    backdrop-filter: blur(10px);
                    margin-left: 8px;
                }

                .dock-trash:hover {
                    transform: translateY(-8px) scale(1.2);
                    background: rgba(255, 255, 255, 0.2);
                    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
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
                            <div class="tooltip">${app.name}</div>
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
                                <div class="tooltip">${window.name}</div>
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
                
                <div class="dock-separator"></div>
                <div class="dock-trash" data-app-name="Trash">
                    🗑️
                    <div class="tooltip">Trash</div>
                </div>
            </div>

            <div class="context-menu" id="dockContextMenu">
                <div class="context-menu-item" data-action="open">Open</div>
                <div class="context-menu-item" data-action="show-in-finder">Show in Finder</div>
                <div class="context-menu-separator"></div>
                <div class="context-menu-item" data-action="options">Options</div>
                <div class="context-menu-separator"></div>
                <div class="context-menu-item" data-action="remove-from-dock">Remove from Dock</div>
            </div>
        `;
    }

    setupEventListeners() {
        // App icon clicks
        this.shadowRoot.addEventListener('click', (e) => {
            const dockIcon = e.target.closest('.dock-icon');
            if (dockIcon) {
                const appId = dockIcon.getAttribute('data-app-id');
                const windowId = dockIcon.getAttribute('data-window-id');
                const url = dockIcon.getAttribute('data-app-url');
                
                if (url) {
                   this.launchURL(url); 
                } else if (windowId) {
                    this.restoreWindow(windowId);
                }
            }

            // Close context menu when clicking elsewhere
            const contextMenu = this.shadowRoot.getElementById('dockContextMenu');
            if (!contextMenu.contains(e.target)) {
                contextMenu.style.display = 'none';
            }
        });

        // Right-click context menu
        this.shadowRoot.addEventListener('contextmenu', (e) => {
            const dockIcon = e.target.closest('.dock-icon');
            if (dockIcon && !dockIcon.classList.contains('minimized')) {
                e.preventDefault();
                this.showContextMenu(e.clientX, e.clientY, dockIcon);
            }
        });

        // Context menu actions
        this.shadowRoot.addEventListener('click', (e) => {
            if (e.target.hasAttribute('data-action')) {
                const action = e.target.getAttribute('data-action');
                this.handleContextMenuAction(action);
                this.shadowRoot.getElementById('dockContextMenu').style.display = 'none';
            }
        });

        // Magnification effect for neighboring icons
        this.shadowRoot.addEventListener('mouseover', (e) => {
            const dockIcon = e.target.closest('.dock-icon');
            if (dockIcon && this.magnification) {
                this.applyMagnificationEffect(dockIcon);
            }
        });

        this.shadowRoot.addEventListener('mouseout', () => {
            if (this.magnification) {
                this.resetMagnificationEffect();
            }
        });
    }
    launchURL(url) {
        this.appService.handleText(['https://weolopez.com/desktop/src/apps/finder/finder-webapp.js']);
            this.render();
    }

    restoreWindow(windowId) {
        // Remove from minimized windows
        this.minimizedWindows = this.minimizedWindows.filter(w => w.id !== windowId);
        
        // Dispatch custom event to restore window
        this.dispatchEvent(new CustomEvent('restore-window', {
            detail: { windowId },
            bubbles: true,
            composed: true
        }));
        
        this.render();
    }

    minimizeWindow(windowId, appName, appIcon) {
        // Add to minimized windows if not already there
        if (!this.minimizedWindows.find(w => w.id === windowId)) {
            this.minimizedWindows.push({
                id: windowId,
                name: appName,
                icon: appIcon
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

    showContextMenu(x, y, iconElement) {
        const contextMenu = this.shadowRoot.getElementById('dockContextMenu');
        contextMenu.style.display = 'block';
        contextMenu.style.left = `${x}px`;
        contextMenu.style.top = `${y}px`;

        // Adjust position if menu would go off screen
        const rect = contextMenu.getBoundingClientRect();
        if (rect.right > window.innerWidth) {
            contextMenu.style.left = `${x - rect.width}px`;
        }
        if (rect.bottom > window.innerHeight) {
            contextMenu.style.top = `${y - rect.height}px`;
        }
    }

    handleContextMenuAction(action) {
        switch (action) {
            case 'open':
                console.log('Open app');
                break;
            case 'show-in-finder':
                console.log('Show in Finder');
                break;
            case 'options':
                console.log('Show options');
                break;
            case 'remove-from-dock':
                console.log('Remove from dock');
                break;
        }
    }

    applyMagnificationEffect(hoveredIcon) {
        const allIcons = this.shadowRoot.querySelectorAll('.dock-icon');
        const hoveredIndex = Array.from(allIcons).indexOf(hoveredIcon);
        
        allIcons.forEach((icon, index) => {
            const distance = Math.abs(index - hoveredIndex);
            let scale = 1;
            
            if (distance === 0) {
                scale = 1.4;
            } else if (distance === 1) {
                scale = 1.2;
            } else if (distance === 2) {
                scale = 1.1;
            }
            
            icon.style.transform = `scale(${scale}) translateY(${distance === 0 ? '-12px' : distance === 1 ? '-6px' : '0px'})`;
        });
    }

    resetMagnificationEffect() {
        const allIcons = this.shadowRoot.querySelectorAll('.dock-icon');
        allIcons.forEach(icon => {
            icon.style.transform = '';
        });
    }
}

customElements.define('dock-component', DockComponent);