import { AppService } from '../services/app-service.js';
export class ContextMenuManager {
    constructor(shadowRoot, wallpaperManager) {
        this.shadowRoot = shadowRoot;
        this.appService = new AppService(this.shadowRoot);
        this.wallpaperManager = wallpaperManager; // Dependency injection for WallpaperManager
        this.contextMenuHtml = `
            <div class="context-menu" id="contextMenu">
                <div class="context-menu-item" data-action="change-wallpaper">Change Desktop Background...</div>
                <div class="context-menu-separator"></div>
                <div class="context-menu-item" data-action="use-stacks">Use Stacks</div>
                <div class="context-menu-item" data-action="show-view-options">Show View Options</div>
                <div class="context-menu-separator"></div>
                <div class="context-menu-item" data-action="paste">Paste</div>
                <div class="context-menu-item" data-action="get-info">Get Info</div>
                <div class="context-menu-separator"></div>
                <div class="context-menu-item" data-action="open-finder-webapp">Open Finder Web App</div>
            </div>
        `;
        this.contextMenuCss = `
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
        `;
    }

    init() {
        // Append context menu HTML to shadowRoot
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = this.contextMenuHtml;
        while (tempDiv.firstChild) {
            this.shadowRoot.appendChild(tempDiv.firstChild);
        }

        // Append context menu CSS to shadowRoot
        const style = document.createElement('style');
        style.textContent = this.contextMenuCss;
        this.shadowRoot.appendChild(style);

        this.setupEventListeners();
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
            if (contextMenu && !contextMenu.contains(e.target)) {
                contextMenu.style.display = 'none';
            }
        });

        // Context menu actions
        this.shadowRoot.addEventListener('click', (e) => {
            if (e.target.hasAttribute('data-action')) {
                const action = e.target.getAttribute('data-action');
                this.handleContextMenuAction(action);
                const contextMenu = this.shadowRoot.getElementById('contextMenu');
                if (contextMenu) {
                    contextMenu.style.display = 'none';
                }
            }
        });
    }

    showContextMenu(x, y) {
        const contextMenu = this.shadowRoot.getElementById('contextMenu');
        if (!contextMenu) return;

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

    async handleContextMenuAction(action) {
        switch (action) {
            case 'change-wallpaper':
                if (this.wallpaperManager) {
                    this.wallpaperManager.changeWallpaper();
                }
                break;
            case 'show-view-options':
                console.log('Show view options clicked');
                break;
            case 'use-stacks':
                console.log('Use stacks clicked');
                break;
            case 'paste':
                try {
                    const text = await navigator.clipboard.readText();
                    if (text) {
                        this.appService.handleText([text]);
                    }
                } catch (err) {
                    console.error('Failed to read clipboard contents: ', err);
                }
                break;
            case 'get-info':
                console.log('Get info clicked');
                break;
            case 'open-finder-webapp':
                this.appService.handleText(['finder-webapp']);
                break;
        }
    }
}