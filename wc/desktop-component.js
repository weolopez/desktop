class DesktopComponent extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.wallpaper = localStorage.getItem('desktop-wallpaper') || 'default-gradient';
    }

    connectedCallback() {
        this.render();
        this.setupEventListeners();
        this.loadAppsFromURL();
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    width: 100vw;
                    height: 100vh;
                    overflow: hidden;
                    position: relative;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                }

                .desktop-background {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    z-index: -1;
                }

                .wallpaper-gradient {
                    background: linear-gradient(135deg, 
                        #667eea 0%, 
                        #764ba2 100%);
                }

                .wallpaper-monterey {
                    background: linear-gradient(135deg,
                        #1e3c72 0%,
                        #2a5298 50%,
                        #764ba2 100%);
                }

                .wallpaper-big-sur {
                    background: linear-gradient(180deg,
                        #ff9a9e 0%,
                        #fecfef 50%,
                        #fecfef 100%);
                }

                .desktop-surface {
                    width: 100%;
                    height: 100%;
                    position: relative;
                    display: flex;
                    flex-direction: column;
                }

                .menu-bar-container {
                    height: 24px;
                    width: 100%;
                    z-index: 1000;
                }

                .desktop-content {
                    flex: 1;
                    position: relative;
                    z-index: 1;
                }

                .dock-container {
                    position: absolute;
                    bottom: 8px;
                    left: 50%;
                    transform: translateX(-50%);
                    z-index: 999;
                }

                .context-menu {
                    position: absolute;
                    background: rgba(255, 255, 255, 0.85);
                    backdrop-filter: blur(20px);
                    border-radius: 8px;
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
                    padding: 4px 0;
                    min-width: 200px;
                    display: none;
                    z-index: 10000;
                    font-size: 13px;
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
            </style>
            
            <div class="desktop-background wallpaper-${this.wallpaper}"></div>
            
            <div class="desktop-surface">
                <div class="menu-bar-container">
                    <menu-bar-component></menu-bar-component>
                </div>
                
                <div class="desktop-content">
                    <slot></slot>
                </div>
                
                <div class="dock-container">
                    <dock-component></dock-component>
                </div>
            </div>

            <div class="context-menu" id="contextMenu">
                <div class="context-menu-item" data-action="change-wallpaper">Change Desktop Background...</div>
                <div class="context-menu-separator"></div>
                <div class="context-menu-item" data-action="show-view-options">Show View Options</div>
                <div class="context-menu-item" data-action="use-stacks">Use Stacks</div>
                <div class="context-menu-separator"></div>
                <div class="context-menu-item" data-action="get-info">Get Info</div>
            </div>
        `;
    }

    setupEventListeners() {
        // Desktop right-click context menu
        this.shadowRoot.addEventListener('contextmenu', (e) => {
            if (e.target.classList.contains('desktop-content') || 
                e.target === this.shadowRoot.querySelector('.desktop-surface')) {
                e.preventDefault();
                this.showContextMenu(e.clientX, e.clientY);
            }
        });

        // Hide context menu on click elsewhere
        this.shadowRoot.addEventListener('click', (e) => {
            const contextMenu = this.shadowRoot.getElementById('contextMenu');
            if (!contextMenu.contains(e.target)) {
                contextMenu.style.display = 'none';
            }
        });

        // Context menu actions
        this.shadowRoot.addEventListener('click', (e) => {
            if (e.target.hasAttribute('data-action')) {
                const action = e.target.getAttribute('data-action');
                this.handleContextMenuAction(action);
                this.shadowRoot.getElementById('contextMenu').style.display = 'none';
            }
        });

        // Window management events
        this.addEventListener('launch-app', (e) => {
            this.launchApplication(e.detail);
        });

        this.addEventListener('window-close', (e) => {
            this.handleWindowClose(e.detail);
        });

        this.addEventListener('window-minimize', (e) => {
            this.handleWindowMinimize(e.detail);
        });

        this.addEventListener('restore-window', (e) => {
            this.handleWindowRestore(e.detail);
        });

        this.addEventListener('window-focus', (e) => {
            this.handleWindowFocus(e.detail);
        });
    }

    showContextMenu(x, y) {
        const contextMenu = this.shadowRoot.getElementById('contextMenu');
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
            case 'change-wallpaper':
                this.changeWallpaper();
                break;
            case 'show-view-options':
                console.log('Show view options clicked');
                break;
            case 'use-stacks':
                console.log('Use stacks clicked');
                break;
            case 'get-info':
                console.log('Get info clicked');
                break;
        }
    }

    changeWallpaper() {
        const wallpapers = ['gradient', 'monterey', 'big-sur'];
        const currentIndex = wallpapers.indexOf(this.wallpaper.replace('default-', ''));
        const nextIndex = (currentIndex + 1) % wallpapers.length;
        const newWallpaper = wallpapers[nextIndex];
        
        this.wallpaper = newWallpaper;
        localStorage.setItem('desktop-wallpaper', newWallpaper);
        
        const background = this.shadowRoot.querySelector('.desktop-background');
        background.className = `desktop-background wallpaper-${newWallpaper}`;
    }

    async launchApplication(appDetails) {
        const { appId, appName, appIcon } = appDetails;
        
        // Create a new window
        const window = document.createElement('window-component');
        window.setAttribute('app-name', appName);
        window.setAttribute('app-icon', appIcon);
        window.setAttribute('x', 150 + (Math.random() * 200));
        window.setAttribute('y', 150 + (Math.random() * 100));
        window.setAttribute('width', '600');
        window.setAttribute('height', '400');
        
        // Load and add app content dynamically
        await this.loadAppComponent(appId, window);
        
        // Add to desktop
        const desktopContent = this.shadowRoot.querySelector('.desktop-content');
        desktopContent.appendChild(window);
        
        // Update menu bar
        const menuBar = this.shadowRoot.querySelector('menu-bar-component');
        menuBar.setActiveApp(appName);
        
        // Update URL with currently open apps
        this.updateURLWithOpenApps();
    }

    async loadAppComponent(appId, windowElement) {
        try {
            const webappFileName = `${appId}-webapp.js`;
            
            // Import the app component dynamically
            await import(`../apps/${webappFileName}`);
            
            // Create and append the app component
            const appComponent = document.createElement(`${appId}-webapp`);
            windowElement.appendChild(appComponent);
        } catch (error) {
            console.warn(`Failed to load app component for ${appId}:`, error);
            // Fallback to placeholder content
            windowElement.innerHTML = `
                <div style="padding: 40px; text-align: center; color: #666;">
                    <h2>${appId}</h2>
                    <p>This application could not be loaded.</p>
                </div>
            `;
        }
    }

    loadAppsFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        const appsParam = urlParams.get('apps');
        
        if (appsParam) {
            const appFileNames = appsParam.split(',');
            appFileNames.forEach(async (fileName) => {
                if (fileName.endsWith('-webapp.js')) {
                    const appId = fileName.replace('-webapp.js', '');
                    const appDetails = this.getAppDetailsFromId(appId);
                    if (appDetails) {
                        await this.launchApplication(appDetails);
                    }
                }
            });
        }
    }

    updateURLWithOpenApps() {
        const windows = this.shadowRoot.querySelectorAll('window-component');
        const openApps = Array.from(windows).map(window => {
            const appName = window.getAttribute('app-name');
            const appId = this.getAppIdFromName(appName);
            return `${appId}-webapp.js`;
        });
        
        const url = new URL(window.location);
        if (openApps.length > 0) {
            url.searchParams.set('apps', openApps.join(','));
        } else {
            url.searchParams.delete('apps');
        }
        
        window.history.replaceState({}, '', url);
    }

    getAppDetailsFromId(appId) {
        // Map app IDs to their details
        const appMap = {
            'finder': { appId: 'finder', appName: 'Finder', appIcon: '📁' },
            'textedit': { appId: 'textedit', appName: 'TextEdit', appIcon: '📝' },
            'safari': { appId: 'safari', appName: 'Safari', appIcon: '🧭' },
            'system-preferences': { appId: 'system-preferences', appName: 'System Preferences', appIcon: '⚙️' }
        };
        return appMap[appId];
    }

    getAppIdFromName(appName) {
        // Map app names back to their IDs
        const nameToIdMap = {
            'Finder': 'finder',
            'TextEdit': 'textedit',
            'Safari': 'safari',
            'System Preferences': 'system-preferences'
        };
        return nameToIdMap[appName];
    }

    handleWindowClose(details) {
        const { windowId, appName } = details;
        
        // Update dock to remove running indicator if no more windows
        const remainingWindows = this.shadowRoot.querySelectorAll(`window-component[app-name="${appName}"]`);
        if (remainingWindows.length <= 1) { // <= 1 because the closing window is still in DOM
            const dock = this.shadowRoot.querySelector('dock-component');
            dock.closeApp(this.getAppIdFromName(appName));
        }
        
        // Update URL after window closes
        setTimeout(() => {
            this.updateURLWithOpenApps();
        }, 100);
    }

    handleWindowMinimize(details) {
        const { windowId, appName, appIcon } = details;
        
        // Add to dock's minimized windows
        const dock = this.shadowRoot.querySelector('dock-component');
        dock.minimizeWindow(windowId, appName, appIcon);
    }

    handleWindowRestore(details) {
        const { windowId } = details;
        
        // Find and restore the window
        const windows = this.shadowRoot.querySelectorAll('window-component');
        windows.forEach(window => {
            if (window.windowState.id === windowId) {
                window.restore();
            }
        });
    }

    handleWindowFocus(details) {
        const { windowId, appName } = details;
        
        // Unfocus all other windows
        const windows = this.shadowRoot.querySelectorAll('window-component');
        windows.forEach(window => {
            if (window.windowState.id !== windowId) {
                window.unfocus();
            }
        });
        
        // Update menu bar
        const menuBar = this.shadowRoot.querySelector('menu-bar-component');
        menuBar.setActiveApp(appName);
    }

    getAppIdFromName(appName) {
        const appMap = {
            'Finder': 'finder',
            'Safari': 'safari',
            'TextEdit': 'textedit',
            'System Preferences': 'system-preferences',
            'Activity Monitor': 'activity-monitor'
        };
        return appMap[appName] || appName.toLowerCase().replace(/\s+/g, '-');
    }
}

customElements.define('desktop-component', DesktopComponent);