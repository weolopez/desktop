export class WindowManager {
    constructor(desktopComponent, appService) {
        this.desktopComponent = desktopComponent;
        this.appService = appService;
    }

    setupEventListeners() {
        // Window management events
        document.addEventListener('window-close', (e) => {
            this.handleWindowClose(e.detail);
            this.saveWindowsState();
        });

        document.addEventListener('window-minimize', (e) => {
            this.handleWindowMinimize(e.detail);
            this.saveWindowsState();
        });

        document.addEventListener('restore-window', (e) => {
            this.handleWindowRestore(e.detail);
        });

        document.addEventListener('window-focus', (e) => {
            this.handleWindowFocus(e.detail);
        });

        window.addEventListener('beforeunload', () => {
            this.saveWindowsState();
        });
    }

    handleWindowClose(details) {
        const { windowId, appName } = details;
        
        // Update dock to remove running indicator if no more windows
        const remainingWindows = this.desktopComponent.getWindows();
        let count = 0;
        remainingWindows.forEach(win => {
            if (win.getAttribute('app-name') === appName) {
                count++;
            }
        });

        if (count <= 1) { // <= 1 because the closing window is still in DOM
            const dock = document.querySelector('dock-component');
            if (dock) {
                dock.closeApp(this.appService.getAppIdFromName(appName));
            }
        }
    }

    handleWindowMinimize(details) {
        const { windowId, appName, appIcon, appTag } = details;
        
        // Add to dock's minimized windows
        const dock = this.desktopComponent.shadowRoot.querySelector('dock-component');
        if (dock) {
            dock.minimizeWindow(windowId, appName, appIcon, appTag);
        }
    }

    handleWindowRestore(details) {
        const { windowId } = details;
        
        // Find and restore the window
        const windows = this.desktopComponent.getWindows();
        windows.forEach(window => {
            if (window.windowState && window.windowState.id === windowId) {
                window.restore();
            }
        });
    }

    handleWindowFocus(details) {
        const { windowId, appName } = details;
        
        // Unfocus all other windows
        const windows = this.desktopComponent.getWindows();
        windows.forEach(window => {
            if (window.windowState && window.windowState.id !== windowId) {
                window.unfocus();
            }
        });
        
        // Dispatch focus event
        document.dispatchEvent(new CustomEvent('window-focused', {
            detail: { windowId, appName },
            bubbles: true,
            composed: true
        }));
    }

    saveWindowsState() {
        const windows = this.desktopComponent.getWindows();
        const windowsState = [];
        windows.forEach(window => {
            windowsState.push(window.windowState);
        });
        localStorage.setItem('desktopWindowsState', JSON.stringify(windowsState));
    }

    async restoreWindowsState() {
        console.log('🔄 WindowManager - Starting window state restoration');
        const savedState = localStorage.getItem('desktopWindowsState');
        if (savedState) {
            try {
                const windowsState = JSON.parse(savedState);
                console.log('🔄 WindowManager - Found saved state:', windowsState);
                
                // Use a for...of loop to handle async app launching sequentially
                for (const state of windowsState) {

                    await this.desktopComponent.importUrl(state.sourceUrl)

                    console.log('🔄 WindowManager - Restoring window:', state);
                    this.desktopComponent.addApp({
                        name: state.appName,
                        icon: state.appIcon,
                        tag: state.appTag,
                        sourceUrl: state.sourceUrl,
                        x: state.x,
                        y: state.y,
                        width: state.width,
                        height: state.height,
                    });
                    // await this.appService.launchApp(state);
                }
                console.log('🔄 WindowManager - All windows restored');
            } catch (e) {
                console.error("Failed to parse or restore window state:", e);
                localStorage.removeItem('desktopWindowsState'); // Clear corrupted state
            }
        } else {
            console.log('🔄 WindowManager - No saved state found');
        }
    }
}