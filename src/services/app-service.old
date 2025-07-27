import { APPS, APP_URL_MAP } from '../config.js';
import { MESSAGES, validateMessagePayload } from '../events/message-types.js';
import { DynamicComponentSystem, MIME_TYPES } from '/wc/dynamic-component-system/src/index.js';

const WEB_COMPONENT_TAG_REGEX = /customElements\.define\s*\(\s*['"`]([^'"`]+)['"`]/;

export class AppService {
    constructor() {
        this.desktopComponent = null;
        if (!window.dynamicComponentSystem) {
            window.dynamicComponentSystem = new DynamicComponentSystem();
            window.dynamicComponentSystem.init();
            this.registerDesktopComponents();
        }
    }

    init(desktopComponent) {
        this.desktopComponent = desktopComponent;
        document.addEventListener(MESSAGES.PUBLISH_TEXT, this.handlePublishTextEvent.bind(this));
        document.addEventListener(MESSAGES.LAUNCH_APP, this.handleLaunchAppEvent.bind(this));
        
        // Listen for finder file events (following the same pattern as PUBLISH_TEXT)
        document.addEventListener(MESSAGES.FINDER_FILE_CONTENT, this.handleFileContentEvent.bind(this));
        document.addEventListener(MESSAGES.FINDER_FILE_REFERENCE, this.handleFileReferenceEvent.bind(this));

        // Listen for the rendered HTML from the dynamic system
        document.addEventListener('INNER_HTML', this.handleInnerHtmlEvent.bind(this));
    }
    handleLaunchAppEvent(event) {
        if (!validateMessagePayload(MESSAGES.LAUNCH_APP, event.detail)) {
            console.warn('Invalid LAUNCH_APP event payload:', event.detail);
            return;
        }
        
        if (event.detail && event.detail.id) {
            this.launchApp(event.detail);
        }
    }
    
    handlePublishTextEvent(event) {
        if (!validateMessagePayload(MESSAGES.PUBLISH_TEXT, event.detail)) {
            console.warn('Invalid PUBLISH_TEXT event payload:', event.detail);
            return;
        }
        
        const { texts, icon } = event.detail;
        const textArray = Array.isArray(texts) ? texts : [texts];
        console.log("=== APP SERVICE TEXT HANDLING (via PUBLISH_TEXT event) ===");
        console.log("Number of texts to process:", textArray.length);

        for (const text of textArray) {
            this._processSingleText(text, icon);
        }
    }

    handleFileContentEvent(event) {
        if (!validateMessagePayload(MESSAGES.FINDER_FILE_CONTENT, event.detail)) {
            console.warn('Invalid FINDER_FILE_CONTENT event payload:', event.detail);
            return;
        }
        
        console.log("=== FILE CONTENT EVENT ===");
        console.log("File:", event.detail.name);
        console.log("MIME Type:", event.detail.mimeType);
        console.log("Category:", event.detail.category);
        
        this._processFileContent(event.detail);
    }

    handleFileReferenceEvent(event) {
        if (!validateMessagePayload(MESSAGES.FINDER_FILE_REFERENCE, event.detail)) {
            console.warn('Invalid FINDER_FILE_REFERENCE event payload:', event.detail);
            return;
        }
        
        console.log("=== FILE REFERENCE EVENT ===");
        console.log("File:", event.detail.name);
        console.log("MIME Type:", event.detail.mimeType);
        console.log("Reason:", event.detail.reason);
        
        this._processFileReference(event.detail);
    }

    registerDesktopComponents() {
        // Pre-register components that the desktop environment knows about.
        document.dispatchEvent(new CustomEvent('PUBLISH_COMPONENT', {
            detail: { url: '/wc/mermaid-diagram.js', mimeType: MIME_TYPES.MERMAID }
        }));
        // document.dispatchEvent(new CustomEvent('PUBLISH_COMPONENT', {
        //     detail: { url: '/wc/dynamic-component-system/components/markdown-renderer.js', mimeType: MIME_TYPES.MARKDOWN }
        // }));
        document.dispatchEvent(new CustomEvent('PUBLISH_COMPONENT', {
            detail: { url: '/wc/dynamic-component-system/components/javascript-renderer.js', mimeType: MIME_TYPES.JAVASCRIPT }
        }));
        //  document.dispatchEvent(new CustomEvent('PUBLISH_COMPONENT', {
        //     detail: { url: '/wc/dynamic-component-system/components/code-highlighter.js', mimeType: MIME_TYPES.JSON }
        // }));
        //  document.dispatchEvent(new CustomEvent('PUBLISH_COMPONENT', {
        //     detail: { url: '/wc/dynamic-component-system/components/code-highlighter.js', mimeType: MIME_TYPES.HTML }
        // }));
        //  document.dispatchEvent(new CustomEvent('PUBLISH_COMPONENT', {
        //     detail: { url: '/wc/dynamic-component-system/components/code-highlighter.js', mimeType: MIME_TYPES.CSS }
        // }));
    }

    handleInnerHtmlEvent(e) {
        const contentDiv = document.createElement('div');
        contentDiv.innerHTML = e.detail.html;
        this.desktopComponent.addContent({
            appName: 'Content Viewer',
            appIcon: '📄',
            width: 600,
            height: 400,
            content: contentDiv,
        });
    }

    _processSingleText(text, icon = "📄") {
        let mimeType = MIME_TYPES.PLAIN_TEXT;
        const trimmedText = text.trim();

        // Simple content sniffing
        if (WEB_COMPONENT_TAG_REGEX.test(trimmedText)) {
            mimeType = MIME_TYPES.JAVASCRIPT;
        } else if (trimmedText.startsWith('{') || trimmedText.startsWith('[')) {
            try {
                JSON.parse(trimmedText);
                mimeType = MIME_TYPES.JSON;
            } catch (e) { /* Not valid JSON */ }
        } else if (trimmedText.startsWith('<') && trimmedText.endsWith('>')) {
            mimeType = MIME_TYPES.HTML;
        } else if (trimmedText.match(/^#+\s/m)) {
            mimeType = MIME_TYPES.MARKDOWN;
        } else if (trimmedText.includes('graph TD') || trimmedText.includes('sequenceDiagram')) {
            mimeType = MIME_TYPES.MERMAID;
        }

        // document.dispatchEvent(new CustomEvent('PUBLISH_TEXT', {
        //     bubbles: true,
        //     composed: true,
        //     detail: { texts: [text], mimeType }
        // }));
    }

    handleFiles(files) {
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

            console.log(`Successfully launched app: ${JSON.stringify(app)}`);
        } catch (error) {
            console.error(`Failed to launch app "${app.name || app.id || "App"}" with state:`, { initialState: app.initialState || {}, error });
        }
    }

    // File processing methods (following the pattern of _processSingleText)
    _processFileContent(fileData) {
        const { extension, mimeType, category, content } = fileData;
        
        console.log("Processing file content:", {
            extension,
            mimeType,
            category,
            contentLength: content ? content.length : 0
        });
        
        if (this._isTextFile(extension, mimeType)) {
            this._processSingleText(content, "📄");
        } else if (this._isImageFile(extension, mimeType)) {
            console.log("Image file detected - would open in image viewer (not implemented yet)");
            // Future: this._openInImageViewer(fileData);
        } else {
            console.log("Unknown file type - using default handling");
            this._openWithDefaultApp(fileData);
        }
    }

    _processFileReference(fileData) {
        const { extension, mimeType, reason, name } = fileData;
        
        console.log("Processing file reference:", {
            name,
            extension,
            mimeType,
            reason
        });
        
        // For now, just log the reference - could show notification or create placeholder
        console.log(`File "${name}" cannot be opened directly: ${reason}`);
        
        // Future: Show notification or create file info dialog
    }

    // File type detection helpers
    _isTextFile(extension, mimeType) {
        const textExtensions = ['.md', '.txt', '.js', '.html', '.css', '.json', '.xml', '.yaml', '.yml', '.log'];
        const textMimeTypes = ['text/', 'application/json', 'application/javascript', 'application/xml'];
        
        return textExtensions.includes(extension.toLowerCase()) ||
               textMimeTypes.some(type => mimeType.startsWith(type));
    }

    _isImageFile(extension, mimeType) {
        const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg', '.webp'];
        return imageExtensions.includes(extension.toLowerCase()) || mimeType.startsWith('image/');
    }

    _openWithDefaultApp(fileData) {
        console.log("Opening with default app (TextEdit fallback):", fileData.name);
        // For now, fallback to TextEdit for unknown file types
        this._openInTextEdit(fileData);
    }

}

export const appService = new AppService();
