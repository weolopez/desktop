// import { APPS } from '../config.js';

export class AppService {
    constructor(shadowRoot) {
        this.shadowRoot = shadowRoot;
    }

    async handleText(texts) {
        // Handle pasted text
        const textArray = Array.isArray(texts) ? texts : [texts];
        console.log("=== APP SERVICE TEXT HANDLING ===");
        console.log("Number of texts to process:", textArray.length);

        for (const text of textArray) {
            console.log("Processing text:", {
                length: text.length,
                preview: text.substring(0, 200) +
                    (text.length > 200 ? "..." : ""),
                containsMeta: text.includes("<meta"),
                containsHTML: text.includes("<") && text.includes(">"),
                isURL: text.startsWith("http"),
            });
            //is text a javascript web component? contains customElements.define
            const match = text.match(
                /customElements\.define\s*\(\s*['"`]([^'"`]+)['"`]/,
            );
            const tag = match ? match[1] : null;
            if (tag) {
                console.log("=== WEB COMPONENT DETECTED ===");
                console.log("Component tag:", tag);
                console.log(
                    "Component contains imports:",
                    text.includes("import"),
                );
                console.log(
                    "Component contains relative imports:",
                    text.includes("from './"),
                );
                console.log(
                    "Specific finder-service import found:",
                    text.includes("from './finder-service.js'"),
                );

                // Determine source URL based on component type
                let sourceUrl = null;
                if (tag === "finder-webapp" || text.includes("FinderService")) {
                    sourceUrl =
                        "https://weolopez.com/desktop/src/apps/finder/finder-webapp.js";
                    console.log(
                        "Detected finder component, using source URL:",
                        sourceUrl,
                    );
                }

                await this.loadComponentFromString(text, sourceUrl);
                this.loadWebComponentFromTag(tag);
                return; // Stop further processing if a web component is detected
            } else {
                // Check if it's a URL
                try {
                    const url = new URL(text);
                    if (url.protocol === "http:" || url.protocol === "https:") {
                        // Check if it's a JavaScript file
                        if (url.pathname.endsWith(".js")) {
                            //import url to load web component
                            console.log("Detected URL:", url.href);
                            const res = await import(url.href)
                            //fetch the url to get the text to find the tag
                            const response = await fetch(url.href);
                            const text = await response.text();
                            let tagName = text.match(
                                /customElements\.define\s*\(\s*['"`]([^'"`]+)['"`]/,
                            );
                            tagName = tagName ? tagName[1] : null;
                            let element = document.createElement(tagName || "div");
                            this._createWindow({
                                appName: tagName ? tagName[1] : "JavaScript File",
                                appIcon: "📄", 
                                width: 500,
                                height: 300,
                                content: element,
                            });

                        }
                    } else {
                        // Not http/https, treat as plain text
                        this.displayPlainTextInWindow(text, "Pasted Text");
                    }
                } catch (e) {
                    // Not a valid URL, treat as plain text
                    this.displayPlainTextInWindow(text, "Pasted Text");
                }
            }
        }
    }

    async loadComponentFromString(moduleContent, sourceUrl = null) {
        console.log("=== DEBUGGING MODULE LOADING ===");
        console.log("Module content preview:", moduleContent.substring(0, 300));
        console.log(
            "Contains relative imports:",
            moduleContent.includes("from './"),
        );
        console.log(
            "Contains finder-service import:",
            moduleContent.includes("finder-service.js"),
        );
        console.log("Source URL provided:", sourceUrl);

        // Convert relative imports to absolute URLs if we have a source URL
        let processedContent = moduleContent;
        if (sourceUrl && moduleContent.includes("from './")) {
            console.log("Converting relative imports to absolute URLs...");
            const baseUrl = sourceUrl.substring(
                0,
                sourceUrl.lastIndexOf("/") + 1,
            );
            console.log("Base URL for imports:", baseUrl);

            // Replace relative imports with absolute URLs
            processedContent = moduleContent.replace(
                /from\s+['"`]\.\/([^'"`]+)['"`]/g,
                (match, relativePath) => {
                    const absoluteUrl = baseUrl + relativePath;
                    console.log(
                        `Converting: ${match} -> from '${absoluteUrl}'`,
                    );
                    return `from '${absoluteUrl}'`;
                },
            );
        }

        const blob = new Blob([processedContent], { type: "text/javascript" });
        const url = URL.createObjectURL(blob);
        console.log("Created blob URL:", url);
        console.log("Blob URL scheme:", new URL(url).protocol);

        try {
            await import(url);
            console.log("Web component loaded successfully.");
        } catch (error) {
            console.error("Error loading web component:", error);
            console.error("Error type:", error.constructor.name);
            console.error("Error message:", error.message);
            if (error.message.includes("Failed to resolve module specifier")) {
                console.error(
                    "Module resolution still failing - check if all imports are converted correctly",
                );
            }
        } finally {
            URL.revokeObjectURL(url);
        }
    }

    async loadWebComponentFromTag(tag) {
        // Create an instance of the component
        const myComplexElement = document.createElement(tag);

        // (Optional) Provide content for the slot
        const description = document.createElement("span");
        description.setAttribute("slot", "description");
        description.textContent =
            "This custom description has been inserted into the slot!";
        myComplexElement.appendChild(description);

        // Add the component to the page
        // document.body.appendChild(myComplexElement);
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
        // Handle dropped files
        files.forEach((file) => {
            console.log("Dropped file:", file);
            // You can implement further logic here, like creating a file icon or displaying it
        });
    }

    // getAppDetailsFromId(appId) {
    //     return APPS.find(app => app.id === appId);
    // }

    // getAppIdFromName(appName) {
    //     const app = APPS.find(app => app.name === appName);
    //     return app ? app.id : appName.toLowerCase().replace(/\s+/g, '-');
    // }

    // async launchApplication(appDetails) {
    //     const { appId, appName, appIcon } = appDetails;
    //     const windowEl = this._createWindow({
    //         appName,
    //         appIcon,
    //         width: 600,
    //         height: 400
    //     });

    //     await this.loadAppComponent(appId, windowEl);
    // }

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

        const desktopContent = this.shadowRoot.querySelector(
            ".desktop-content",
        );
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

    // async loadAppComponent(appId, windowElement) {
    //     try {
    //         const webappFileName = `${appId}-webapp.js`;

    //         // Import the app component dynamically
    //         await import(`../apps/${webappFileName}`);

    //         // Create and append the app component
    //         const appComponent = document.createElement(`${appId}-webapp`);
    //         windowElement.appendChild(appComponent);
    //     } catch (error) {
    //         console.warn(`Failed to load app component for ${appId}:`, error);
    //         // Fallback to placeholder content
    //         windowElement.innerHTML = `
    //             <div style="padding: 40px; text-align: center; color: #666;">
    //                 <h2>${appId}</h2>
    //                 <p>This application could not be loaded.</p>
    //             </div>
    //         `;
    //     }
    // }

    // loadAppsFromURL() {
    //     const urlParams = new URLSearchParams(window.location.search);
    //     const appsParam = urlParams.get('apps');

    //     if (appsParam) {
    //         const appFileNames = appsParam.split(',');
    //         appFileNames.forEach(async (fileName) => {
    //             if (fileName.endsWith('-webapp.js')) {
    //                 const appId = fileName.replace('-webapp.js', '');
    //                 const appDetails = this.getAppDetailsFromId(appId);
    //                 if (appDetails) {
    //                     await this.launchApplication(appDetails);
    //                 }
    //             }
    //         });
    //     }
    // }

    // updateURLWithOpenApps() {
    //     const windows = this.shadowRoot.querySelectorAll('window-component');
    //     const openApps = Array.from(windows).map(window => {
    //         const appName = window.getAttribute('app-name');
    //         const appId = this.getAppIdFromName(appName);
    //         return `${appId}-webapp.js`;
    //     });

    //     const url = new URL(window.location);
    //     if (openApps.length > 0) {
    //         url.searchParams.set('apps', openApps.join(','));
    //     } else {
    //         url.searchParams.delete('apps');
    //     }

    //     window.history.replaceState({}, '', url);
    // }
}
