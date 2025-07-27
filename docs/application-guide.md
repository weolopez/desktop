# Application Development Guide

This guide documents how to build applications for WE-OS based on the patterns used by existing applications in the system.

## Application Architecture

### Web Component Foundation

All WE-OS applications are built as Web Components that follow a standard pattern:

```javascript
class MyWebApp extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        // Initialize component state
    }

    connectedCallback() {
        this.render();
        this.setupEventListeners();
        this.handleInitialState();
    }

    disconnectedCallback() {
        // Clean up resources
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                /* Component-scoped styles */
            </style>
            <!-- Component HTML -->
        `;
    }

    setupEventListeners() {
        // Set up event handling
    }
}

customElements.define('my-webapp', MyWebApp);
```

### Application Registration

Applications are registered in `src/config.js`:

```javascript
export const APPS = [
    { 
        id: 'my-app',                    // Unique identifier
        name: 'My App',                  // Display name
        icon: '🚀',                      // Icon (emoji or URL)
        sourceUrl: '../apps/my-webapp.js', // Component file path
        tag: "my-webapp",                // Web component tag
        onstartup: false                 // Whether to launch on startup
    }
];
```

## Built-in Application Reference

### Terminal Application

**File**: `src/apps/terminal-webapp.js`

The Terminal provides a Unix-like command-line interface with a virtual file system.

#### Features
- **Virtual File System**: Complete directory structure with Unix-like navigation
- **Command Support**: `ls`, `cd`, `pwd`, `cat`, `mkdir`, `rm`, `mv`, `cp`, `echo`, `touch`
- **Command History**: Up/down arrow navigation through command history
- **Desktop Integration**: `open` command to launch other applications

#### Key Implementation Patterns

**File System Structure**:
```javascript
initializeFileSystem() {
    return {
        '/': {
            type: 'directory',
            children: {
                'Users': {
                    type: 'directory',
                    children: {
                        'desktop': {
                            type: 'directory',
                            children: {
                                'Documents': { type: 'directory', children: {} },
                                'Downloads': { type: 'directory', children: {} },
                                'Desktop': { type: 'directory', children: {} },
                                'welcome.txt': { 
                                    type: 'file', 
                                    content: 'Welcome to the virtual desktop terminal!' 
                                }
                            }
                        }
                    }
                },
                'Applications': {
                    type: 'directory',
                    children: {
                        'terminal-webapp.js': { type: 'file', content: '// Terminal app' },
                        'textedit-webapp.js': { type: 'file', content: '// TextEdit app' }
                    }
                }
            }
        }
    };
}
```

**Command Processing**:
```javascript
executeCommand(command) {
    const [cmd, ...args] = command.trim().split(/\s+/);
    
    switch (cmd) {
        case 'ls':
            return this.listDirectory(args[0] || this.currentPath);
        case 'cd':
            return this.changeDirectory(args[0] || '/Users/desktop');
        case 'open':
            this.openApplication(args[0]);
            return `Opening ${args[0]}...`;
        // ... more commands
    }
}
```

**Desktop Integration**:
```javascript
openApplication(appName) {
    // Launch application via event system
    document.dispatchEvent(new CustomEvent(MESSAGES.LAUNCH_APP, {
        detail: {
            id: appName,
            name: appName,
            sourceUrl: `/apps/${appName}-webapp.js`
        }
    }));
}
```

### TextEdit Application

**File**: `src/apps/textedit-webapp.js`

A text editor application with file content handling.

#### Features
- **Text Editing**: Full-featured textarea with syntax highlighting support
- **File Integration**: Handles file content from finder or direct input
- **Content Display**: Shows file metadata and editing status
- **External Component Integration**: Imports chat functionality

#### Key Implementation Patterns

**File Content Handling**:
```javascript
handleInitialState() {
    // Listen for file content from finder or other sources
    document.addEventListener(MESSAGES.FINDER_FILE_CONTENT, (event) => {
        this.loadFileContent(event.detail);
    });
}

loadFileContent(fileData) {
    this.fileContent = fileData;
    const { name, content, mimeType, path } = fileData;
    
    // Update UI with file information
    const fileHeader = this.shadowRoot.querySelector('.file-header');
    const fileInfo = this.shadowRoot.querySelector('.file-info');
    const textEditor = this.shadowRoot.querySelector('.text-editor');
    
    fileInfo.textContent = `${name} (${mimeType})`;
    fileHeader.classList.add('visible');
    textEditor.value = content;
}
```

**Component Styling Pattern**:
```javascript
render() {
    this.shadowRoot.innerHTML = `
        <style>
            :host {
                display: flex;
                flex-direction: column;
                height: 100%;
                font-family: -apple-system, BlinkMacSystemFont, sans-serif;
            }
            .file-header {
                background: #f5f5f5;
                border-bottom: 1px solid #ddd;
                padding: 10px 15px;
                font-size: 12px;
                color: #666;
                display: none;
            }
            .file-header.visible {
                display: block;
            }
            .text-editor {
                flex: 1;
                padding: 15px;
                border: none;
                outline: none;
                font-family: 'SF Mono', 'Monaco', 'Cascadia Code', monospace;
                font-size: 13px;
                line-height: 1.5;
                resize: none;
            }
        </style>
        <div class="file-header">
            <div class="file-info"></div>
        </div>
        <div class="content-area">
            <textarea class="text-editor" placeholder="Start typing..."></textarea>
        </div>
    `;
}
```

### System Preferences Application

**File**: `src/apps/system-preferences-webapp.js`

A settings application that controls desktop appearance and behavior.

#### Features
- **Wallpaper Management**: Change desktop wallpapers
- **Configuration Control**: Modify startup configuration
- **Settings Persistence**: Save settings to localStorage or config files
- **Live Preview**: Real-time preview of changes

#### Key Implementation Patterns

**Desktop Component Integration**:
```javascript
connectedCallback() {
    // Get reference to desktop component for control
    this.desktopComponent = document.querySelector('desktop-component');
    this.render();
    this.setupEventListeners();
}
```

**Settings Management**:
```javascript
applyWallpaper(imagePath) {
    if (this.desktopComponent) {
        this.desktopComponent.setWallpaper(imagePath);
        
        // Notify system of wallpaper change
        document.dispatchEvent(new CustomEvent(MESSAGES.WALLPAPER_CHANGED, {
            detail: {
                category: 'wallpaper',
                key: 'background-image',
                value: imagePath
            }
        }));
        
        // Persist to storage
        if (this.saveToLocalStorage) {
            localStorage.setItem('desktop-wallpaper', imagePath);
        }
    }
}
```

**Configuration Interface**:
```javascript
render() {
    this.shadowRoot.innerHTML = `
        <style>
            .settings-container {
                display: flex;
                height: 100%;
            }
            .sidebar {
                width: 200px;
                background: #e8e8e8;
                border-right: 1px solid #d0d0d0;
            }
            .content {
                flex: 1;
                padding: 20px;
                background: #f6f6f6;
            }
        </style>
        <div class="settings-container">
            <div class="sidebar">
                <button class="sidebar-item" data-section="wallpaper">
                    🖼️ Wallpaper
                </button>
                <button class="sidebar-item" data-section="startup">
                    🚀 Startup
                </button>
            </div>
            <div class="content" id="settings-content">
                <!-- Dynamic content based on selected section -->
            </div>
        </div>
    `;
}
```

### Safari/Chrome Browser Application

**File**: `src/apps/safari-webapp.js`, `src/apps/safari-chrome-webapp.js`

Web browser applications with different backend implementations.

#### Features
- **Web Browsing**: Navigate to any URL
- **Session Management**: Maintain browser sessions
- **Navigation Controls**: Back, forward, refresh, address bar
- **Integration Options**: Both local iframe and headless Chrome backends

#### Key Implementation Patterns

**Browser Interface**:
```javascript
render() {
    this.shadowRoot.innerHTML = `
        <style>
            .browser-container {
                display: flex;
                flex-direction: column;
                height: 100%;
            }
            .browser-toolbar {
                display: flex;
                align-items: center;
                padding: 8px;
                background: #f5f5f5;
                border-bottom: 1px solid #ddd;
            }
            .browser-content {
                flex: 1;
                position: relative;
            }
        </style>
        <div class="browser-container">
            <div class="browser-toolbar">
                <button id="back-btn">←</button>
                <button id="forward-btn">→</button>
                <button id="refresh-btn">↻</button>
                <input type="url" id="address-bar" placeholder="Enter URL..." />
                <button id="go-btn">Go</button>
            </div>
            <div class="browser-content">
                <iframe id="browser-frame" src="about:blank"></iframe>
            </div>
        </div>
    `;
}
```

### Preview Application

**Files**: `src/apps/preview/preview-webapp.js`, `src/apps/preview/preview-service.js`

File preview application with service architecture.

#### Features
- **Multi-format Support**: Images, documents, and other file types
- **Service Architecture**: Separate service for preview logic
- **Dynamic Loading**: On-demand component instantiation
- **Fallback Handling**: Graceful handling of unsupported formats

#### Key Implementation Patterns

**Service Integration**:
```javascript
// preview-service.js
export class PreviewService {
    async launchPreview(imageData) {
        const window = document.createElement('window-component');
        window.setAttribute('app-name', 'Preview');
        window.setAttribute('app-icon', '🖼️');
        
        await this.loadPreviewComponent(window, imageData);
        
        const desktopContent = this.shadowRoot.querySelector('.desktop-content');
        desktopContent.appendChild(window);
    }
    
    async loadPreviewComponent(windowElement, imageData) {
        try {
            await import('./preview-webapp.js');
            const previewComponent = document.createElement('preview-webapp');
            windowElement.appendChild(previewComponent);
            previewComponent.setImageData(imageData);
        } catch (error) {
            // Fallback content
            windowElement.innerHTML = `
                <div style="padding: 40px; text-align: center;">
                    <h2>Preview</h2>
                    <p>Failed to load image preview.</p>
                </div>
            `;
        }
    }
}
```

## Application Development Patterns

### 1. Component Structure

#### Basic Template
```javascript
class MyWebApp extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        
        // Initialize state
        this.appState = {
            data: null,
            isLoading: false,
            error: null
        };
    }

    connectedCallback() {
        this.render();
        this.setupEventListeners();
        this.handleInitialState();
    }

    disconnectedCallback() {
        // Clean up resources
        this.removeEventListeners();
    }

    render() {
        this.shadowRoot.innerHTML = this.getTemplate();
    }

    getTemplate() {
        return `
            <style>${this.getStyles()}</style>
            ${this.getHTML()}
        `;
    }

    getStyles() {
        return `
            :host {
                display: block;
                height: 100%;
                font-family: -apple-system, BlinkMacSystemFont, sans-serif;
            }
            /* Component-specific styles */
        `;
    }

    getHTML() {
        return `
            <div class="app-container">
                <!-- App content -->
            </div>
        `;
    }
}

customElements.define('my-webapp', MyWebApp);
```

### 2. Event Handling Patterns

#### Desktop Integration
```javascript
setupEventListeners() {
    // Listen for system events
    document.addEventListener(MESSAGES.FINDER_FILE_CONTENT, (event) => {
        this.handleFileContent(event.detail);
    });
    
    // Listen for app-specific events
    document.addEventListener('my-app:custom-event', (event) => {
        this.handleCustomEvent(event.detail);
    });
    
    // Internal event listeners
    this.shadowRoot.addEventListener('click', (event) => {
        this.handleInternalClick(event);
    });
}

removeEventListeners() {
    // Remove listeners to prevent memory leaks
    document.removeEventListener(MESSAGES.FINDER_FILE_CONTENT, this.handleFileContent);
}
```

#### Communication with Other Components
```javascript
notifyOtherComponents(data) {
    // Send custom event
    document.dispatchEvent(new CustomEvent('my-app:data-updated', {
        bubbles: true,
        composed: true,
        detail: data
    }));
}

requestNotification(message) {
    // Use notification system
    document.dispatchEvent(new CustomEvent(MESSAGES.CREATE_NOTIFICATION, {
        detail: {
            sourceAppId: 'my-app',
            title: 'My App',
            body: message,
            icon: '🚀'
        }
    }));
}
```

### 3. State Management

#### Local State
```javascript
updateState(newState) {
    this.appState = { ...this.appState, ...newState };
    this.render(); // Re-render on state change
}

persistState() {
    // Save to localStorage
    localStorage.setItem('my-app-state', JSON.stringify(this.appState));
}

restoreState() {
    // Restore from localStorage
    const savedState = localStorage.getItem('my-app-state');
    if (savedState) {
        this.appState = { ...this.appState, ...JSON.parse(savedState) };
    }
}
```

#### Window State Integration
```javascript
handleInitialState() {
    // Get window component reference
    const windowComponent = this.closest('window-component');
    if (windowComponent) {
        // Access window state
        const windowState = windowComponent.windowState;
        console.log('Window position:', windowState.x, windowState.y);
        
        // Listen for window events
        windowComponent.addEventListener('window-moved', (event) => {
            this.handleWindowMoved(event.detail);
        });
    }
}
```

### 4. File Handling

#### File Content Processing
```javascript
handleFileContent(fileData) {
    const { name, content, mimeType, extension, size } = fileData;
    
    // Process based on file type
    switch (mimeType) {
        case 'text/plain':
        case 'text/markdown':
            this.displayTextContent(content, name);
            break;
        case 'image/jpeg':
        case 'image/png':
            this.displayImageContent(content, name);
            break;
        default:
            this.showUnsupportedFileMessage(name, mimeType);
    }
}

displayTextContent(content, filename) {
    const contentArea = this.shadowRoot.querySelector('.content-area');
    contentArea.innerHTML = `
        <div class="file-header">
            <h3>${filename}</h3>
        </div>
        <pre class="file-content">${content}</pre>
    `;
}
```

### 5. Integration with WebLLM Service

#### AI Integration Pattern
```javascript
async initializeAI() {
    // Check if WebLLM service is available
    document.addEventListener(MESSAGES.WEBLLM_SERVICE_READY, (event) => {
        this.webllmAvailable = true;
        this.setupAIFeatures();
    });
    
    // Listen for AI responses
    document.addEventListener(MESSAGES.WEBLLM_RESPONSE_COMPLETE, (event) => {
        this.handleAIResponse(event.detail);
    });
}

generateAIResponse(prompt) {
    if (!this.webllmAvailable) {
        console.warn('WebLLM service not available');
        return;
    }
    
    document.dispatchEvent(new CustomEvent(MESSAGES.WEBLLM_GENERATE_REQUEST, {
        detail: {
            messages: [{ role: 'user', content: prompt }],
            conversationId: `my-app-${Date.now()}`,
            options: {
                temperature: 0.7,
                maxTokens: 1024,
                stream: true
            }
        }
    }));
}
```

## Best Practices

### 1. Performance
- **Lazy Loading**: Load resources only when needed
- **Event Cleanup**: Always remove event listeners in `disconnectedCallback()`
- **Efficient Rendering**: Minimize DOM manipulation and use templates
- **Memory Management**: Clean up references and avoid memory leaks

### 2. User Experience
- **Responsive Design**: Ensure components work at different window sizes
- **Loading States**: Show loading indicators for async operations
- **Error Handling**: Provide graceful error messages and recovery
- **Accessibility**: Include proper ARIA labels and keyboard navigation

### 3. Integration
- **Event-Driven**: Use the event system for component communication
- **State Persistence**: Save important state to localStorage
- **System Integration**: Follow desktop component patterns
- **Error Boundaries**: Handle errors gracefully without breaking the desktop

### 4. Code Organization
- **Separation of Concerns**: Separate template, styles, and logic
- **Reusable Patterns**: Extract common functionality into mixins or utilities
- **Clear APIs**: Define clear interfaces for component interaction
- **Documentation**: Document component APIs and usage patterns

## Testing Your Application

### Development Testing
1. **Load Directly**: Place your component file in `/src/apps/` directory
2. **Add to Config**: Register in `src/config.js` APPS array
3. **Test Launch**: Use dock or terminal `open` command to launch
4. **Event Testing**: Use browser dev tools to monitor event flow

### Integration Testing
1. **File Handling**: Test with different file types via Preview or TextEdit patterns
2. **Event Communication**: Test interaction with other components
3. **State Persistence**: Test state saving/loading across sessions
4. **Error Scenarios**: Test graceful failure handling

Your application should integrate seamlessly with the WE-OS desktop environment while providing a native application experience within the browser.