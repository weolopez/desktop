import { APPS } from '../config.js';

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
        if (event.detail && event.detail.id) {
            this.launchApp(event.detail);
        }
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
        for (const app of APP_URL_MAP.entries()) {
            const [id, sourceUrl] = app;
            if (url.href === sourceUrl || url.pathname === sourceUrl) {
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
        //check to see if talk is already loaded and if config.static is true
        if (customElements.get(tag)) {
            console.log(`Web component with tag "${tag}" is already defined.`);
            if (config && config.static) {
                console.log(`Static component "${tag}" already loaded, skipping creation.`);
                return;
            }
        }


        tag = tag || (config && config.tag)
        const myComplexElement = document.createElement(tag);
        const description = document.createElement("span");
        description.setAttribute("slot", "description");
        description.textContent = "This custom description has been inserted into the slot!";
        myComplexElement.appendChild(description);

        this.desktopComponent.addApp({
            name: (config && config.name) || tag || "Web Component",
            icon: (config && config.icon) || "🌐",
            width: 600,
            height: 400,
            tag: tag,
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

        // this._createWindow({
        this.desktopComponent.addContent({
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

    async launchApp(app, state) {

        try {
            if (!app || !app.sourceUrl) {
                app = APPS.find(a => a.id === app.id || a.name === app.name);
                if (!app || !app.sourceUrl) {
                    throw new Error("Invalid app configuration. Missing sourceUrl.");
                }
            }
            // Set isRunning to true for the launched app
            const appRef = APPS.find(a => a.id === app.id);
            if (appRef) {
                appRef.isRunning = true;
            }
            if (app.running && app.static) {
                console.log(`Static component "${app.tag}" already loaded, skipping creation.`);
                return;
            } else app.running = true;
            try {
                const module = await import(app.sourceUrl);
            } catch (error) {
                console.error('❌ Failed to import module:', app.sourceUrl, error);
                // Handle the failure case
                throw new Error(`Module import failed: ${error.message}`);
            }

            this.desktopComponent.addApp(app);


            // let element = document.createElement(app.tag );
            // this._createWindow({
            //     appName: app.name || app.id || "App",
            //     appIcon: app.icon || (app.initialState ? app.initialState.appIcon : '📄'),
            //     content: element,
            //     initialState: state || {},
            //     sourceUrl: app.sourceUrl
            // });
            console.log(`Successfully launched app: ${JSON.stringify(app)}`);
        } catch (error) {
            console.error(`Failed to launch app "${app.name || app.id || "App"}" with state:`, { initialState: app.initialState || {}, error });
        }
    }

    // _createWindow(options) {
    //     this.desktopComponent.addApp(options);
    // }

    getTagNameFromSource(source) {
        const match = source.match(WEB_COMPONENT_TAG_REGEX);
        return match ? match[1] : null;
    }
}

export const appService = new AppService();
