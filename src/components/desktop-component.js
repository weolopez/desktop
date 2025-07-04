import { WallpaperManager } from '../services/wallpaper-manager.js';
import { ContextMenuManager } from '../services/context-menu-manager.js';
import { WindowManager } from '../services/window-manager.js';
import '../services/notification/notification-service.js';
import '../services/notification/notification-display-component.js';
import { AppService } from '../services/app-service.js';

// import { PreviewService } from '../services/preview-service.js';

class DesktopComponent extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.appService = new AppService();
        this.appService.init(this);
        this.wallpaperManager = new WallpaperManager(this);
        this.contextMenuManager = new ContextMenuManager(this, this.wallpaperManager);
        this.windowManager = new WindowManager(this, this.appService);
    }

    connectedCallback() {
        this.render();
        this.contextMenuManager.init();
        this.windowManager.setupEventListeners();
        this.windowManager.restoreWindowsState();
        this.setupPasteDrop();
        this.setupAppEventListeners();
        this.showTestNotification();
    }

    showTestNotification() {
        setTimeout(() => {
            document.dispatchEvent(new CustomEvent('create-notification', {
                detail: {
                    sourceAppId: 'system',
                    title: 'Welcome to your Desktop!',
                    body: 'The notification system is now active.',
                    icon: '🎉'
                }
            }));
        }, 2000);
    }

    setupAppEventListeners() {
        this.addEventListener('app-launched', () => {
            console.log('App launched event received');
        });

        this.addEventListener('window-closed', () => {
            setTimeout(() => {
                console.log('Window closed event received');
            }, 100);
        });

        this.addEventListener('launch-finder-webapp', (e) => {
            this.dispatchEvent(new CustomEvent('PUBLISH_TEXT', { detail: { texts: [e.detail.url] } }));
        });
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
            </style>
            
            <div class="desktop-background"></div>
            
            <div class="desktop-surface">
                <!--<div class="menu-bar-container">
                    <menu-bar-component></menu-bar-component>
                </div>-->

                <div class="desktop-content">
                    <slot></slot>
                </div>
                
                <div class="dock-container">
                    <dock-component></dock-component>
                </div>
            </div>
            <notification-display-component></notification-display-component>
        `;
        this.updateWallpaperClass(this.wallpaperManager.wallpaper);
    }

    setupPasteDrop() {
        const desktopSurface = this.shadowRoot.querySelector('.desktop-surface');

        desktopSurface.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
        });

        desktopSurface.addEventListener('drop', (e) => {
            e.preventDefault();
            this.handleFileDrop(e);
        });

        // Handle paste events
        document.addEventListener('paste', (e) => {
            this.handlePaste(e);
        });
    }

    handleFileDrop(e) {
        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) {
            this.appService.handleFiles(files);
        }
        //handle text if available
        if (e.dataTransfer.getData('text/plain')) {
            const text = e.dataTransfer.getData('text/plain');
            this.dispatchEvent(new CustomEvent('PUBLISH_TEXT', { detail: { texts: [text] } }));
        }
        e.preventDefault();
        e.stopPropagation();
    }

    handlePaste(e) {
        const items = Array.from(e.clipboardData.items);
        //emit an event to the app service to handle the pasted items
        this.appService.handleFiles(items.filter(item => item.kind === 'file').map(item => item.getAsFile()));
        // Handle pasted string items (e.g., plain text, URLs)
        items
            .filter(item => item.kind === 'string')
            //also filter type : "text/plain"
            .filter(item => item.type === 'text/plain')
            .forEach(item => {
            item.getAsString((text) => {
                if (text && text.trim().length > 0) {
                this.dispatchEvent(new CustomEvent('PUBLISH_TEXT', { detail: { texts: [text] } }));
                }
            });
            });

        // Prevent default paste behavior
        e.preventDefault();
        e.stopPropagation();
    }

    // processImageFile(file) {
    //     const reader = new FileReader();
    //     reader.onload = (e) => {
    //         const imageData = e.target.result;
    //         this.previewService.launchPreview(imageData);
    //     };
    //     reader.readAsDataURL(file);
    // }

    // Methods to be called by services
    addWindow(windowElement) {
        this.shadowRoot.querySelector('.desktop-content').appendChild(windowElement);
    }

    getWindows() {
        return this.shadowRoot.querySelectorAll('window-component');
    }

    getDesktopSurface() {
        return this.shadowRoot.querySelector('.desktop-surface');
    }

    updateWallpaperClass(wallpaper) {
        const background = this.shadowRoot.querySelector('.desktop-background');
        if (background) {
            background.className = `desktop-background wallpaper-${wallpaper}`;
        }
    }

    showContextMenu(x, y) {
        const contextMenu = this.shadowRoot.getElementById('contextMenu');
        if (!contextMenu) return;

        contextMenu.style.display = 'block';
        contextMenu.style.left = `${x}px`;
        contextMenu.style.top = `${y}px`;

        const rect = contextMenu.getBoundingClientRect();
        if (rect.right > window.innerWidth) {
            contextMenu.style.left = `${x - rect.width}px`;
        }
        if (rect.bottom > window.innerHeight) {
            contextMenu.style.top = `${y - rect.height}px`;
        }
    }

    hideContextMenu() {
        const contextMenu = this.shadowRoot.getElementById('contextMenu');
        if (contextMenu) {
            contextMenu.style.display = 'none';
        }
    }

    appendContextMenu(menuHtml, style) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = menuHtml;
        while (tempDiv.firstChild) {
            this.shadowRoot.appendChild(tempDiv.firstChild);
        }
        this.shadowRoot.appendChild(style);
    }
}

customElements.define('desktop-component', DesktopComponent);