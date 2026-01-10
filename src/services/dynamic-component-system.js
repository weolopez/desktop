/**
 * @module MimeTypes
 * @description Defines constants for supported MIME types.
 */

export const MIME_TYPES = {
    JAVASCRIPT: 'application/javascript',
    MERMAID: 'text/x-mermaid',
    PLAIN_TEXT: 'text/plain',
    MARKDOWN: 'text/markdown',
    JSON: 'application/json',
    CSS: 'text/css',
    HTML: 'text/html',
};

/**
 * Validates if a given MIME type is supported.
 * @param {string} mimeType - The MIME type to validate.
 * @returns {boolean} True if the MIME type is supported, false otherwise.
 */
export function isValidMimeType(mimeType) {
    return Object.values(MIME_TYPES).includes(mimeType);
}

/**
 * @module ComponentLoader
 * @description Handles secure loading and processing of web component code.
 */

const WEB_COMPONENT_TAG_REGEX = /customElements\.define\s*\(\s*['"`]([^'"`]+)['"`]/;

/**
 * Processes relative imports in the component source code, converting them to absolute URLs.
 * @param {string} componentSource - The source code of the component.
 * @param {string} sourceUrl - The URL from which the component was loaded.
 * @returns {string} The processed source code with absolute import paths. 
 */
function processRelativeImports(componentSource, sourceUrl) {
    if (!sourceUrl) return componentSource;

    const baseUrl = sourceUrl.substring(0, sourceUrl.lastIndexOf("/") + 1);

    // Support both 'from' and 'import' with './' or '/'
    // Handle any quote type " or ' or `
    return componentSource.replace(
        /(from|import)\s+(['"`])(\.?\/)([^'"`]+)\2/g,
        (match, keyword, quote, prefix, relativePath) => {
            try {
                // Resolve the path against the baseUrl to maintain original behavior
                const absoluteUrl = new URL(relativePath, baseUrl).href;
                return `${keyword} '${absoluteUrl}'`;
            } catch (e) {
                console.warn(`Failed to resolve import path: ${prefix}${relativePath}`, e);
                return match;
            }
        }
    );
}

/**
 * Loads a web component from a string of code.
 * @param {string} componentSource - The source code of the component.
 * @param {string|null} sourceUrl - The original URL of the component, if available.
 * @returns {Promise<string|null>} A promise that resolves with the component's tag name, or null on failure.
 */
export async function loadComponentFromString(componentUrl, componentSource, sourceUrl = null) {
    if (!sourceUrl) {
        sourceUrl = window.location.origin + "/";
    }

    if (componentUrl && !componentSource) {
        try {
            const response = await fetch(componentUrl);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            // Remove 'const' to update the function argument instead of creating a new local variable
            componentSource = await response.text();
        } catch (error) {
            console.error("Error fetching component source:", error);
            // Return null on error to prevent crashing at line 83
            return null;
        }
    }

    // Ensure we have source code before processing
    if (!componentSource) return null;

    const processedSource = processRelativeImports(componentSource, sourceUrl);
    const blob = new Blob([processedSource], { type: "text/javascript" });
    const url = URL.createObjectURL(blob);

    try {
        await import(url);
        const match = processedSource.match(WEB_COMPONENT_TAG_REGEX);
        return match ? match[1] : null;
    } catch (error) {
        if (error.message.includes('already been used with this registry')) {
            console.warn(`Component with tag name already registered: ${error.message}`);
            const match = processedSource.match(WEB_COMPONENT_TAG_REGEX);
            return match ? match[1] : null;
        }
        console.error("Error loading web component from string:", error);
        return null;
    } finally {
        URL.revokeObjectURL(url);
    }
}


/**
 * @class ComponentRegistry
 * @description Central registry for managing MIME type to web component mappings.
 */
export class ComponentRegistry {
    constructor() {
        // Map to store component information, with mimeType as the key.
        this.components = new Map();
        // A set of accepted MIME types, initialized with default types.
        this.acceptedMimeTypes = new Set(['application/javascript', 'text/x-mermaid', 'text/plain']);
    }

    /**
     * Registers a new component with its MIME type.
     * @param {string} mimeType - The MIME type to associate with the component.
     * @param {object} componentInfo - Information about the component, including tagName and sourceUrl.
     */
    register(mimeType, componentInfo) {
        if (!mimeType || !componentInfo || !componentInfo.tagName) {
            console.error('Invalid component registration data.', { mimeType, componentInfo });
            return;
        }
        this.components.set(mimeType, componentInfo);
        if (!this.acceptedMimeTypes.has(mimeType)) {
            this.acceptedMimeTypes.add(mimeType);
        }
        console.log(`Component registered for MIME type: ${mimeType}`, componentInfo);
    }

    /**
     * Retrieves component information for a given MIME type.
     * @param {string} mimeType - The MIME type to look up.
     * @returns {object|undefined} The component information object or undefined if not found.
     */
    getComponent(mimeType) {
        return this.components.get(mimeType);
    }

    /**
     * Checks if a component is registered for a given MIME type.
     * @param {string} mimeType - The MIME type to check.
     * @returns {boolean} True if a component is registered, false otherwise.
     */
    hasComponent(mimeType) {
        return this.components.has(mimeType);
    }

    /**
     * Unregisters a component for a given MIME type.
     * @param {string} mimeType - The MIME type to unregister.
     */
    unregister(mimeType) {
        if (this.components.has(mimeType)) {
            this.components.delete(mimeType);
            // Note: We don't remove from acceptedMimeTypes to avoid issues if it's a default type.
            console.log(`Component for MIME type ${mimeType} unregistered.`);
        }
    }

    /**
     * Lists all registered components.
     * @returns {Map<string, object>} A map of all registered components.
     */
    listRegistered() {
        return this.components;
    }
}

/**
 * Initializes the dynamic component system by setting up event listeners.
 * @param {ComponentRegistry} registry - An instance of the ComponentRegistry.
 */
export function initializeEventHandlers(registry) {
    if (!(registry instanceof ComponentRegistry)) {
        throw new Error('A valid ComponentRegistry instance is required.');
    }

    /**
     * Handles the PUBLISH_COMPONENT event to register new components.
     */
    document.addEventListener('PUBLISH_COMPONENT', async (e) => {
        const { url, code, mimeType, launch} = e.detail || {};
        if (!mimeType) {
            console.error('PUBLISH_COMPONENT event requires a mimeType.');
            return;
        }

        let tagName = null;
        let sourceUrl = url || null;

        try {
            tagName = await loadComponentFromString(url, code);

            if (tagName) {
                registry.register(mimeType, { tagName, sourceUrl });
                document.dispatchEvent(new CustomEvent('COMPONENT_REGISTERED', {
                    bubbles: true,
                    composed: true,
                    detail: { mimeType, success: true, tagName, launch }
                }));
            } else {
                throw new Error('Failed to load or define component.');
            }
        } catch (error) {
            console.error(`Failed to register component for ${mimeType}:`, error);
            // document.dispatchEvent(new CustomEvent('COMPONENT_REGISTERED', {
            //     bubbles: true,
            //     composed: true,
            //     detail: { mimeType, success: false, error: error.message }
            // }));
        }
    });

    /**
     * Handles the PUBLISH_TEXT event to render content using a registered component.
     */
    document.addEventListener('PUBLISH_TEXT', (e) => {
        const { mimeType, texts } = e.detail || {};
        const content = (Array.isArray(texts) ? texts[0] : texts) || '';

        let html;
        let element;
        if (registry.hasComponent(mimeType)) {
            const componentInfo = registry.getComponent(mimeType);
            element = document.createElement(componentInfo.tagName);
            element.textContent = content;
            html = element.outerHTML;
        } else {
            // Fallback for unregistered MIME types
            const pre = document.createElement('pre');
            pre.textContent = content;
            html = `<div style="background:#f0f0f0;color:#333;padding:10px;border:1px solid #ccc;">${pre.outerHTML}</div>`;
        }

        document.dispatchEvent(new CustomEvent('INNER_HTML', {
            bubbles: true,
            composed: true,
            detail: { element }
        }));
    });
    // Listen for events to verify they're working
    document.addEventListener('LAUNCH_APP', (e) => {
        console.log('✅ LAUNCH_APP event received:', e.detail);
    });
}

/**
 * @class DynamicComponentSystem
 * @description Main class to initialize and manage the dynamic component system.
 */
export class DynamicComponentSystem {
    constructor() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.addEventListener('PUBLISH_COMPONENT', async (e) => {
            const { detail } = e;
            const tagName = await loadComponentFromString(detail.url, detail.code, detail.sourceUrl);
            this.dispatchRegistrationResult(tagName, detail);
        });
    }


    dispatchRegistrationResult(tagName, originalDetail) {
        const event = new CustomEvent('COMPONENT_REGISTERED', {
            detail: {
                ...originalDetail,
                tagName,
                success: !!tagName,
                error: !tagName ? 'Failed to load component' : null
            }
        });
        document.dispatchEvent(event);
    }

}