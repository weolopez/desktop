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
    
    async handleText(texts) {
        // Handle pasted text
        const textArray = Array.isArray(texts) ? texts : [texts];
        for (const text of textArray) {
            console.log('Pasted text:', text);

            // Check if it's a URL
            try {
                const url = new URL(text);
                if (url.protocol === 'http:' || url.protocol === 'https:') {
                    // Check if it's a JavaScript file
                    if (url.pathname.endsWith('.js')) {
                        try {
                            // Dynamically import the module
                            const module = await import(url.href);

                            // Attempt to find a custom element definition
                            // Assuming the web component registers itself with a tag name
                            // We'll try to infer a tag name from the URL or module
                            let tagName = null;
                            if (module.default && module.default.name) {
                                // If the module exports a default class, use its name
                                tagName = module.default.name.toLowerCase();
                            } else {
                                // Otherwise, try to infer from the filename
                                const fileName = url.pathname.split('/').pop();
                                if (fileName) {
                                    tagName = fileName.replace('.js', '').replace(/([A-Z])/g, '-$1').toLowerCase();
                                }
                            }

                            if (tagName && customElements.get(tagName)) {
                                console.log(`Found web component: ${tagName}`);
                                // Launch it in a window-component
                                const window = document.createElement('window-component');
                                window.setAttribute('app-name', tagName);
                                window.setAttribute('app-icon', '🌐'); // Generic web icon
                                window.setAttribute('x', 150 + (Math.random() * 200));
                                window.setAttribute('y', 150 + (Math.random() * 100));
                                window.setAttribute('width', '800');
                                window.setAttribute('height', '600');

                                const webComponent = document.createElement(tagName);
                                window.appendChild(webComponent);

                                const desktopContent = document.body.firstElementChild;
                                desktopContent.appendChild(window);

                                // const menuBar = this.shadowRoot.querySelector('menu-bar-component');
                                // if (menuBar) {
                                //     menuBar.setActiveApp(tagName);
                                // }
                                this.updateURLWithOpenApps();
                            } else {
                                console.log('Not a registered web component or could not infer tag name.');
                                // Handle as plain text if not a web component
                                this.displayPlainTextInWindow(text, 'Pasted URL Content');
                            }
                        } catch (importError) {
                            console.warn('Failed to import JavaScript URL as module:', importError);
                            // Fallback to plain text if import fails
                            this.displayPlainTextInWindow(text, 'Pasted URL Content');
                        }
                    } else {
                        // Not a JS file, treat as plain text or open in a generic viewer
                        this.displayPlainTextInWindow(text, 'Pasted URL');
                    }
                } else {
                    // Not http/https, treat as plain text
                    this.displayPlainTextInWindow(text, 'Pasted Text');
                }
            } catch (e) {
                // Not a valid URL, treat as plain text
                this.displayPlainTextInWindow(text, 'Pasted Text');
            }
        }
    }

    displayPlainTextInWindow(content, title = 'Pasted Text') {
        const window = document.createElement('window-component');
        window.setAttribute('app-name', title);
        window.setAttribute('app-icon', '📄');
        window.setAttribute('x', 150 + (Math.random() * 200));
        window.setAttribute('y', 150 + (Math.random() * 100));
        window.setAttribute('width', '500');
        window.setAttribute('height', '300');

        const contentDiv = document.createElement('div');
        contentDiv.style.padding = '20px';
        contentDiv.style.whiteSpace = 'pre-wrap';
        contentDiv.style.wordBreak = 'break-word';
        contentDiv.textContent = content;
        window.appendChild(contentDiv);

        const desktopContent = this.shadowRoot.querySelector('.desktop-content');
        desktopContent.appendChild(window);

        const menuBar = this.shadowRoot.querySelector('menu-bar-component');
        if (menuBar) {
            menuBar.setActiveApp(title);
        }
        this.updateURLWithOpenApps();
    }
    handleFiles(files) {
        // Handle dropped files
        files.forEach(file => {
            console.log('Dropped file:', file);
            // You can implement further logic here, like creating a file icon or displaying it
        });
    }

}