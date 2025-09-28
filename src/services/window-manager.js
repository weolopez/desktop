import eventBus from "../events/event-bus.js";
import { MESSAGES } from "../events/message-types.js";

export class WindowManager {
    constructor(desktopComponent, appService) {
        console.log('🔧 WindowManager constructor - Setting up with desktopComponent:', desktopComponent);
        this.desktopComponent = desktopComponent
        this.desktopComponent.windowManager = this;
        console.log('🔧 WindowManager constructor - windowManager assigned to desktopComponent:', !!this.desktopComponent.windowManager);
        this.appService = appService
        this.setupEventListeners();
        this.desktopComponent._initializeLoadedServices()
    }

    setupEventListeners() {
        // Window management events
        document.addEventListener(MESSAGES.WINDOW_CLOSED, (e) => {
            this.handleWindowClose(e.detail);
            this.saveWindowsState();
        });

        document.addEventListener(MESSAGES.WINDOW_MINIMIZE, (e) => {
            this.handleWindowMinimize(e.detail);
            this.saveWindowsState();
        });

        document.addEventListener(MESSAGES.WINDOW_RESTORE, (e) => {
            this.handleWindowRestore(e.detail);
        });

        document.addEventListener(MESSAGES.WINDOW_FOCUS, (e) => {
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
        eventBus.publish(MESSAGES.WINDOW_FOCUSED, {
            windowId,
            appName
        });
    }

    getNextZIndex() {
        const windows = this.desktopComponent.getWindows();
        let maxZ = 100;
        windows.forEach(win => {
            const z = parseInt(win.style.zIndex) || 100;
            maxZ = Math.max(maxZ, z);
        });
        return maxZ + 1;
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

                    if (!state || !state.sourceUrl) {
                        console.warn('🔄 WindowManager - Invalid window state, skipping:', state);

                        // get text and tag to local storage
                        const text = localStorage.getItem(`web-component-${state.appTag}`);
                        if (text) {
                            console.log('🔄 WindowManager - Found saved text for tag:', state.appTag);
                        } else {
                            console.warn('🔄 WindowManager - No saved text found for tag:', state.appTag);
                            continue
                        }
                        await this.desktopComponent.importText(text, state.sourceUrl);
                    } else {
                        await this.desktopComponent.importUrl(state.sourceUrl);
                    }

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
                        isMinimized: state.isMinimized || false,
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