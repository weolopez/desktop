# Component Reference

WE-OS is built using a component-based architecture with core components handling different aspects of the desktop environment. This reference documents the main components and their APIs.

## Core Components

### Desktop Component
**File**: `src/components/desktop-component.js`

The main desktop container component that orchestrates the entire system.

#### Responsibilities
- System initialization via StartupManager
- Desktop layout and appearance management
- Global event coordination
- Application window management
- File drop and drag handling

#### Key Methods
```javascript
// Set desktop wallpaper
setWallpaper(imagePath)

// Handle application launch
handleAppLaunch(appData)

// Manage desktop layout
updateDesktopLayout()
```

#### Events
- Desktop click/context menu handling
- File drop processing
- Global keyboard shortcuts

### Window Component
**File**: `src/components/window-component.js`

Provides windowing functionality for applications.

#### Features
- **Window Chrome**: Title bar with traffic lights (close/minimize/maximize)
- **Drag and Drop**: Window movement and resizing
- **State Management**: Window position, size, and state persistence
- **Focus Management**: Window focus and z-index ordering
- **Accessibility**: Keyboard navigation support

#### Attributes
```javascript
// Window configuration
app-name="Terminal"          // Application name
app-icon="⚫"                // Application icon
x="100"                      // X position
y="100"                      // Y position
width="800"                  // Window width
height="600"                 // Window height
```

#### Window State
```javascript
const windowState = {
    x: 100,                  // Window x position
    y: 100,                  // Window y position
    width: 800,              // Window width
    height: 600,             // Window height
    isMinimized: false,      // Minimization state
    isMaximized: false,      // Maximization state
    isFocused: true,         // Focus state
    zIndex: 1000            // Z-index for layering
};
```

#### Events
```javascript
// Window events
MESSAGES.WINDOW_FOCUS       // Window focused
MESSAGES.WINDOW_CLOSED      // Window closed
MESSAGES.WINDOW_MINIMIZE    // Window minimized
MESSAGES.WINDOW_MAXIMIZE    // Window maximized
MESSAGES.WINDOW_RESTORE     // Window restored
```

### Dock Component
**File**: `src/components/dock-component.js`

Application launcher dock with macOS-like behavior.

#### Features
- **Application Icons**: Visual application launchers
- **Context Menus**: Right-click menus for dock items
- **Badge Support**: Application notification badges
- **Positioning**: Configurable dock positioning (bottom, left, right)
- **Animation**: Hover effects and launch animations

#### Configuration
```javascript
// Dock positioning
position: 'bottom'  // 'bottom', 'left', 'right'

// Icon configuration
icons: [
    {
        id: 'terminal',
        name: 'Terminal',
        icon: '⚫',
        badge: 0        // Optional notification badge
    }
]
```

#### Events
```javascript
MESSAGES.DOCK_ICON_CLICK       // Dock icon clicked
MESSAGES.DOCK_CONTEXT_MENU     // Dock context menu
```

### Menu Bar Component
**File**: `src/components/menu-bar-component.js`

Global menu bar that changes based on the active application.

#### Features
- **Dynamic Menus**: Changes based on focused application
- **System Menus**: Global system menus
- **Application Menus**: Application-specific menu items
- **Keyboard Shortcuts**: Menu keyboard navigation

#### Menu Structure
```javascript
const menuStructure = {
    'Application': [
        { label: 'About Application', action: 'about' },
        { label: 'Preferences...', action: 'preferences', shortcut: 'Cmd+,' },
        { type: 'separator' },
        { label: 'Quit Application', action: 'quit', shortcut: 'Cmd+Q' }
    ],
    'File': [
        { label: 'New', action: 'new', shortcut: 'Cmd+N' },
        { label: 'Open...', action: 'open', shortcut: 'Cmd+O' },
        { label: 'Save', action: 'save', shortcut: 'Cmd+S' }
    ]
};
```

## Service Components

### Startup Manager
**File**: `src/services/startup-manager.js`

Orchestrates component loading with dependency management.

#### Features
- **Phased Loading**: 3-phase startup system (critical, ui, optional)
- **Dependency Resolution**: Automatic component ordering
- **Parallel Loading**: Concurrent component initialization
- **Error Handling**: Graceful fallbacks for failed components
- **Performance Monitoring**: Startup metrics tracking

#### API
```javascript
// Get loaded component
const component = startupManager.getComponent('ComponentName');

// Check if component is loaded
if (startupManager.isComponentLoaded('NotificationService')) {
    // Use component
}

// Get startup metrics
const metrics = startupManager.getStartupMetrics();
```

### Window Manager
**File**: `src/services/window-manager.js`

Manages window lifecycle and positioning.

#### Responsibilities
- Window creation and destruction
- Window focus management
- Z-index ordering
- Window state persistence
- Window positioning and sizing

#### API
```javascript
// Create new window
createWindow(appName, appIcon, options)

// Focus window
focusWindow(windowId)

// Close window
closeWindow(windowId)

// Get all windows
getAllWindows()
```

### Wallpaper Manager
**File**: `src/services/wallpaper-manager.js`

Manages desktop wallpaper and appearance.

#### Features
- **Wallpaper Loading**: Dynamic wallpaper changes
- **Appearance Settings**: Desktop visual configuration
- **State Persistence**: Wallpaper preference saving
- **Event Integration**: Wallpaper change notifications

#### API
```javascript
// Set wallpaper
setWallpaper(imagePath)

// Get current wallpaper
getCurrentWallpaper()

// Reset to default
resetWallpaper()
```

### Context Menu Manager
**File**: `src/services/context-menu-manager.js`

Provides context menu functionality.

#### Features
- **Dynamic Menus**: Context-aware menu generation
- **Positioning**: Smart menu positioning
- **Action Binding**: Menu item action handling
- **Keyboard Navigation**: Accessibility support

#### API
```javascript
// Show context menu
showContextMenu(x, y, menuItems)

// Hide context menu
hideContextMenu()

// Add menu item
addMenuItem(item)
```

## Event System Components

### Event Bus
**File**: `src/events/event-bus.js`

Central event communication system.

#### API
```javascript
import eventBus from '../events/event-bus.js';

// Emit event
eventBus.emit('event-name', data);

// Listen for event
eventBus.on('event-name', handler);

// Remove listener
eventBus.off('event-name', handler);

// One-time listener
eventBus.once('event-name', handler);
```

### Event Monitor
**File**: `src/events/event-monitor.js`

Development tool for monitoring system events.

#### Features
- **Event Tracking**: Logs all system events
- **History Management**: Maintains event history
- **Performance Metrics**: Event timing and frequency
- **Debug Support**: Detailed event information

#### API
```javascript
import { eventMonitor } from '../events/event-monitor.js';

// Enable monitoring
eventMonitor.enable();

// Get event history
const history = eventMonitor.getHistory();

// Clear history
eventMonitor.clearHistory();

// Disable monitoring
eventMonitor.disable();
```

### Message Types
**File**: `src/events/message-types.js`

Defines all system message types and validation.

#### Key Exports
```javascript
import { MESSAGES, validateMessagePayload, getMessageDescription } from '../events/message-types.js';

// Use message types
const event = new CustomEvent(MESSAGES.LAUNCH_APP, { detail: payload });

// Validate payload
if (validateMessagePayload(MESSAGES.LAUNCH_APP, payload)) {
    // Dispatch event
}

// Get description
const description = getMessageDescription(MESSAGES.LAUNCH_APP);
```

## Component Development Patterns

### Web Component Base Pattern
```javascript
class MyComponent extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        // Initialize state
    }

    connectedCallback() {
        this.render();
        this.setupEventListeners();
    }

    disconnectedCallback() {
        this.cleanup();
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    /* Component styles */
                }
            </style>
            <!-- Component HTML -->
        `;
    }

    setupEventListeners() {
        // Event setup
    }

    cleanup() {
        // Cleanup resources
    }
}

customElements.define('my-component', MyComponent);
```

### Service Component Pattern
```javascript
export class MyService {
    constructor(desktopComponent) {
        this.desktop = desktopComponent;
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.addEventListener(MESSAGES.MY_EVENT, (event) => {
            this.handleEvent(event.detail);
        });
    }

    handleEvent(data) {
        // Process event
    }

    // Public API methods
    doSomething() {
        // Service functionality
    }
}
```

### Component Integration
```javascript
// Component registration in startup
{
    "name": "MyComponent",
    "path": "./my-component.js",
    "dependencies": ["RequiredService"],
    "config": {
        "constructorArgs": ["desktopComponent", "deps.RequiredService"],
        "postInit": "initialize"
    }
}
```

## Component Lifecycle

### Startup Sequence
1. **Critical Phase**: Core services (AppService, WindowManager, WallpaperManager)
2. **UI Phase**: Interface components (ContextMenuManager, DockComponent)
3. **Optional Phase**: Background services (NotificationService, WebLLMService)

### Component States
- **Loading**: Component is being loaded
- **Initializing**: Component constructor and setup
- **Ready**: Component is operational
- **Error**: Component failed to load
- **Disabled**: Component is disabled in configuration

### Dependency Resolution
Components can declare dependencies that are automatically resolved:

```javascript
// Component B depends on Component A
"dependencies": ["ComponentA"]

// Component B receives ComponentA instance
"constructorArgs": ["desktopComponent", "deps.ComponentA"]
```

## Best Practices

### 1. Component Design
- Use Shadow DOM for style isolation
- Implement proper cleanup in disconnectedCallback
- Follow consistent naming conventions
- Document component APIs and events

### 2. Event Handling
- Use the centralized event system for communication
- Validate event payloads before dispatching
- Clean up event listeners to prevent memory leaks
- Use specific event types rather than generic ones

### 3. State Management
- Persist important state to localStorage
- Use component state for internal state management
- Coordinate shared state through services
- Handle state restoration gracefully

### 4. Performance
- Lazy load components when possible
- Use efficient DOM manipulation
- Implement proper resource cleanup
- Monitor component performance impact

### 5. Error Handling
- Implement graceful error handling
- Provide fallback functionality
- Log errors for debugging
- Handle component failures gracefully

This component system provides a robust foundation for building complex desktop applications within the WE-OS environment, with clear separation of concerns and well-defined integration patterns.