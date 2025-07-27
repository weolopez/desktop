# Dynamic Component System Integration

WE-OS integrates with a sophisticated **Dynamic Component System** that enables ES6 web component applications to be built and dynamically loaded at runtime. This system provides the foundation for WE-OS's application ecosystem, allowing for secure, modular, and extensible application development.

## System Overview

The Dynamic Component System is an external service located at `/wc/dynamic-component-system/` that provides:

- **Dynamic Loading**: Load web components from URLs or code strings
- **Component Registry**: Central registry mapping MIME types to web components
- **Event-Driven API**: Custom events for component registration and content rendering
- **Security Model**: Safe code execution with import resolution and error handling
- **Extensible Architecture**: Support for multiple content types and custom renderers

### Architecture Components

```
Dynamic Component System
├── Component Registry (MIME type → Web Component mapping)
├── Component Loader (URL/String loading with import resolution)
├── Event System (PUBLISH_COMPONENT, PUBLISH_TEXT, COMPONENT_REGISTERED)
├── MIME Type Support (JavaScript, Markdown, Mermaid, HTML, CSS, JSON)
└── Security Layer (Blob URLs, safe execution, error handling)
```

## Component Loading Mechanisms

### 1. Loading from URLs

The system can dynamically import web components from external URLs:

```javascript
// Via event system
document.dispatchEvent(new CustomEvent('PUBLISH_COMPONENT', {
    detail: { 
        url: '/apps/my-webapp.js', 
        mimeType: 'application/javascript' 
    }
}));

// Direct API usage
import { loadComponentFromUrl } from '/wc/dynamic-component-system/src/component-loader.js';
const tagName = await loadComponentFromUrl('/apps/my-webapp.js');
```

**Features:**
- **Import Resolution**: Automatically converts relative imports to absolute URLs
- **Error Handling**: Graceful failure with detailed error reporting
- **Duplicate Detection**: Handles already-registered components
- **Tag Name Extraction**: Automatically detects `customElements.define()` calls

### 2. Loading from Code Strings

Components can be loaded directly from JavaScript code strings:

```javascript
const componentCode = `
class MyComponent extends HTMLElement {
    connectedCallback() {
        this.innerHTML = '<h1>Hello from Dynamic Component!</h1>';
    }
}
customElements.define('my-component', MyComponent);
`;

document.dispatchEvent(new CustomEvent('PUBLISH_COMPONENT', {
    detail: { 
        code: componentCode, 
        mimeType: 'application/javascript-custom' 
    }
}));
```

**Features:**
- **Blob URL Creation**: Safe execution via Blob URLs
- **Automatic Cleanup**: Memory management with URL revocation
- **Source Processing**: Relative import resolution even in code strings
- **Validation**: Component definition validation

### 3. Import Resolution System

The system automatically processes relative imports in component code:

```javascript
// Original code with relative imports
const componentSource = `
import { utils } from './utils.js';
import { config } from '/config/app-config.js';
`;

// Automatically converted to absolute URLs
const processedSource = `
import { utils } from 'https://example.com/apps/utils.js';
import { config } from 'https://example.com/config/app-config.js';
`;
```

## Event-Driven API

### Component Registration Events

#### PUBLISH_COMPONENT
Registers a new component in the system:

```javascript
document.dispatchEvent(new CustomEvent('PUBLISH_COMPONENT', {
    detail: {
        url: '/apps/calculator-webapp.js',        // Component URL
        mimeType: 'application/javascript',       // MIME type
        // OR
        code: 'class MyComponent...',             // Inline code
        mimeType: 'application/javascript-inline'
    }
}));
```

#### COMPONENT_REGISTERED
Fired when component registration completes:

```javascript
document.addEventListener('COMPONENT_REGISTERED', (event) => {
    const { mimeType, success, tagName, error } = event.detail;
    if (success) {
        console.log(`Component ${tagName} registered for ${mimeType}`);
    } else {
        console.error(`Registration failed: ${error}`);
    }
});
```

### Content Rendering Events

#### PUBLISH_TEXT
Renders content using a registered component:

```javascript
document.dispatchEvent(new CustomEvent('PUBLISH_TEXT', {
    detail: {
        mimeType: 'text/markdown',
        texts: ['# Hello World\nThis is **markdown** content.']
    }
}));
```

#### INNER_HTML
Returns rendered HTML content:

```javascript
document.addEventListener('INNER_HTML', (event) => {
    const { element } = event.detail;
    document.getElementById('output').appendChild(element);
});
```

## MIME Type Registry

### Supported MIME Types

```javascript
export const MIME_TYPES = {
    JAVASCRIPT: 'application/javascript',
    MERMAID: 'text/x-mermaid',
    PLAIN_TEXT: 'text/plain',
    MARKDOWN: 'text/markdown',
    JSON: 'application/json',
    CSS: 'text/css',
    HTML: 'text/html'
};
```

### Registry Operations

```javascript
// Get component registry
const registry = componentSystem.getRegistry();

// Register component
registry.register('text/custom', {
    tagName: 'custom-renderer',
    sourceUrl: '/components/custom-renderer.js'
});

// Check registration
if (registry.hasComponent('text/markdown')) {
    const componentInfo = registry.getComponent('text/markdown');
    console.log('Tag name:', componentInfo.tagName);
}

// List all registered components
const allComponents = registry.listRegistered();
```

## WE-OS Integration

### Startup System Integration

The Dynamic Component System is integrated into WE-OS's startup system as the **AppService**:

```javascript
// config.json
{
    "name": "AppService",
    "path": "/wc/dynamic-component-system/src/index.js",
    "required": false,
    "priority": 1,
    "config": {
        "constructorArgs": [],
        "postInit": "init",
        "postInitArgs": ["desktopComponent"]
    }
}
```

### Desktop Component Integration

The desktop component initializes the system and provides access to the registry:

```javascript
// In desktop-component.js
async function initializeAppService() {
    this.appService = startupManager.getComponent('AppService');
    if (this.appService) {
        // System is ready for dynamic component loading
        console.log('Dynamic Component System available');
    }
}
```

### Application Loading

Desktop applications are loaded through the dynamic component system:

```javascript
// Launch application via dynamic loading
const launchApp = async (appPath, appName, appIcon) => {
    // Register the component
    document.dispatchEvent(new CustomEvent('PUBLISH_COMPONENT', {
        detail: { url: appPath, mimeType: 'application/javascript' }
    }));
    
    // Wait for registration
    return new Promise((resolve) => {
        document.addEventListener('COMPONENT_REGISTERED', (event) => {
            if (event.detail.success) {
                const tagName = event.detail.tagName;
                
                // Create window and add component
                const window = document.createElement('window-component');
                window.setAttribute('app-name', appName);
                window.setAttribute('app-icon', appIcon);
                
                const appComponent = document.createElement(tagName);
                window.appendChild(appComponent);
                
                resolve({ window, component: appComponent });
            }
        }, { once: true });
    });
};
```

## Application Development Guide

### Building Dynamic Web Components

#### Basic Application Structure

```javascript
// my-calculator-webapp.js
class CalculatorWebApp extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }
    
    connectedCallback() {
        this.render();
        this.setupEventListeners();
    }
    
    render() {
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    padding: 20px;
                    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
                }
                .calculator {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 10px;
                    max-width: 300px;
                }
                button {
                    padding: 20px;
                    font-size: 18px;
                    border: none;
                    border-radius: 8px;
                    background: #f0f0f0;
                    cursor: pointer;
                }
            </style>
            <div class="calculator">
                <input type="text" id="display" readonly />
                <button data-number="7">7</button>
                <button data-number="8">8</button>
                <!-- ... more buttons -->
            </div>
        `;
    }
    
    setupEventListeners() {
        this.shadowRoot.addEventListener('click', (e) => {
            if (e.target.dataset.number) {
                this.appendNumber(e.target.dataset.number);
            }
        });
    }
    
    appendNumber(number) {
        const display = this.shadowRoot.getElementById('display');
        display.value += number;
    }
}

// Register the component
customElements.define('calculator-webapp', CalculatorWebApp);
```

#### Content Renderer Components

```javascript
// markdown-renderer.js
class MarkdownRenderer extends HTMLElement {
    set textContent(value) {
        this._textContent = value;
        this.render();
    }
    
    get textContent() {
        return this._textContent;
    }
    
    connectedCallback() {
        this.render();
    }
    
    render() {
        if (!this._textContent) return;
        
        // Simple markdown to HTML conversion
        const html = this._textContent
            .replace(/^# (.*$)/gim, '<h1>$1</h1>')
            .replace(/^## (.*$)/gim, '<h2>$1</h2>')
            .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
            .replace(/\*(.*)\*/gim, '<em>$1</em>');
            
        this.innerHTML = html;
    }
}

customElements.define('markdown-renderer', MarkdownRenderer);
```

### Advanced Component Features

#### Inter-Component Communication

```javascript
class ChatWebApp extends HTMLElement {
    sendMessage(message) {
        // Use WE-OS event bus for inter-component communication
        document.dispatchEvent(new CustomEvent('APP_MESSAGE', {
            detail: {
                from: 'chat-webapp',
                type: 'message',
                data: { message, timestamp: Date.now() }
            }
        }));
    }
    
    connectedCallback() {
        // Listen for system events
        document.addEventListener('NOTIFICATION_RECEIVED', (e) => {
            this.displayNotification(e.detail);
        });
    }
}
```

#### File System Integration

```javascript
class FileManagerWebApp extends HTMLElement {
    async loadFile(filePath) {
        // Integrate with WE-OS virtual file system
        const fileContent = await this.getFileContent(filePath);
        
        // Use dynamic component system to render based on file type
        const mimeType = this.getMimeTypeFromPath(filePath);
        document.dispatchEvent(new CustomEvent('PUBLISH_TEXT', {
            detail: { mimeType, texts: [fileContent] }
        }));
    }
}
```

## Security Model

### Safe Code Execution

The system provides multiple security layers:

#### 1. Blob URL Isolation
```javascript
// Components execute in isolated Blob URLs
const blob = new Blob([componentSource], { type: "text/javascript" });
const url = URL.createObjectURL(blob);
await import(url);
URL.revokeObjectURL(url); // Automatic cleanup
```

#### 2. Import Validation
```javascript
// Only processes known import patterns
const SAFE_IMPORT_REGEX = /from\s+['"`]\.\/([^'"`]+)['"`]/g;
const processedSource = componentSource.replace(SAFE_IMPORT_REGEX, ...);
```

#### 3. Error Handling
```javascript
try {
    await import(componentUrl);
} catch (error) {
    if (error.message.includes('already been used')) {
        console.warn('Component already registered');
        // Handle gracefully
    } else {
        console.error('Component loading failed:', error);
        // Provide fallback
    }
}
```

#### 4. Registry Validation
```javascript
register(mimeType, componentInfo) {
    if (!mimeType || !componentInfo || !componentInfo.tagName) {
        console.error('Invalid component registration data.');
        return;
    }
    // Safe registration
}
```

## Performance Considerations

### 1. Lazy Loading
```javascript
// Components are loaded only when needed
const loadAppOnDemand = async (appName) => {
    if (!registry.hasComponent(appName)) {
        await loadComponentFromUrl(`/apps/${appName}.js`);
    }
    return registry.getComponent(appName);
};
```

### 2. Component Caching
```javascript
// Registry maintains loaded components
const componentCache = new Map();
const getCachedComponent = (mimeType) => {
    if (componentCache.has(mimeType)) {
        return componentCache.get(mimeType);
    }
    // Load and cache
};
```

### 3. Concurrent Loading
```javascript
// Multiple components can load simultaneously
const loadMultipleComponents = async (components) => {
    const loadPromises = components.map(comp => 
        loadComponentFromUrl(comp.url)
    );
    return Promise.all(loadPromises);
};
```

### 4. Memory Management
```javascript
// Automatic URL cleanup
export async function loadComponentFromString(componentSource, sourceUrl) {
    const url = URL.createObjectURL(blob);
    try {
        await import(url);
        return tagName;
    } finally {
        URL.revokeObjectURL(url); // Always cleanup
    }
}
```

## Examples and Use Cases

### 1. Basic Application Registration

```javascript
// Initialize system
import { DynamicComponentSystem } from '/wc/dynamic-component-system/src/index.js';
const system = new DynamicComponentSystem();
system.init();

// Register a calculator app
document.dispatchEvent(new CustomEvent('PUBLISH_COMPONENT', {
    detail: { 
        url: '/apps/calculator-webapp.js', 
        mimeType: 'application/javascript' 
    }
}));
```

### 2. Content Rendering System

```javascript
// Register content renderers
const renderers = [
    { url: '/components/markdown-renderer.js', mimeType: 'text/markdown' },
    { url: '/components/code-highlighter.js', mimeType: 'application/javascript' },
    { url: '/components/mermaid-renderer.js', mimeType: 'text/x-mermaid' }
];

renderers.forEach(renderer => {
    document.dispatchEvent(new CustomEvent('PUBLISH_COMPONENT', {
        detail: renderer
    }));
});

// Render markdown content
document.dispatchEvent(new CustomEvent('PUBLISH_TEXT', {
    detail: {
        mimeType: 'text/markdown',
        texts: ['# Welcome\nThis is **markdown** content!']
    }
}));
```

### 3. Live Code Execution

```javascript
// Execute JavaScript code dynamically
const executeCode = (code) => {
    document.dispatchEvent(new CustomEvent('PUBLISH_COMPONENT', {
        detail: {
            code: code,
            mimeType: `application/javascript-${Date.now()}`
        }
    }));
};

const sampleCode = `
class LiveComponent extends HTMLElement {
    connectedCallback() {
        this.innerHTML = '<h1>Live Code Execution!</h1>';
    }
}
customElements.define('live-component-${Date.now()}', LiveComponent);
`;

executeCode(sampleCode);
```

## Migration from Legacy App Service

### Old Pattern (Deprecated)
```javascript
// Legacy app service approach
class AppService {
    async launchApplication(appPath) {
        const response = await fetch(appPath);
        const componentCode = await response.text();
        eval(componentCode); // Security risk!
        // Manual window creation...
    }
}
```

### New Pattern (Dynamic Component System)
```javascript
// Modern dynamic component approach
const launchApplication = async (appPath, appName) => {
    // Safe, event-driven loading
    document.dispatchEvent(new CustomEvent('PUBLISH_COMPONENT', {
        detail: { url: appPath, mimeType: 'application/javascript' }
    }));
    
    // Wait for registration
    const registration = await new Promise(resolve => {
        document.addEventListener('COMPONENT_REGISTERED', resolve, { once: true });
    });
    
    if (registration.detail.success) {
        // Create application instance
        const app = document.createElement(registration.detail.tagName);
        return app;
    }
};
```

## Best Practices

### 1. Component Design
- Use Shadow DOM for style isolation
- Implement proper cleanup in `disconnectedCallback()`
- Follow Web Component standards
- Provide clear public APIs

### 2. Error Handling
- Always handle component loading failures
- Provide fallback content for unsupported types
- Use timeout mechanisms for long-running operations

### 3. Performance
- Implement lazy loading for large applications
- Use component pooling for frequently used components
- Minimize component registration overhead

### 4. Security
- Validate all external content
- Use MIME type validation
- Implement CSP headers where possible
- Sanitize user-provided content

## Conclusion

The Dynamic Component System provides WE-OS with a powerful, secure, and extensible foundation for building and loading applications. Its event-driven architecture, comprehensive security model, and support for multiple content types make it an ideal solution for a web-based operating system. The system's integration with WE-OS's startup system ensures optimal performance while maintaining the flexibility to dynamically load and execute components as needed.