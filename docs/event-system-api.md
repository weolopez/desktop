# Event System API Reference

WE-OS implements a comprehensive event-driven architecture that enables seamless communication between components. The system is built around a centralized event bus and a rich set of message types with validated payloads.

## Architecture Overview

### Event Bus
**File**: `src/events/event-bus.js`

The event bus provides the core messaging infrastructure:

```javascript
import eventBus from '../events/event-bus.js';

// Emit an event
eventBus.emit('my-event', { data: 'value' });

// Listen for events
eventBus.on('my-event', (data) => {
    console.log('Received:', data);
});

// Remove listener
eventBus.off('my-event', handler);
```

### Message Types
**File**: `src/events/message-types.js`

All system events use predefined message types with validated payloads:

```javascript
import { MESSAGES, validateMessagePayload } from '../events/message-types.js';

// Create a valid event
const payload = { id: 'terminal', name: 'Terminal', icon: '⚫' };
if (validateMessagePayload(MESSAGES.LAUNCH_APP, payload)) {
    document.dispatchEvent(new CustomEvent(MESSAGES.LAUNCH_APP, { detail: payload }));
}
```

## Core Message Categories

### Application Lifecycle

#### LAUNCH_APP
Launches an application in the desktop environment.

```javascript
const launchPayload = {
    id: 'terminal',                    // Required: App identifier
    name: 'Terminal',                  // Required: Display name
    icon: '⚫',                        // App icon (emoji or URL)
    sourceUrl: '/apps/terminal.js',   // URL to web component
    tag: 'terminal-webapp',           // Web component tag name
    x: 100,                           // Optional: Initial x position
    y: 100,                           // Optional: Initial y position
    width: 800,                       // Optional: Initial width
    height: 600,                      // Optional: Initial height
    initialState: {}                  // Optional: Initial app state
};

document.dispatchEvent(new CustomEvent(MESSAGES.LAUNCH_APP, {
    detail: launchPayload
}));
```

#### PUBLISH_TEXT
Publishes text content to be rendered by registered components.

```javascript
const textPayload = {
    texts: ['# Hello World\nThis is **markdown**'],  // Required: Content array or string
    icon: '📝',                                       // Optional: Display icon
    sourceUrl: '/content/readme.md'                   // Optional: Source URL
};

document.dispatchEvent(new CustomEvent(MESSAGES.PUBLISH_TEXT, {
    detail: textPayload
}));
```

### Window Management

#### WINDOW_FOCUS
Focuses a specific window.

```javascript
const focusPayload = {
    windowId: 'window-123',           // Required: Window identifier
    appName: 'Terminal',              // Required: App name
    appIcon: '⚫',                     // Optional: App icon
    appTag: 'terminal-webapp'         // Optional: Component tag
};

document.dispatchEvent(new CustomEvent(MESSAGES.WINDOW_FOCUS, {
    detail: focusPayload
}));
```

#### WINDOW_CLOSED
Notifies that a window has been closed.

```javascript
const closePayload = {
    windowId: 'window-123',
    appName: 'Terminal',
    x: 100, y: 100,                   // Optional: Final position
    width: 800, height: 600           // Optional: Final size
};

document.dispatchEvent(new CustomEvent(MESSAGES.WINDOW_CLOSED, {
    detail: closePayload
}));
```

#### Window State Events
- `WINDOW_MINIMIZE`: Window minimized
- `WINDOW_MAXIMIZE`: Window maximized  
- `WINDOW_RESTORE`: Window restored from minimized state
- `WINDOW_FOCUSED`: Window focus changed (system notification)

### Desktop Interaction

#### DESKTOP_CLICK
Handles clicks on the desktop background.

```javascript
const clickPayload = {
    x: 150,                           // Required: Click x coordinate
    y: 200,                           // Required: Click y coordinate
    originalEvent: mouseEvent         // Required: Original mouse event
};

document.dispatchEvent(new CustomEvent(MESSAGES.DESKTOP_CLICK, {
    detail: clickPayload
}));
```

#### DESKTOP_CONTEXT_MENU
Triggers desktop context menu.

```javascript
const contextPayload = {
    x: 150, y: 200,                   // Required: Context menu position
    originalEvent: mouseEvent         // Required: Original event
};

document.dispatchEvent(new CustomEvent(MESSAGES.DESKTOP_CONTEXT_MENU, {
    detail: contextPayload
}));
```

### Dock Management

#### DOCK_ICON_CLICK
Handles dock icon clicks.

```javascript
const dockPayload = {
    appId: 'terminal',                // Required: App identifier
    appName: 'Terminal',              // Required: App name
    shift: false,                     // Optional: Shift key held
    command: false                    // Optional: Command key held
};

document.dispatchEvent(new CustomEvent(MESSAGES.DOCK_ICON_CLICK, {
    detail: dockPayload
}));
```

## Notification System Events

### Core Notification Events

#### CREATE_NOTIFICATION
Creates a new system notification.

```javascript
const notificationPayload = {
    sourceAppId: 'terminal',          // Required: Source app ID
    title: 'Process Complete',        // Required: Notification title
    body: 'Command executed successfully', // Required: Notification body
    icon: '✅',                       // Optional: Notification icon
    category: 'success',              // Optional: Notification category
    duration: 5000,                   // Optional: Auto-dismiss duration (ms)
    persistent: false,                // Optional: Whether notification persists
    actions: {                        // Optional: Available actions
        view: { label: 'View Details' },
        dismiss: { label: 'Dismiss' }
    }
};

document.dispatchEvent(new CustomEvent(MESSAGES.CREATE_NOTIFICATION, {
    detail: notificationPayload
}));
```

#### NOTIFICATION_CLICKED
Fired when a notification is clicked.

```javascript
// Listen for notification clicks
document.addEventListener(MESSAGES.NOTIFICATION_CLICKED, (event) => {
    const { notificationId, actionId, type } = event.detail;
    if (type === 'action' && actionId === 'view') {
        // Handle action click
    }
});
```

### Notification Management

#### Permission Management
```javascript
// Request notification permission
document.dispatchEvent(new CustomEvent(MESSAGES.NOTIFICATION_PERMISSION_REQUEST, {
    detail: { appId: 'my-app', level: 'alerts' }
}));

// Listen for permission result
document.addEventListener(MESSAGES.NOTIFICATION_PERMISSION_RESULT, (event) => {
    const { appId, level, granted } = event.detail;
    if (granted) {
        console.log(`Permission granted for ${appId}`);
    }
});
```

#### Clear Notifications
```javascript
// Clear all notifications
document.dispatchEvent(new CustomEvent(MESSAGES.NOTIFICATION_CLEAR_ALL));

// Clear notifications for specific app
document.dispatchEvent(new CustomEvent(MESSAGES.NOTIFICATION_CLEAR_APP, {
    detail: { appId: 'terminal' }
}));
```

## WebLLM AI Events

### Initialization Events

#### WEBLLM_INITIALIZE_REQUEST
Requests WebLLM model initialization.

```javascript
const initPayload = {
    modelId: 'Qwen2.5-0.5B-Instruct-q0f16-MLC', // Required: Model identifier
    config: {                                    // Optional: Init config
        temperature: 0.7,
        maxTokens: 1024
    },
    force: false                                 // Optional: Force reinit
};

document.dispatchEvent(new CustomEvent(MESSAGES.WEBLLM_INITIALIZE_REQUEST, {
    detail: initPayload
}));
```

#### Initialization Status Events
Listen for initialization progress:

```javascript
// Initialization started
document.addEventListener(MESSAGES.WEBLLM_INIT_START, (event) => {
    console.log('Initializing model:', event.detail.modelId);
});

// Initialization progress
document.addEventListener(MESSAGES.WEBLLM_INIT_PROGRESS, (event) => {
    const { text, progress } = event.detail;
    console.log(`${text} (${Math.round(progress * 100)}%)`);
});

// Initialization complete
document.addEventListener(MESSAGES.WEBLLM_INIT_COMPLETE, (event) => {
    const { modelId, success } = event.detail;
    if (success) {
        console.log('Model ready:', modelId);
    }
});

// Initialization error
document.addEventListener(MESSAGES.WEBLLM_INIT_ERROR, (event) => {
    console.error('Init failed:', event.detail.error);
});
```

### Generation Events

#### WEBLLM_GENERATE_REQUEST
Requests AI response generation.

```javascript
const generatePayload = {
    messages: [                                  // Required: Conversation messages
        { role: 'user', content: 'Hello, AI!' }
    ],
    conversationId: 'conv-123',                  // Optional: Conversation ID
    options: {                                   // Optional: Generation options
        temperature: 0.7,
        maxTokens: 1024,
        stream: true
    }
};

document.dispatchEvent(new CustomEvent(MESSAGES.WEBLLM_GENERATE_REQUEST, {
    detail: generatePayload
}));
```

#### Generation Response Events
Handle AI responses:

```javascript
// Generation started
document.addEventListener(MESSAGES.WEBLLM_GENERATION_START, (event) => {
    console.log('Generating response for:', event.detail.messages);
});

// Streaming response chunks
document.addEventListener(MESSAGES.WEBLLM_RESPONSE_CHUNK, (event) => {
    const { text, delta, conversationId } = event.detail;
    console.log('Chunk:', delta);
});

// Complete response
document.addEventListener(MESSAGES.WEBLLM_RESPONSE_COMPLETE, (event) => {
    const { message, conversationId } = event.detail;
    console.log('Complete response:', message.content);
});

// Generation error
document.addEventListener(MESSAGES.WEBLLM_GENERATION_ERROR, (event) => {
    console.error('Generation failed:', event.detail.error);
});
```

### Service Status Events

#### WEBLLM_SERVICE_READY
WebLLM service is available.

```javascript
document.addEventListener(MESSAGES.WEBLLM_SERVICE_READY, (event) => {
    const { serviceVersion, supportedModels, capabilities } = event.detail;
    console.log('WebLLM service ready:', serviceVersion);
    console.log('Supported models:', supportedModels);
});
```

#### WEBLLM_STATUS_CHANGED
Service status updates.

```javascript
document.addEventListener(MESSAGES.WEBLLM_STATUS_CHANGED, (event) => {
    const { isInitialized, isProcessing, currentModel, status } = event.detail;
    console.log('WebLLM status:', status);
});
```

## File System Events

### File Operations

#### FILE_DROPPED
Handles file drop operations.

```javascript
const dropPayload = {
    files: [file1, file2],            // Required: Array of File objects
    text: 'optional text content',    // Optional: Text content
    x: 150, y: 200                    // Required: Drop coordinates
};

document.dispatchEvent(new CustomEvent(MESSAGES.FILE_DROPPED, {
    detail: dropPayload
}));
```

#### FILE_PASTED
Handles file paste operations.

```javascript
const pastePayload = {
    files: [file1],
    text: 'pasted text',
    x: 150, y: 200
};

document.dispatchEvent(new CustomEvent(MESSAGES.FILE_PASTED, {
    detail: pastePayload
}));
```

## System Events

### System Lifecycle
- `SYSTEM_STARTUP`: System initialization complete
- `SYSTEM_SHUTDOWN`: System shutdown initiated

### Settings Events

#### WALLPAPER_CHANGED
Desktop wallpaper changed.

```javascript
const wallpaperPayload = {
    category: 'wallpaper',            // Required: Settings category
    key: 'background-image',          // Required: Setting key
    value: '/assets/wallpapers/nature.jpg', // Required: New value
    oldValue: '/assets/wallpapers/abstract.jpg' // Optional: Previous value
};

document.dispatchEvent(new CustomEvent(MESSAGES.WALLPAPER_CHANGED, {
    detail: wallpaperPayload
}));
```

#### SETTINGS_UPDATED
General settings update notification.

```javascript
const settingsPayload = {
    category: 'dock',
    key: 'position',
    value: 'left',
    oldValue: 'bottom'
};

document.dispatchEvent(new CustomEvent(MESSAGES.SETTINGS_UPDATED, {
    detail: settingsPayload
}));
```

## Event Validation

### Message Validation
Use the built-in validation system:

```javascript
import { validateMessagePayload, getMessageDescription } from '../events/message-types.js';

const payload = { id: 'terminal', name: 'Terminal' };

if (validateMessagePayload(MESSAGES.LAUNCH_APP, payload)) {
    // Payload is valid
    document.dispatchEvent(new CustomEvent(MESSAGES.LAUNCH_APP, { detail: payload }));
} else {
    console.error('Invalid payload for:', getMessageDescription(MESSAGES.LAUNCH_APP));
}
```

### Custom Event Creation
For component-specific events, follow the established patterns:

```javascript
// 1. Define the message type
const MY_CUSTOM_EVENT = 'my-component:custom-action';

// 2. Create typed payload
const customPayload = {
    componentId: 'my-component',
    action: 'custom-action',
    data: { key: 'value' }
};

// 3. Dispatch with validation
document.dispatchEvent(new CustomEvent(MY_CUSTOM_EVENT, {
    bubbles: true,
    composed: true,
    detail: customPayload
}));
```

## Best Practices

### Event Handling
1. **Always validate payloads** before dispatching events
2. **Use specific event types** rather than generic ones
3. **Include required payload fields** as documented
4. **Handle event failures gracefully** with try-catch blocks
5. **Clean up event listeners** in component disconnectedCallback

### Performance Considerations
1. **Avoid event storms** by debouncing high-frequency events
2. **Use event delegation** for similar events
3. **Remove unused listeners** to prevent memory leaks
4. **Consider event batching** for multiple related events

### Error Handling
```javascript
try {
    document.dispatchEvent(new CustomEvent(MESSAGES.LAUNCH_APP, {
        detail: appPayload
    }));
} catch (error) {
    console.error('Failed to launch app:', error);
    // Handle gracefully
}
```

## Event Monitor

WE-OS includes a built-in event monitor for debugging:

**File**: `src/events/event-monitor.js`

```javascript
import { eventMonitor } from '../events/event-monitor.js';

// Enable monitoring
eventMonitor.enable();

// View event history
console.log(eventMonitor.getHistory());

// Disable monitoring
eventMonitor.disable();
```

The event monitor tracks all system events and provides debugging information for development and troubleshooting.