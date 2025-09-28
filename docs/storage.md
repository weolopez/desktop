# WE-OS Storage System Guide

**Updated**: 2025-09-28  
**Feature**: IndexedDB Migration (001-move-from-using)

## Overview
The WE-OS storage system has been migrated from localStorage to IndexedDB for increased capacity and structured data support. The `StorageService` class in `src/services/storage-service.js` provides a simple, promise-based API for persisting desktop state, session data, and extended content.

This guide covers usage, schema, and integration for developers.

## Database Schema
The `WEOS_DESKTOP` IndexedDB database (version 1) has three object stores:

### preferences
- **Key Path**: `key` (string)
- **Fields**: `key` (string), `value` (any JSON-serializable), `timestamp` (number)
- **Purpose**: Persistent user settings (e.g., wallpaper, dock position)
- **Example**: `{ key: 'wallpaperUrl', value: 'gradient.jpg', timestamp: 1727497600000 }`

### sessions
- **Key Path**: `id` (string, session UUID)
- **Fields**: `id` (string), `data` (JSON for window states, z-index), `created` (number), `updated` (number)
- **Indexes**: `created` (for cleanup)
- **Purpose**: Recoverable session state on refresh
- **Example**: `{ id: 'session-123', data: { windows: [...], focus: 'win1' }, created: 1727497600000, updated: 1727497700000 }`

### extended
- **Key Path**: `id` (string)
- **Fields**: `id` (string), `type` (string, e.g., 'virtual-file'), `content` (ArrayBuffer/JSON), `metadata` (JSON with size, mimeType)
- **Indexes**: `type`, `created`
- **Purpose**: Large datasets (files, configs) exceeding localStorage limits
- **Example**: `{ id: 'file-456', type: 'virtual-file', content: ArrayBuffer, metadata: { size: 1024, mimeType: 'text/plain' } }`

## Usage
Import and instantiate the service:

```javascript
import StorageService from '../services/storage-service.js';

const storage = new StorageService();
await storage.openDB(); // Initialize database
```

### Methods
- **setItem(key, value, store)**: Store data asynchronously.
  - `key`: Identifier (string)
  - `value`: Data to store (JSON-serializable or ArrayBuffer for extended)
  - `store`: 'preferences', 'sessions', or 'extended' (default: 'preferences')
  - Returns: Promise<{status: 'ok'}>
  - Example: `await storage.setItem('wallpaperUrl', 'image.jpg', 'preferences');`

- **getItem(key, store)**: Retrieve data.
  - Returns: Promise<value> or null if not found
  - Example: `const wallpaper = await storage.getItem('wallpaperUrl', 'preferences');`

- **removeItem(key, store)**: Delete data.
  - Returns: Promise<{status: 'ok'}>
  - Example: `await storage.removeItem('wallpaperUrl', 'preferences');`

All methods are async and use transactions for atomicity.

## Error Handling
- **Unsupported Browser**: Check `storage.supported`. If false, features are disabled; event 'storage:unsupported' dispatched.
- **Quota Exceeded**: Writes paused, event 'storage:quotaExceeded' dispatched. User must clear space or restart.
- **Access Denied**: Event 'storage:denied' dispatched; storage disabled.
- **General Errors**: Event 'storage:error' dispatched with details.

## Integration
- **DesktopComponent**: Automatically uses StorageService for attribute persistence (e.g., wallpaper, dock position).
- **Events**: Listen for 'storage:updated', 'storage:error', 'storage:quotaExceeded' to handle UI updates.
- **Fallback**: If IndexedDB fails, defaults to in-memory (no persistence).

## Best Practices
- Always await `openDB()` before operations.
- Handle promise rejections for errors.
- For large data, use 'extended' store with ArrayBuffer for binary content.
- Test in multiple browsers for quota and support variations.

See `src/services/storage-service.js` for full implementation.