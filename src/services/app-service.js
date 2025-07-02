import { APP_URL_MAP } from '../config.js';

const WEB_COMPONENT_TAG_REGEX = /customElements\.define\s*\(\s*['"`]([^'"`]+)['"`]/;

export class AppService {
    constructor(shadowRoot) {
        this.shadowRoot = shadowRoot;
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
        this.loadWebComponentFromTag(tag);
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

    loadWebComponentFromTag(tag) {
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

    _createWindow(options) {
        const {
            appName,
            appIcon,
            x = 150 + (Math.random() * 200),
            y = 150 + (Math.random() * 100),
            width = 600,
            height = 400,
            content,
        } = options;

        const windowEl = document.createElement("window-component");
        windowEl.setAttribute("app-name", appName);
        windowEl.setAttribute("app-icon", appIcon);
        windowEl.setAttribute("x", x);
        windowEl.setAttribute("y", y);
        windowEl.setAttribute("width", width);
        windowEl.setAttribute("height", height);

        if (content) {
            windowEl.appendChild(content);
        }

        const desktopContent = this.shadowRoot.querySelector(".desktop-content");
        desktopContent.appendChild(windowEl);

        this.shadowRoot.dispatchEvent(
            new CustomEvent("app-launched", {
                detail: { appName },
                bubbles: true,
                composed: true,
            }),
        );

        return windowEl;
    }
}
