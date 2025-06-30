import { WallpaperManager } from '../services/wallpaper-manager.js';
import { ContextMenuManager } from '../services/context-menu-manager.js';
import { AppService } from '../services/app-service.js';
import { WindowManager } from '../services/window-manager.js';
import { PreviewService } from '../services/preview-service.js';

class DesktopComponent extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.wallpaperManager = new WallpaperManager(this.shadowRoot);
        this.contextMenuManager = new ContextMenuManager(this.shadowRoot, this.wallpaperManager);
        this.appService = new AppService(this.shadowRoot);
        this.windowManager = new WindowManager(this.shadowRoot);
        this.previewService = new PreviewService(this.shadowRoot);
    }

    connectedCallback() {
        this.render();
        this.contextMenuManager.init();
        this.windowManager.setupEventListeners();
        this.appService.loadAppsFromURL();
        this.setupImageHandlers();
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
        `;
        this.wallpaperManager.updateWallpaperClass();
    }

    setupImageHandlers() {
        const desktopSurface = this.shadowRoot.querySelector('.desktop-surface');
        
        // Handle drag and drop
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
        const imageFiles = files.filter(file => file.type.startsWith('image/'));
        
        if (imageFiles.length > 0) {
            // Process the first image file
            this.processImageFile(imageFiles[0]);
        }
    }

    handlePaste(e) {
        const items = Array.from(e.clipboardData.items);
        const imageItems = items.filter(item => item.type.startsWith('image/'));
        
        if (imageItems.length > 0) {
            e.preventDefault();
            // Process the first image item
            const file = imageItems[0].getAsFile();
            if (file) {
                this.processImageFile(file);
            }
        }
    }

    processImageFile(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const imageData = e.target.result;
            this.previewService.launchPreview(imageData);
        };
        reader.readAsDataURL(file);
    }
}

customElements.define('desktop-component', DesktopComponent);