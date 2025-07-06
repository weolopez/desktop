import { APP_URL_MAP } from '../config.js';

const WEB_COMPONENT_TAG_REGEX = /customElements\.define\s*\(\s*['"`]([^'"`]+)['"`]/;

export class AppService {
    constructor() {
        this.desktopComponent = null;
    }

    init(desktopComponent) {
        this.desktopComponent = desktopComponent;
        document.addEventListener('PUBLISH_TEXT', this.handlePublishTextEvent.bind(this));
        document.addEventListener('LAUNCH_APP', this.handleLaunchAppEvent.bind(this));
    }
    handleLaunchAppEvent(event) {
        this.launchApp( event.detail )
    }
    handlePublishTextEvent(event) {
        const { texts, icon } = event.detail;
        const textArray = Array.isArray(texts) ? texts : [texts];
        console.log("=== APP SERVICE TEXT HANDLING (via PUBLISH_TEXT event) ===");
        console.log("Number of texts to process:", textArray.length);

        for (const text of textArray) {
            this._processSingleText(text, icon);
        }
    }

    async _processSingleText(text, icon = "📄") {

        const match = text.match(WEB_COMPONENT_TAG_REGEX);
        const tag = match ? match[1] : null;

        if (tag) {
            await this._handleWebComponentText(text, tag);
        } else if (text.trim().toLowerCase().endsWith('.js')) {
            try {
                const url = new URL(text, window.location.origin);
                await this._handleUrl(url, icon);
            } catch (e) {
                this._handlePlainText(text);
            }
        } else {
            this._handlePlainText(text);
        }
    }

    async _handleWebComponentText(text, tag) {
        console.log("=== WEB COMPONENT DETECTED ===");
        console.log("Component tag:", tag);

        const sourceUrl = APP_URL_MAP.get(tag);
        if (sourceUrl) {
            console.log("Found source URL for component:", sourceUrl);
        }

        await this.loadComponentFromString(text, sourceUrl);
        this.loadWebComponentFromTag(tag, sourceUrl);
    }

    async _handleUrl(url, icon = "📄") {
        // Check if the URL is in APP_URL_MAP values
        for (const app of APP_URL_MAP.entries()) {
            const [id, sourceUrl] = app;
            // Accept both absolute and relative matches
            if (url.href === sourceUrl || url.pathname === sourceUrl) {
                // If found, launch the app by appId (strip -webapp if present)
                // Optionally, you can pass initialState with sourceUrl if needed
                this.launchApp(app)
                return;
            }
        }

        if ((url.protocol === "http:" || url.protocol === "https:") && url.pathname.endsWith(".js")) {
            console.log("Detected JavaScript URL:", url.href);
            try {
                const response = await fetch(url.href);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const text = await response.text();
                const match = text.match(WEB_COMPONENT_TAG_REGEX);
                const tagName = match ? match[1] : null;


                try {
                    await import(url.href);
                } catch (error) {
                    console.warn("Failed to import module:", error);   
                }

                loadWebComponentFromTag(tagName, url.href)
            } catch (error) {
                console.error("Failed to handle JavaScript URL:", error);
                this.displayPlainTextInWindow(url.href, "Failed to Load URL");
            }
        } else {
            this._handlePlainText(url.href);
        }
    }

    _handlePlainText(text) {
        this.displayPlainTextInWindow(text, "Pasted Text");
    }

    async loadComponentFromString(moduleContent, sourceUrl = null) {
        console.log("=== DEBUGGING MODULE LOADING ===");
        let processedContent = moduleContent;
        if (sourceUrl && moduleContent.includes("from './")) {
            console.log("Converting relative imports to absolute URLs...");
            const baseUrl = sourceUrl.substring(0, sourceUrl.lastIndexOf("/") + 1);
            console.log("Base URL for imports:", baseUrl);

            processedContent = moduleContent.replace(
                /from\s+['"`]\.\/([^'"`]+)['"`]/g,
                (match, relativePath) => {
                    const absoluteUrl = baseUrl + relativePath;
                    console.log(`Converting: ${match} -> from '${absoluteUrl}'`);
                    return `from '${absoluteUrl}'`;
                },
            );
        }

        const blob = new Blob([processedContent], { type: "text/javascript" });
        const url = URL.createObjectURL(blob);

        try {
            await import(url);
            console.log("Web component loaded successfully from string.");
        } catch (error) {
            console.error("Error loading web component from string:", error);
        } finally {
            URL.revokeObjectURL(url);
        }
    }
//  config={ id: 'chat', name: 'Chat', icon: '💬', sourceUrl: '/chat/chat-component.js', tag: "chat-component", onstartup: false },
    loadWebComponentFromTag(tag, sourceUrl, config) {
        tag = tag || (config && config.tag)
        const myComplexElement = document.createElement(tag);
        const description = document.createElement("span");
        description.setAttribute("slot", "description");
        description.textContent = "This custom description has been inserted into the slot!";
        myComplexElement.appendChild(description);

        this._createWindow({
            appName: (config && config.name) || tag || "Web Component",
            appIcon: (config && config.icon) || "🌐",
            width: 600,
            height: 400,
            content: myComplexElement,
            sourceUrl: sourceUrl || (config && config.sourceUrl)
        });
        console.log("Web component instance created and added to the window.");
    }

    displayPlainTextInWindow(content, title = "Pasted Text") {
        const contentDiv = document.createElement("div");
        contentDiv.style.padding = "20px";
        contentDiv.style.whiteSpace = "pre-wrap";
        contentDiv.style.wordBreak = "break-word";
        contentDiv.textContent = content;

        this._createWindow({
            appName: title,
            appIcon: "📄",
            width: 500,
            height: 300,
            content: contentDiv,
        });
    }

    handleFiles(files) {
        // This method is a placeholder for handling dropped files.
        // Future implementation could involve reading file contents,
        // displaying images, or creating file icons on the desktop.
        files.forEach((file) => {
            console.log("Dropped file:", file.name, file.type);
        });
    }

    async launchApp(app) {
        try {
            try {
                const module = await import(app.sourceUrl);
            } catch (error) {
                console.error('❌ Failed to import module:', app.sourceUrl, error);
                // Handle the failure case
                throw new Error(`Module import failed: ${error.message}`);
            }
            
                // const sourceText = await (await fetch(sourceUrl)).text();
                // const tag = this.getTagNameFromSource(sourceText);
                // if (!tag) {
                //     throw new Error(`Could not determine tag name from source: ${sourceUrl}`);
                // }
                // console.log(`Determined tag: ${tag}`);
            let element = document.createElement(app.tag );
            // if (appName === 'Safari') {
            //     console.log('Creating new Safari instance.');
            //     element = document.createElement('safari-chrome-webapp');
            // } else {
            //     console.log(`Creating generic div for app: ${appName}`);
            //     element = document.createElement('div');
            //     element.textContent = `Content for ${appName}`;
            // }

            // if (initialState && initialState.appState) {
            //     element.setAttribute('initial-state', JSON.stringify(initialState.appState));
            // }

            this._createWindow({
                appName: app.name || app.id || "App",
                appIcon: app.icon || (app.initialState ? app.initialState.appIcon : '📄'),
                content: element,
                initialState: app.initialState || {},
                sourceUrl: app.sourceUrl
            });
            console.log(`Successfully launched app: ${JSON.stringify(app)}`);
        } catch (error) {
            console.error(`Failed to launch app "${app.name || app.id || "App"}" with state:`, { initialState: app.initialState || {}, error });
        }
    }

    _createWindow(options) {
        const {
            appName,
            appIcon,
            content,
            initialState,
            sourceUrl
        } = options;

        const x = initialState?.x != null ? initialState.x : 150 + (Math.random() * 200);
        const y = initialState?.y != null ? initialState.y : 150 + (Math.random() * 100);
        const width = initialState?.width != null ? initialState.width : 600;
        const height = initialState?.height != null ? initialState.height : 400;

        console.log('🏭 AppService _createWindow - Creating window with values:', {
            x, y, width, height,
            isMinimized: initialState?.isMinimized,
            isMaximized: initialState?.isMaximized,
            initialState
        });

        const windowEl = document.createElement("window-component");
        windowEl.appName = appName;
        windowEl.appIcon = appIcon || "📄"; // Default icon if not provided
        // windowEl.setAttribute("app-name", appName);
        // windowEl.setAttribute("app-icon", appIcon);
        if (sourceUrl) {
            windowEl.setAttribute("source-url", sourceUrl);
        }
        //windowEl.setAttribute("x", x);
        windowEl.x = x; // For consistency with existing code
        // windowEl.setAttribute("y", y);
        // windowEl.setAttribute("width", width);
        // windowEl.setAttribute("height", height);
        windowEl.y = y; // For consistency with existing code
        windowEl.width = width; // For consistency with existing code
        windowEl.height = height; // For consistency with existing code

        console.log('🏭 AppService _createWindow - Set basic attributes, now checking state flags');

        if (initialState?.isMinimized) {
            console.log('🏭 AppService _createWindow - Setting minimized attribute');
            //windowEl.setAttribute('minimized', '');
            windowEl.isMinimized = true; // For consistency with existing code

        }
        if (initialState?.isMaximized) {
            console.log('🏭 AppService _createWindow - Setting maximized attributes');
            windowEl.isMaximized = true; // For consistency with existing code
            windowEl.x = initialState.savedX || x; // Use saved position if available
            windowEl.y = initialState.savedY || y; // Use saved position if available
            windowEl.width = initialState.savedWidth || width; // Use saved size if available
            windowEl.height = initialState.savedHeight || height; // Use saved size if available
            // windowEl.setAttribute('saved-x', initialState.savedX);
            // windowEl.setAttribute('saved-y', initialState.savedY);
            // windowEl.setAttribute('saved-width', initialState.savedWidth);
            // windowEl.setAttribute('saved-height', initialState.savedHeight);
        }

        console.log('🏭 AppService _createWindow - All attributes set, element ready for DOM insertion');

        if (content) {
            windowEl.appendChild(content);
        }

        this.desktopComponent.addWindow(windowEl);

        this.desktopComponent.dispatchEvent(
            new CustomEvent("app-launched", {
                detail: { appName },
                bubbles: true,
                composed: true,
            }),
        );

        return windowEl;
    }

    getTagNameFromSource(source) {
        const match = source.match(WEB_COMPONENT_TAG_REGEX);
        return match ? match[1] : null;
    }
}

export const appService = new AppService();
