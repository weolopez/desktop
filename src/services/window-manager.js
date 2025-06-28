import { AppService } from './app-service.js';

export class WindowManager {
    constructor(shadowRoot) {
        this.shadowRoot = shadowRoot;
        this.appService = new AppService(shadowRoot); // WindowManager depends on AppService
    }

    setupEventListeners() {
        // Window management events
        this.shadowRoot.addEventListener('launch-app', (e) => {
            this.appService.launchApplication(e.detail);
        });

        this.shadowRoot.addEventListener('window-close', (e) => {
            this.handleWindowClose(e.detail);
        });

        this.shadowRoot.addEventListener('window-minimize', (e) => {
            this.handleWindowMinimize(e.detail);
        });

        this.shadowRoot.addEventListener('restore-window', (e) => {
            this.handleWindowRestore(e.detail);
        });

        this.shadowRoot.addEventListener('window-focus', (e) => {
            this.handleWindowFocus(e.detail);
        });
    }

    handleWindowClose(details) {
        const { windowId, appName } = details;
        
        // Update dock to remove running indicator if no more windows
        const remainingWindows = this.shadowRoot.querySelectorAll(`window-component[app-name="${appName}"]`);
        if (remainingWindows.length <= 1) { // <= 1 because the closing window is still in DOM
            const dock = this.shadowRoot.querySelector('dock-component');
            if (dock) {
                dock.closeApp(this.appService.getAppIdFromName(appName));
            }
        }
        
        // Update URL after window closes
        setTimeout(() => {
            this.appService.updateURLWithOpenApps();
        }, 100);
    }

    handleWindowMinimize(details) {
        const { windowId, appName, appIcon } = details;
        
        // Add to dock's minimized windows
        const dock = this.shadowRoot.querySelector('dock-component');
        if (dock) {
            dock.minimizeWindow(windowId, appName, appIcon);
        }
    }

    handleWindowRestore(details) {
        const { windowId } = details;
        
        // Find and restore the window
        const windows = this.shadowRoot.querySelectorAll('window-component');
        windows.forEach(window => {
            if (window.windowState && window.windowState.id === windowId) {
                window.restore();
            }
        });
    }

    handleWindowFocus(details) {
        const { windowId, appName } = details;
        
        // Unfocus all other windows
        const windows = this.shadowRoot.querySelectorAll('window-component');
        windows.forEach(window => {
            if (window.windowState && window.windowState.id !== windowId) {
                window.unfocus();
            }
        });
        
        // Update menu bar
        const menuBar = this.shadowRoot.querySelector('menu-bar-component');
        if (menuBar) {
            menuBar.setActiveApp(appName);
        }
    }
}