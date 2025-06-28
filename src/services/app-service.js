import { APPS } from '../config.js';

export class AppService {
    constructor(shadowRoot) {
        this.shadowRoot = shadowRoot;
    }

    getAppDetailsFromId(appId) {
        return APPS.find(app => app.id === appId);
    }

    getAppIdFromName(appName) {
        const app = APPS.find(app => app.name === appName);
        return app ? app.id : appName.toLowerCase().replace(/\s+/g, '-');
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
        if (menuBar) {
            menuBar.setActiveApp(appName);
        }
        
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
}