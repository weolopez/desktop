import { APP_URL_MAP } from '../config.js';

const WEB_COMPONENT_TAG_REGEX = /customElements\.define\s*\(\s*['"`]([^'"`]+)['"`]/;

class AppService {
    constructor() {
        this.desktopComponent = null;
    }

    init(desktopComponent) {
        this.desktopComponent = desktopComponent;
    }

    async handleText(texts) {
        const textArray = Array.isArray(texts) ? texts : [texts];
        console.log("=== APP SERVICE TEXT HANDLING ===");
        console.log("Number of texts to process:", textArray.length);

        for (const text of textArray) {
            this._processSingleText(text);
        }
    }

    async _processSingleText(text) {
        console.log("Processing text:", {
            length: text.length,
            preview: text.substring(0, 200) + (text.length > 200 ? "..." : ""),
            isURL: text.startsWith("http"),
        });

        const match = text.match(WEB_COMPONENT_TAG_REGEX);
        const tag = match ? match[1] : null;

        if (tag) {
            await this._handleWebComponentText(text, tag);
        } else {
            try {
                const url = new URL(text);
                await this._handleUrl(url);
            } catch (e) {
                this._handlePlainText(text);
            }
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

    async _handleUrl(url) {
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

                const element = document.createElement(tagName || "div");
                this._createWindow({
                    appName: tagName || "JavaScript File",
                    appIcon: "📄",
                    width: 500,
                    height: 300,
                    content: element,
                    sourceUrl: url.href
                });
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
            console.warn("Error loading web component from string:", error);
            // Optionally, provide user feedback here
        } finally {
            URL.revokeObjectURL(url);
        }
    }

    loadWebComponentFromTag(tag, sourceUrl) {
        const myComplexElement = document.createElement(tag);
        const description = document.createElement("span");
        description.setAttribute("slot", "description");
        description.textContent = "This custom description has been inserted into the slot!";
        myComplexElement.appendChild(description);

        this._createWindow({
            appName: "Web Component",
            appIcon: "🌐",
            width: 600,
            height: 400,
            content: myComplexElement,
            sourceUrl: sourceUrl
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

    async launchApp(appName, initialState = null) {
        console.log(`Attempting to launch app: ${appName} with state:`, initialState);
        try {
            let element;
            let sourceUrl = initialState ? initialState.sourceUrl : null;

            if (sourceUrl) {
                console.log(`Restoring from source URL: ${sourceUrl}`);
                await import(sourceUrl);
                const sourceText = await (await fetch(sourceUrl)).text();
                const tag = this.getTagNameFromSource(sourceText);
                if (!tag) {
                    throw new Error(`Could not determine tag name from source: ${sourceUrl}`);
                }
                console.log(`Determined tag: ${tag}`);
                element = document.createElement(tag);
            } else if (appName === 'Safari') {
                console.log('Creating new Safari instance.');
                element = document.createElement('safari-chrome-webapp');
            } else {
                console.log(`Creating generic div for app: ${appName}`);
                element = document.createElement('div');
                element.textContent = `Content for ${appName}`;
            }

            if (initialState && initialState.appState) {
                element.setAttribute('initial-state', JSON.stringify(initialState.appState));
            }

            this._createWindow({
                appName,
                appIcon: initialState ? initialState.appIcon : '📄',
                content: element,
                initialState: initialState,
                sourceUrl: sourceUrl
            });
            console.log(`Successfully launched app: ${appName}`);
        } catch (error) {
            console.error(`Failed to launch app "${appName}" with state:`, { initialState, error });
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
