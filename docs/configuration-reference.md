# Configuration Reference

WE-OS uses a sophisticated configuration system that controls startup behavior, feature availability, and system performance. This reference documents all configuration options and their effects.

## Configuration File: config.json

**Location**: `/config.json`

The main configuration file uses JSON format and contains startup phases, performance settings, and feature flags.

### Root Structure

```javascript
{
    "startup": {
        "phases": [ /* Startup phase definitions */ ],
        "performance": { /* Performance optimization settings */ }
    },
    "features": { /* Feature flags and settings */ }
}
```

## Startup Configuration

### Startup Phases

The startup system executes components in three main phases:

#### Phase Structure
```javascript
{
    "name": "phase-name",           // Required: Phase identifier
    "parallel": true,               // Optional: Load components in parallel
    "waitFor": "previous-phase",    // Optional: Wait for another phase
    "defer": false,                 // Optional: Defer to background
    "components": [                 // Required: Components to load
        // Component definitions
    ]
}
```

#### Component Definition
```javascript
{
    "name": "ComponentName",        // Required: Component identifier
    "path": "./component.js",       // Required: Path to component file
    "required": false,              // Optional: Whether component is required
    "priority": 1,                  // Optional: Loading priority (1-5)
    "enabled": true,                // Optional: Whether component is enabled
    "dependencies": ["OtherComponent"], // Optional: Component dependencies
    "isWebComponent": false,        // Optional: Whether it's a web component
    "tagName": "my-component",      // Required if isWebComponent: true
    "appendTo": "shadowRoot",       // Optional: Where to append component
    "elementId": "component-id",    // Optional: Element ID for component
    "connectTo": "ServiceName",     // Optional: Service to connect to
    "connectMethod": "setComponent", // Optional: Connection method
    "fallbackGraceful": false,      // Optional: Graceful failure handling
    "config": {                     // Optional: Component configuration
        "constructorArgs": [],      // Arguments for constructor
        "postInit": "methodName",   // Method to call after init
        "postInitArgs": [],         // Arguments for postInit method
        "async": false              // Whether postInit is async
    }
}
```

### Default Phase Configuration

#### Critical Phase
Core services that must load first:

```javascript
{
    "name": "critical",
    "parallel": true,
    "components": [
        {
            "name": "WallpaperManager",
            "path": "./wallpaper-manager.js",
            "required": false,
            "priority": 1,
            "enabled": true,
            "config": {
                "constructorArgs": ["desktopComponent"],
                "postInit": null
            }
        },
        {
            "name": "WindowManager",
            "path": "./window-manager.js",
            "required": false,
            "priority": 1,
            "dependencies": ["AppService"],
            "enabled": true,
            "config": {
                "constructorArgs": ["desktopComponent", "deps.AppService"],
                "postInit": null
            }
        },
        {
            "name": "AppService",
            "path": "/wc/dynamic-component-system/src/index.js",
            "required": false,
            "priority": 1,
            "enabled": true,
            "config": {
                "constructorArgs": [],
                "postInit": "init",
                "postInitArgs": ["desktopComponent"]
            }
        }
    ]
}
```

#### UI Phase
User interface components:

```javascript
{
    "name": "ui",
    "parallel": true,
    "waitFor": "critical",
    "components": [
        {
            "name": "ContextMenuManager",
            "path": "./context-menu-manager.js",
            "required": false,
            "priority": 2,
            "dependencies": ["WallpaperManager"],
            "enabled": true,
            "config": {
                "constructorArgs": ["desktopComponent", "deps.WallpaperManager"],
                "postInit": null
            }
        },
        {
            "name": "DockComponent",
            "path": "../components/dock-component.js",
            "required": false,
            "priority": 2,
            "enabled": true,
            "isWebComponent": true,
            "tagName": "dock-component",
            "config": {
                "constructorArgs": ["desktopComponent"],
                "postInit": null
            }
        }
    ]
}
```

#### Optional Phase
Background services and optional features:

```javascript
{
    "name": "optional",
    "parallel": true,
    "waitFor": "ui",
    "defer": true,
    "components": [
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
        },
        {
            "name": "EventMonitor",
            "path": "../events/event-monitor.js",
            "required": false,
            "priority": 3,
            "enabled": true,
            "config": {
                "constructorArgs": ["desktopComponent"],
                "postInit": null
            }
        },
        {
            "name": "WebLLMService",
            "path": "./webllm-service.js",
            "required": false,
            "priority": 3,
            "enabled": true,
            "fallbackGraceful": true,
            "config": {
                "workerPath": "../chat-component/chat-worker.js",
                "defaultModel": "Qwen2.5-0.5B-Instruct-q0f16-MLC",
                "autoInitialize": false,
                "serviceVersion": "1.0.0",
                "constructorArgs": ["config.config"],
                "postInit": "initialize",
                "postInitArgs": [],
                "async": true
            }
        },
        {
            "name": "SpotlightComponent",
            "path": "/apps/spotlight/spotlight-component.js",
            "required": false,
            "priority": 4,
            "enabled": true,
            "isWebComponent": true,
            "tagName": "spotlight-component",
            "config": {
                "constructorArgs": ["desktopComponent"],
                "postInit": null
            }
        },
        {
            "name": "NotificationDisplayComponent",
            "path": "./notification-display-component.js",
            "required": false,
            "priority": 4,
            "enabled": true,
            "isWebComponent": true,
            "tagName": "notification-display-component",
            "appendTo": "shadowRoot",
            "elementId": "notification-display",
            "connectTo": "NotificationService",
            "connectMethod": "setDisplayComponent",
            "config": {
                "constructorArgs": ["desktopComponent"],
                "postInit": null
            }
        }
    ]
}
```

## Performance Configuration

### Performance Settings
```javascript
"performance": {
    "enableLazyLoading": true,      // Enable lazy component loading
    "maxConcurrentLoads": 3,        // Maximum concurrent component loads
    "timeoutMs": 5000,              // Component load timeout
    "retryAttempts": 2              // Retry attempts for failed loads
}
```

### Performance Options

#### enableLazyLoading
- **Type**: Boolean
- **Default**: `true`
- **Effect**: Components are loaded only when needed rather than all at startup

#### maxConcurrentLoads
- **Type**: Number
- **Default**: `3`
- **Effect**: Limits the number of components loading simultaneously to prevent browser overload

#### timeoutMs
- **Type**: Number (milliseconds)
- **Default**: `5000`
- **Effect**: Maximum time to wait for a component to load before timing out

#### retryAttempts
- **Type**: Number
- **Default**: `2`
- **Effect**: Number of times to retry loading a failed component

## Feature Configuration

### Feature Categories

#### Notifications
```javascript
"notifications": {
    "enabled": true,                // Enable notification system
    "soundsEnabled": true,          // Enable notification sounds
    "maxRetentionMs": 300000        // Notification retention time (5 minutes)
}
```

**Options**:
- `enabled`: Enable/disable the entire notification system
- `soundsEnabled`: Enable/disable notification sounds
- `maxRetentionMs`: How long to keep notifications in history

#### Event Monitoring
```javascript
"eventMonitoring": {
    "enabled": true,                // Enable event monitoring service
    "debugMode": false              // Enable debug logging
}
```

**Options**:
- `enabled`: Enable/disable system event monitoring
- `debugMode`: Enable detailed debug logging for development

#### WebLLM AI Service
```javascript
"webllm": {
    "enabled": true,                // Enable WebLLM service
    "autoInitialize": false,        // Auto-initialize on startup
    "defaultModel": "Qwen2.5-0.5B-Instruct-q0f16-MLC",
    "supportedModels": [
        {
            "id": "Qwen2.5-0.5B-Instruct-q0f16-MLC",
            "name": "Qwen 0.5B (Fast)",
            "size": "small"
        },
        {
            "id": "DeepSeek-R1-Distill-Qwen-7B-q4f16_1-MLC", 
            "name": "DeepSeek 7B (Smart)",
            "size": "large"
        }
    ],
    "generationDefaults": {
        "temperature": 0.7,          // Response creativity (0.0-1.0)
        "maxTokens": 1024,           // Maximum response length
        "stream": true               // Enable streaming responses
    }
}
```

**WebLLM Options**:
- `enabled`: Enable/disable AI service
- `autoInitialize`: Whether to initialize model on startup
- `defaultModel`: Model to use by default
- `supportedModels`: Array of available models
- `generationDefaults`: Default generation parameters

## Configuration Override System

### localStorage Override
For development and testing, configurations can be overridden using localStorage:

```javascript
// Override startup configuration
const customConfig = {
    startup: {
        phases: [
            // Custom phase configuration
        ]
    }
};

localStorage.setItem('startup-config-override', JSON.stringify(customConfig));
```

### Runtime Configuration Access
```javascript
// Access configuration in components
class MyComponent {
    constructor(config) {
        this.config = config;
        console.log('WebLLM enabled:', config.features.webllm.enabled);
    }
}
```

## Environment-Specific Configuration

### Development Configuration
```javascript
{
    "startup": {
        "performance": {
            "enableLazyLoading": false,  // Load all components immediately
            "maxConcurrentLoads": 10,    // Higher concurrency for development
            "timeoutMs": 10000,          // Longer timeout for debugging
            "retryAttempts": 0           // No retries for faster failure
        }
    },
    "features": {
        "eventMonitoring": {
            "enabled": true,
            "debugMode": true            // Enable debug logging
        }
    }
}
```

### Production Configuration
```javascript
{
    "startup": {
        "performance": {
            "enableLazyLoading": true,   // Optimize for performance
            "maxConcurrentLoads": 3,     // Conservative concurrency
            "timeoutMs": 5000,           // Reasonable timeout
            "retryAttempts": 2           // Retry for reliability
        }
    },
    "features": {
        "eventMonitoring": {
            "enabled": false,            // Disable in production
            "debugMode": false
        }
    }
}
```

## Custom Component Configuration

### Adding New Components

#### Service Components
```javascript
{
    "name": "MyCustomService",
    "path": "./my-custom-service.js",
    "required": false,
    "priority": 3,
    "enabled": true,
    "dependencies": ["AppService"],
    "config": {
        "constructorArgs": ["desktopComponent", "deps.AppService"],
        "postInit": "initialize",
        "postInitArgs": ["customParam"],
        "async": true
    }
}
```

#### Web Components
```javascript
{
    "name": "MyCustomComponent",
    "path": "./my-custom-component.js",
    "required": false,
    "priority": 4,
    "enabled": true,
    "isWebComponent": true,
    "tagName": "my-custom-component",
    "appendTo": "shadowRoot",
    "elementId": "my-custom-element",
    "config": {
        "constructorArgs": ["desktopComponent"],
        "postInit": "setup",
        "postInitArgs": []
    }
}
```

### Component Integration Patterns

#### Service Integration
```javascript
{
    "connectTo": "ExistingService",      // Connect to another service
    "connectMethod": "addComponent",     // Method to call for connection
    "config": {
        "serviceOptions": {
            "mode": "integration",
            "target": "ExistingService"
        }
    }
}
```

#### Conditional Loading
```javascript
{
    "name": "ConditionalComponent",
    "enabled": true,
    "config": {
        "loadCondition": "feature.enabled",  // Load only if condition met
        "fallbackComponent": "DefaultComponent"
    }
}
```

## Configuration Validation

### Component Validation
The startup manager validates component configurations:

```javascript
// Required fields
{
    "name": "string",               // Must be unique
    "path": "string",               // Must be valid path
    "enabled": "boolean"            // Must be boolean
}

// Optional field validation
{
    "priority": "number 1-5",       // Must be 1-5
    "dependencies": "array",        // Must be array of strings
    "isWebComponent": "boolean",    // Must be boolean
    "tagName": "string"             // Required if isWebComponent: true
}
```

### Feature Validation
Feature configurations are validated at startup:

```javascript
// Notification validation
{
    "notifications": {
        "enabled": "boolean",
        "soundsEnabled": "boolean",
        "maxRetentionMs": "positive number"
    }
}

// WebLLM validation
{
    "webllm": {
        "enabled": "boolean",
        "defaultModel": "string (must exist in supportedModels)",
        "generationDefaults": {
            "temperature": "number 0.0-1.0",
            "maxTokens": "positive number",
            "stream": "boolean"
        }
    }
}
```

## Configuration Best Practices

### 1. Component Organization
- Place critical services in the "critical" phase
- Put UI components in the "ui" phase
- Defer optional services to the "optional" phase

### 2. Dependency Management
- Always declare component dependencies
- Avoid circular dependencies
- Use graceful fallbacks for optional dependencies

### 3. Performance Optimization
- Enable lazy loading for production
- Set appropriate timeout values
- Limit concurrent loads to prevent browser overload

### 4. Error Handling
- Use `fallbackGraceful: true` for optional components
- Set `required: false` for non-critical components
- Provide fallback configurations for missing features

### 5. Environment Configuration
- Use different configurations for development and production
- Override configurations via localStorage for testing
- Document custom configuration options

## Configuration Schema Reference

### Complete Schema
```javascript
{
    "startup": {
        "phases": [
            {
                "name": "string",                    // Required
                "parallel": "boolean",               // Optional, default: false
                "waitFor": "string",                 // Optional
                "defer": "boolean",                  // Optional, default: false
                "components": [
                    {
                        "name": "string",            // Required, unique
                        "path": "string",            // Required
                        "required": "boolean",       // Optional, default: true
                        "priority": "number(1-5)",   // Optional, default: 3
                        "enabled": "boolean",        // Optional, default: true
                        "dependencies": ["string"],  // Optional
                        "isWebComponent": "boolean", // Optional, default: false
                        "tagName": "string",         // Required if isWebComponent: true
                        "appendTo": "string",        // Optional
                        "elementId": "string",       // Optional
                        "connectTo": "string",       // Optional
                        "connectMethod": "string",   // Optional
                        "fallbackGraceful": "boolean", // Optional, default: false
                        "config": {
                            "constructorArgs": ["any"], // Optional
                            "postInit": "string",       // Optional
                            "postInitArgs": ["any"],    // Optional
                            "async": "boolean"          // Optional, default: false
                        }
                    }
                ]
            }
        ],
        "performance": {
            "enableLazyLoading": "boolean",      // Optional, default: true
            "maxConcurrentLoads": "number",      // Optional, default: 3
            "timeoutMs": "number",               // Optional, default: 5000
            "retryAttempts": "number"            // Optional, default: 2
        }
    },
    "features": {
        "notifications": {
            "enabled": "boolean",                // Optional, default: true
            "soundsEnabled": "boolean",          // Optional, default: true
            "maxRetentionMs": "number"           // Optional, default: 300000
        },
        "eventMonitoring": {
            "enabled": "boolean",                // Optional, default: true
            "debugMode": "boolean"               // Optional, default: false
        },
        "webllm": {
            "enabled": "boolean",                // Optional, default: true
            "autoInitialize": "boolean",         // Optional, default: false
            "defaultModel": "string",            // Optional
            "supportedModels": ["object"],       // Optional
            "generationDefaults": {
                "temperature": "number(0-1)",    // Optional, default: 0.7
                "maxTokens": "number",           // Optional, default: 1024
                "stream": "boolean"              // Optional, default: true
            }
        }
    }
}
```

This configuration system provides fine-grained control over WE-OS startup behavior, performance characteristics, and feature availability, enabling both optimal performance and extensive customization.