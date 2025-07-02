export class WindowManager {
    constructor(shadowRoot) {
        this.shadowRoot = shadowRoot;
    }

    setupEventListeners() {
        // Window management events
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
                const appService = new AppService(this.shadowRoot);
                dock.closeApp(appService.getAppIdFromName(appName));
            }
        }
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
        
        // Dispatch focus event
        this.shadowRoot.dispatchEvent(new CustomEvent('window-focused', {
            detail: { windowId, appName },
            bubbles: true,
            composed: true
        }));
    }
}