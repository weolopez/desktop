# Notification System Documentation

WE-OS implements a comprehensive notification system that provides both service-level notification management and visual notification display with glassmorphism design.

## System Architecture

### Components
- **NotificationService** (`src/services/notification-service.js`) - Core notification logic
- **NotificationDisplayComponent** (`src/services/notification-display-component.js`) - Visual UI component
- **Event Integration** - Connected to WE-OS event system for system-wide notifications

### Integration Pattern
```javascript
// From config.json
{
    "name": "NotificationService",
    "path": "./notification-service.js",
    "required": false,
    "fallbackGraceful": true
},
{
    "name": "NotificationDisplayComponent",
    "isWebComponent": true,
    "tagName": "notification-display-component",
    "appendTo": "shadowRoot",
    "connectTo": "NotificationService",
    "connectMethod": "setDisplayComponent"
}
```

## Notification Service API

### Creating Notifications

#### Basic Notification
```javascript
import { MESSAGES } from '../events/message-types.js';

document.dispatchEvent(new CustomEvent(MESSAGES.CREATE_NOTIFICATION, {
    detail: {
        sourceAppId: 'terminal',           // Required: App creating notification
        title: 'Command Complete',         // Required: Notification title
        body: 'Process finished successfully', // Required: Notification body
        icon: '✅',                        // Optional: Notification icon
        category: 'success',               // Optional: Notification category
        duration: 5000,                    // Optional: Auto-dismiss time (ms)
        persistent: false,                 // Optional: Whether notification persists
        actions: {                         // Optional: Available actions
            view: { label: 'View Details' },
            dismiss: { label: 'Dismiss' }
        }
    }
}));
```

#### Notification Categories
```javascript
const NOTIFICATION_CATEGORIES = {
    SUCCESS: 'success',      // Success operations
    ERROR: 'error',          // Error notifications
    WARNING: 'warning',      // Warning messages
    INFO: 'info',           // Informational messages
    SYSTEM: 'system',       // System notifications
    APP: 'app'              // Application-specific notifications
};
```

### Permission Management

#### Request Permission
```javascript
// Request notification permission for an app
document.dispatchEvent(new CustomEvent(MESSAGES.NOTIFICATION_PERMISSION_REQUEST, {
    detail: {
        appId: 'my-app',
        level: 'alerts'  // 'default', 'alerts', 'banners'
    }
}));

// Listen for permission result
document.addEventListener(MESSAGES.NOTIFICATION_PERMISSION_RESULT, (event) => {
    const { appId, level, granted, error } = event.detail;
    if (granted) {
        console.log(`Notification permission granted for ${appId}`);
        enableNotifications();
    } else {
        console.warn(`Permission denied: ${error}`);
        showPermissionDeniedMessage();
    }
});
```

#### Permission Levels
- **default**: Basic notification permission
- **alerts**: Full notification with sound alerts
- **banners**: Visual notifications with banner display

### Notification Management

#### Clear Notifications
```javascript
// Clear all notifications
document.dispatchEvent(new CustomEvent(MESSAGES.NOTIFICATION_CLEAR_ALL));

// Clear notifications for specific app
document.dispatchEvent(new CustomEvent(MESSAGES.NOTIFICATION_CLEAR_APP, {
    detail: { appId: 'terminal' }
}));
```

#### Notification Settings
```javascript
// Update notification settings
document.dispatchEvent(new CustomEvent(MESSAGES.NOTIFICATION_SETTINGS_UPDATE, {
    detail: {
        enableNotifications: true,        // Global notification toggle
        enableSounds: true,              // Sound notification toggle
        defaultDuration: 5000,           // Default auto-dismiss duration
        maxActiveNotifications: 5,       // Maximum concurrent notifications
        historyLimit: 100                // Maximum notifications in history
    }
}));
```

#### Notification History
```javascript
// Request notification history
document.dispatchEvent(new CustomEvent(MESSAGES.NOTIFICATION_HISTORY_REQUEST, {
    detail: {
        requestId: 'history-request-1',  // Optional: Request identifier
        options: {
            appId: 'terminal',           // Optional: Filter by app
            category: 'success',         // Optional: Filter by category
            unreadOnly: false,           // Optional: Only unread notifications
            limit: 50                    // Optional: Limit results
        }
    }
}));

// Listen for history response
document.addEventListener(MESSAGES.NOTIFICATION_HISTORY_RESPONSE, (event) => {
    const { history, requestId } = event.detail;
    displayNotificationHistory(history);
});
```

## Event Handling

### Notification Events

#### Notification Lifecycle
```javascript
// Notification created successfully
document.addEventListener(MESSAGES.NOTIFICATION_CREATED, (event) => {
    const { notificationId, sourceAppId } = event.detail;
    console.log(`Notification ${notificationId} created by ${sourceAppId}`);
});

// Notification creation failed
document.addEventListener(MESSAGES.NOTIFICATION_ERROR, (event) => {
    const { error, sourceAppId } = event.detail;
    console.error(`Notification failed for ${sourceAppId}:`, error);
});

// Notification clicked
document.addEventListener(MESSAGES.NOTIFICATION_CLICKED, (event) => {
    const { notificationId, actionId, type } = event.detail;
    
    if (type === 'notification') {
        // Main notification clicked
        handleNotificationClick(notificationId);
    } else if (type === 'action') {
        // Action button clicked
        handleNotificationAction(notificationId, actionId);
    }
});

// Notification dismissed
document.addEventListener(MESSAGES.NOTIFICATION_DISMISSED, (event) => {
    const { notificationId } = event.detail;
    handleNotificationDismissal(notificationId);
});
```

#### Status Events
```javascript
// Notification action triggered
document.addEventListener(MESSAGES.NOTIFICATION_ACTION_TRIGGERED, (event) => {
    const { notificationId, actionId, sourceAppId } = event.detail;
    console.log(`Action ${actionId} triggered for notification ${notificationId}`);
});

// Notifications cleared
document.addEventListener(MESSAGES.NOTIFICATIONS_CLEARED, (event) => {
    const { count, type, appId } = event.detail;
    if (type === 'all') {
        console.log(`${count} notifications cleared`);
    } else if (type === 'app') {
        console.log(`${count} notifications cleared for app ${appId}`);
    }
});

// Settings updated
document.addEventListener(MESSAGES.NOTIFICATION_SETTINGS_UPDATED, (event) => {
    console.log('Notification settings updated');
    updateNotificationUI();
});
```

## Visual Display Component

### Glassmorphism Design
The NotificationDisplayComponent provides a modern UI with:
- **Glassmorphism effects**: Blur and transparency
- **Smooth animations**: Slide-in/slide-out transitions
- **Action buttons**: Interactive notification actions
- **Auto-positioning**: Smart viewport positioning
- **Queue management**: Multiple notification handling

### Display Features

#### Visual Styling
```css
:host {
    position: fixed;
    top: 40px; /* Below menu bar */
    right: 20px;
    z-index: 10000;
    display: flex;
    flex-direction: column;
    gap: 10px;
    align-items: flex-end;
    pointer-events: none; /* Allow clicks through empty areas */
}

.notification-item {
    width: 320px;
    background-color: rgba(240, 240, 240, 0.95);
    backdrop-filter: blur(20px);
    border-radius: 12px;
    padding: 12px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15), 
                0 0 0 1px rgba(255, 255, 255, 0.1);
    animation: slideIn 0.3s ease-out;
    transform-origin: top right;
    pointer-events: auto; /* Enable clicks on notifications */
}
```

#### Animation System
```css
@keyframes slideIn {
    from {
        opacity: 0;
        transform: translateX(100%) scale(0.9);
    }
    to {
        opacity: 1;
        transform: translateX(0) scale(1);
    }
}

@keyframes slideOut {
    from {
        opacity: 1;
        transform: translateX(0) scale(1);
    }
    to {
        opacity: 0;
        transform: translateX(100%) scale(0.9);
    }
}
```

## Application Integration

### Basic Integration Pattern
```javascript
class MyApp extends HTMLElement {
    constructor() {
        super();
        this.appId = 'my-app';
        this.notificationPermission = false;
    }

    connectedCallback() {
        this.requestNotificationPermission();
        this.setupNotificationListeners();
    }

    requestNotificationPermission() {
        document.dispatchEvent(new CustomEvent(MESSAGES.NOTIFICATION_PERMISSION_REQUEST, {
            detail: {
                appId: this.appId,
                level: 'alerts'
            }
        }));
    }

    setupNotificationListeners() {
        // Listen for permission result
        document.addEventListener(MESSAGES.NOTIFICATION_PERMISSION_RESULT, (event) => {
            if (event.detail.appId === this.appId) {
                this.notificationPermission = event.detail.granted;
            }
        });

        // Listen for notification clicks
        document.addEventListener(MESSAGES.NOTIFICATION_CLICKED, (event) => {
            this.handleNotificationInteraction(event.detail);
        });
    }

    showNotification(title, body, options = {}) {
        if (!this.notificationPermission) {
            console.warn('Notification permission not granted');
            return;
        }

        document.dispatchEvent(new CustomEvent(MESSAGES.CREATE_NOTIFICATION, {
            detail: {
                sourceAppId: this.appId,
                title: title,
                body: body,
                icon: options.icon || '📱',
                category: options.category || 'app',
                duration: options.duration || 5000,
                actions: options.actions
            }
        }));
    }

    handleNotificationInteraction(detail) {
        const { notificationId, actionId, type } = detail;
        
        if (type === 'action') {
            switch (actionId) {
                case 'view':
                    this.showDetails(notificationId);
                    break;
                case 'dismiss':
                    this.dismissNotification(notificationId);
                    break;
            }
        }
    }
}
```

### Advanced Usage Patterns

#### Notification Manager Class
```javascript
class NotificationManager {
    constructor(appId) {
        this.appId = appId;
        this.permissions = new Set();
        this.activeNotifications = new Map();
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.addEventListener(MESSAGES.NOTIFICATION_PERMISSION_RESULT, (event) => {
            if (event.detail.appId === this.appId && event.detail.granted) {
                this.permissions.add(event.detail.level);
            }
        });

        document.addEventListener(MESSAGES.NOTIFICATION_CREATED, (event) => {
            if (event.detail.sourceAppId === this.appId) {
                this.activeNotifications.set(event.detail.notificationId, {
                    id: event.detail.notificationId,
                    timestamp: Date.now()
                });
            }
        });

        document.addEventListener(MESSAGES.NOTIFICATION_DISMISSED, (event) => {
            this.activeNotifications.delete(event.detail.notificationId);
        });
    }

    async requestPermission(level = 'default') {
        return new Promise((resolve) => {
            const handler = (event) => {
                if (event.detail.appId === this.appId) {
                    document.removeEventListener(MESSAGES.NOTIFICATION_PERMISSION_RESULT, handler);
                    resolve(event.detail.granted);
                }
            };

            document.addEventListener(MESSAGES.NOTIFICATION_PERMISSION_RESULT, handler);
            document.dispatchEvent(new CustomEvent(MESSAGES.NOTIFICATION_PERMISSION_REQUEST, {
                detail: { appId: this.appId, level: level }
            }));
        });
    }

    notify(title, body, options = {}) {
        if (!this.hasPermission(options.level || 'default')) {
            throw new Error('Notification permission not granted');
        }

        const notificationData = {
            sourceAppId: this.appId,
            title: title,
            body: body,
            icon: options.icon,
            category: options.category || 'app',
            duration: options.duration,
            persistent: options.persistent,
            actions: options.actions
        };

        document.dispatchEvent(new CustomEvent(MESSAGES.CREATE_NOTIFICATION, {
            detail: notificationData
        }));
    }

    hasPermission(level) {
        return this.permissions.has(level);
    }

    clearAll() {
        document.dispatchEvent(new CustomEvent(MESSAGES.NOTIFICATION_CLEAR_APP, {
            detail: { appId: this.appId }
        }));
    }

    getActiveCount() {
        return this.activeNotifications.size;
    }
}

// Usage
const notificationManager = new NotificationManager('my-app');
await notificationManager.requestPermission('alerts');
notificationManager.notify('Task Complete', 'Your task has finished successfully', {
    icon: '✅',
    category: 'success',
    actions: {
        view: { label: 'View Results' },
        dismiss: { label: 'OK' }
    }
});
```

#### Progress Notifications
```javascript
class ProgressNotification {
    constructor(appId, title) {
        this.appId = appId;
        this.title = title;
        this.notificationId = null;
        this.progress = 0;
    }

    start() {
        document.dispatchEvent(new CustomEvent(MESSAGES.CREATE_NOTIFICATION, {
            detail: {
                sourceAppId: this.appId,
                title: this.title,
                body: 'Starting...',
                icon: '⏳',
                category: 'info',
                persistent: true,
                actions: {
                    cancel: { label: 'Cancel' }
                }
            }
        }));

        // Listen for notification creation
        document.addEventListener(MESSAGES.NOTIFICATION_CREATED, (event) => {
            if (event.detail.sourceAppId === this.appId) {
                this.notificationId = event.detail.notificationId;
            }
        }, { once: true });
    }

    updateProgress(progress, message) {
        this.progress = progress;
        const percentage = Math.round(progress * 100);
        
        // Create updated notification
        document.dispatchEvent(new CustomEvent(MESSAGES.CREATE_NOTIFICATION, {
            detail: {
                sourceAppId: this.appId,
                title: this.title,
                body: `${message} (${percentage}%)`,
                icon: '📊',
                category: 'info',
                persistent: true,
                actions: {
                    cancel: { label: 'Cancel' }
                }
            }
        }));
    }

    complete(message = 'Complete') {
        document.dispatchEvent(new CustomEvent(MESSAGES.CREATE_NOTIFICATION, {
            detail: {
                sourceAppId: this.appId,
                title: this.title,
                body: message,
                icon: '✅',
                category: 'success',
                duration: 3000
            }
        }));
    }

    error(message) {
        document.dispatchEvent(new CustomEvent(MESSAGES.CREATE_NOTIFICATION, {
            detail: {
                sourceAppId: this.appId,
                title: this.title,
                body: `Error: ${message}`,
                icon: '❌',
                category: 'error',
                persistent: true,
                actions: {
                    retry: { label: 'Retry' },
                    dismiss: { label: 'Dismiss' }
                }
            }
        }));
    }
}
```

## Configuration

### Feature Configuration
```javascript
// In config.json
"features": {
    "notifications": {
        "enabled": true,             // Enable notification system
        "soundsEnabled": true,       // Enable notification sounds
        "maxRetentionMs": 300000     // 5 minutes retention
    }
}
```

### Service Configuration
```javascript
// Notification service in startup configuration
{
    "name": "NotificationService",
    "path": "./notification-service.js",
    "required": false,
    "priority": 3,
    "enabled": true,
    "fallbackGraceful": true,
    "config": {
        "constructorArgs": ["desktopComponent"],
        "postInit": null
    }
}
```

## Best Practices

### 1. Permission Management
- Always request permission before sending notifications
- Handle permission denial gracefully
- Use appropriate permission levels for different notification types

### 2. User Experience
- Use clear, concise notification titles and messages
- Provide relevant actions for interactive notifications
- Set appropriate auto-dismiss durations
- Avoid notification spam with rate limiting

### 3. Categories and Organization
- Use consistent category names across your application
- Group related notifications by category
- Provide meaningful icons for different notification types

### 4. Error Handling
- Handle notification service unavailability
- Provide fallback mechanisms when notifications fail
- Log notification errors for debugging

### 5. Performance
- Clean up notification listeners when components unmount
- Limit the number of active notifications
- Use persistent notifications sparingly

The notification system provides a comprehensive foundation for user communication within WE-OS, enabling applications to provide timely feedback and interactive notifications with a modern, polished interface.