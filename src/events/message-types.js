/**
 * Centralized Message Type Definitions
 * 
 * This file contains all system message types and their payload schemas.
 * Used across the desktop environment for:
 * - Custom events
 * - Notification system
 * - App launching
 * - Inter-component communication
 */

/**
 * System Message Types
 * @readonly
 * @enum {string}
 */
export const MESSAGES = {
    // Application lifecycle
    LAUNCH_APP: 'LAUNCH_APP',
    APP_LAUNCHED: 'APP_LAUNCHED',
    PUBLISH_TEXT: 'PUBLISH_TEXT',
    
    // Window management
    WINDOW_CLOSED: 'window-closed',
    WINDOW_MINIMIZE: 'window-minimize',
    WINDOW_MAXIMIZE: 'window-maximize',
    WINDOW_FOCUS: 'window-focus',
    WINDOW_FOCUSED: 'window-focused',
    WINDOW_RESTORE: 'restore-window',
    
    // Desktop interaction
    DESKTOP_CLICK: 'desktop-click',
    DESKTOP_CONTEXT_MENU: 'desktop-context-menu',
    
    // Dock management
    DOCK_ICON_CLICK: 'dock-icon-click',
    DOCK_CONTEXT_MENU: 'dock-context-menu',
    
    // Notification system - Core events
    CREATE_NOTIFICATION: 'create-notification',
    NOTIFICATION_CLICKED: 'notification-clicked',
    NOTIFICATION_DISMISSED: 'notification-dismissed',
    
    // Notification system - Management events
    NOTIFICATION_PERMISSION_REQUEST: 'notification-permission-request',
    NOTIFICATION_PERMISSION_RESULT: 'notification-permission-result',
    NOTIFICATION_CLEAR_ALL: 'notification-clear-all',
    NOTIFICATION_CLEAR_APP: 'notification-clear-app',
    NOTIFICATION_SETTINGS_UPDATE: 'notification-settings-update',
    NOTIFICATION_HISTORY_REQUEST: 'notification-history-request',
    
    // Notification system - Status events
    NOTIFICATION_CREATED: 'notification-created',
    NOTIFICATION_ERROR: 'notification-error',
    NOTIFICATION_ACTION: 'notification-action',
    NOTIFICATION_ACTION_TRIGGERED: 'notification-action-triggered',
    NOTIFICATION_DISMISSED_COMPLETE: 'notification-dismissed-complete',
    NOTIFICATIONS_CLEARED: 'notifications-cleared',
    NOTIFICATION_SETTINGS_UPDATED: 'notification-settings-updated',
    NOTIFICATION_HISTORY_RESPONSE: 'notification-history-response',
    
    // Finder app events
    FINDER_DIRECTORY_CHANGED: 'finder-directory-changed',
    FINDER_VIEW_MODE_CHANGED: 'finder-view-mode-changed',
    FINDER_SELECTION_CHANGED: 'finder-selection-changed',
    FINDER_ITEM_RENAMED: 'finder-item-renamed',
    FINDER_ITEM_DUPLICATED: 'finder-item-duplicated',
    FINDER_ITEMS_TRASHED: 'finder-items-trashed',
    FINDER_ITEMS_MOVED: 'finder-items-moved',
    FINDER_FILE_OPENED: 'finder-file-opened',
    
    // Finder file content events
    FINDER_FILE_CONTENT: 'finder-file-content',
    FINDER_FILE_REFERENCE: 'finder-file-reference',
    
    // File system
    FILE_DROPPED: 'file-dropped',
    FILE_PASTED: 'file-pasted',
    
    // System events
    SYSTEM_STARTUP: 'sys:startup',
    SYSTEM_SHUTDOWN: 'sys:shutdown',
    
    // Settings
    WALLPAPER_CHANGED: 'wallpaper-changed',
    SETTINGS_UPDATED: 'settings-updated',
    
    // WebLLM Subsystem - Initialization events
    WEBLLM_INIT_START: 'webllm-init-start',
    WEBLLM_INIT_PROGRESS: 'webllm-init-progress', 
    WEBLLM_INIT_COMPLETE: 'webllm-init-complete',
    WEBLLM_INIT_ERROR: 'webllm-init-error',
    WEBLLM_WORKER_TERMINATED: 'webllm-worker-terminated',
    
    // WebLLM Subsystem - Generation events
    WEBLLM_GENERATION_START: 'webllm-generation-start',
    WEBLLM_RESPONSE_CHUNK: 'webllm-response-chunk',
    WEBLLM_RESPONSE_COMPLETE: 'webllm-response-complete',
    WEBLLM_GENERATION_ERROR: 'webllm-generation-error',
    
    // WebLLM Subsystem - Management events
    WEBLLM_MODEL_CHANGED: 'webllm-model-changed',
    WEBLLM_STATUS_CHANGED: 'webllm-status-changed',
    WEBLLM_WARNING: 'webllm-warning',
    
    // WebLLM Subsystem - Service communication
    WEBLLM_SERVICE_READY: 'webllm-service-ready',
    WEBLLM_SERVICE_UNAVAILABLE: 'webllm-service-unavailable',
    WEBLLM_GENERATE_REQUEST: 'webllm-generate-request',
    WEBLLM_INITIALIZE_REQUEST: 'webllm-initialize-request',
    WEBLLM_TERMINATE_REQUEST: 'webllm-terminate-request'
};

/**
 * Message payload schemas with JSDoc type definitions
 */

/**
 * App launch message payload
 * @typedef {Object} LaunchAppPayload
 * @property {string} id - App identifier
 * @property {string} name - App display name
 * @property {string} icon - App icon (emoji or URL)
 * @property {string} sourceUrl - URL to app's web component
 * @property {string} tag - Web component tag name
 * @property {boolean} [onstartup] - Whether app starts on system startup
 * @property {boolean} [static] - Whether app is a static/singleton component
 * @property {number} [x] - Initial window x position
 * @property {number} [y] - Initial window y position
 * @property {number} [width] - Initial window width
 * @property {number} [height] - Initial window height
 * @property {Object} [initialState] - Initial app state
 */

/**
 * Publish text message payload
 * @typedef {Object} PublishTextPayload
 * @property {string|string[]} texts - Text content(s) to publish
 * @property {string} [icon] - Icon to use for text display
 * @property {string} [sourceUrl] - Source URL if text came from a URL
 */

/**
 * Window event payload
 * @typedef {Object} WindowEventPayload
 * @property {string} windowId - Unique window identifier
 * @property {string} appName - Name of the app in the window
 * @property {string} [appIcon] - App icon
 * @property {string} [appTag] - App web component tag
 * @property {number} [x] - Window x position
 * @property {number} [y] - Window y position
 * @property {number} [width] - Window width
 * @property {number} [height] - Window height
 * @property {boolean} [isMinimized] - Whether window is minimized
 * @property {boolean} [isMaximized] - Whether window is maximized
 * @property {boolean} [isFocused] - Whether window has focus
 */

/**
 * Notification message payload
 * @typedef {Object} NotificationPayload
 * @property {string} sourceAppId - ID of the app creating the notification
 * @property {string} title - Notification title
 * @property {string} body - Notification body text
 * @property {string} [icon] - Notification icon
 * @property {string} [category] - Notification category
 * @property {number} [duration] - Auto-dismiss duration in ms
 * @property {boolean} [persistent] - Whether notification persists
 * @property {Object} [actions] - Available actions for the notification
 */

/**
 * File drop/paste payload
 * @typedef {Object} FileEventPayload
 * @property {File[]} files - Array of File objects
 * @property {string} [text] - Text content if available
 * @property {number} x - Drop/paste x coordinate
 * @property {number} y - Drop/paste y coordinate
 */

/**
 * Desktop interaction payload
 * @typedef {Object} DesktopEventPayload
 * @property {number} x - Click x coordinate
 * @property {number} y - Click y coordinate
 * @property {MouseEvent} originalEvent - Original mouse event
 */

/**
 * Settings update payload
 * @typedef {Object} SettingsUpdatePayload
 * @property {string} category - Settings category (wallpaper, dock, etc.)
 * @property {string} key - Setting key
 * @property {any} value - New setting value
 * @property {any} [oldValue] - Previous setting value
 */

/**
 * Finder app event payloads
 * @typedef {Object} FinderDirectoryChangedPayload
 * @property {string} path - Directory path
 * @property {Array} items - Directory items
 */

/**
 * @typedef {Object} FinderSelectionChangedPayload
 * @property {string[]} selectedItems - Array of selected item paths
 */

/**
 * @typedef {Object} FinderViewModeChangedPayload
 * @property {string} mode - View mode (icon, list, column)
 */

/**
 * @typedef {Object} FinderItemRenamedPayload
 * @property {string} oldPath - Original item path
 * @property {string} newName - New item name
 */

/**
 * @typedef {Object} FinderItemsMovedPayload
 * @property {string[]} items - Array of item paths that were moved
 * @property {string} targetPath - Target directory path
 */

/**
 * @typedef {Object} FinderFileOpenedPayload
 * @property {string} path - File path
 * @property {string} name - File name
 */

/**
 * @typedef {Object} FinderFileContentPayload
 * @property {string} path - File path
 * @property {string} name - File name
 * @property {string} mimeType - File MIME type
 * @property {string} extension - File extension
 * @property {string} category - File category (text, image, etc.)
 * @property {number} size - File size in bytes
 * @property {string} encoding - Content encoding (utf8, base64)
 * @property {string} content - File content
 * @property {boolean} isBinary - Whether file is binary
 * @property {Object} metadata - Additional file metadata
 * @property {string} [gitStatus] - Git status of the file
 */

/**
 * @typedef {Object} FinderFileReferencePayload
 * @property {string} path - File path
 * @property {string} name - File name
 * @property {string} mimeType - File MIME type
 * @property {string} extension - File extension
 * @property {string} category - File category (text, image, etc.)
 * @property {number} size - File size in bytes
 * @property {string} reason - Reason for reference (binary_file_detected, file_too_large, etc.)
 * @property {string} [error] - Error message if applicable
 * @property {Object} metadata - Additional file metadata
 * @property {string} [gitStatus] - Git status of the file
 */

/**
 * @typedef {Object} NotificationClickedPayload
 * @property {string} notificationId - Notification identifier
 * @property {string} [actionId] - Action identifier if action was clicked
 * @property {string} type - Click type ('notification' or 'action')
 */

/**
 * @typedef {Object} NotificationDismissedPayload
 * @property {string} notificationId - Notification identifier
 */

/**
 * Notification management event payloads
 * @typedef {Object} NotificationPermissionRequestPayload
 * @property {string} appId - App requesting permission
 * @property {string} [level] - Permission level requested (default, alerts, banners)
 */

/**
 * @typedef {Object} NotificationPermissionResultPayload
 * @property {string} appId - App identifier
 * @property {string} level - Permission level
 * @property {boolean} granted - Whether permission was granted
 * @property {string} [error] - Error message if permission failed
 */

/**
 * @typedef {Object} NotificationClearAppPayload
 * @property {string} appId - App identifier to clear notifications for
 */

/**
 * @typedef {Object} NotificationSettingsUpdatePayload
 * @property {boolean} [enableNotifications] - Whether notifications are enabled
 * @property {boolean} [enableSounds] - Whether notification sounds are enabled
 * @property {number} [defaultDuration] - Default notification duration in ms
 * @property {number} [maxActiveNotifications] - Maximum active notifications
 * @property {number} [historyLimit] - Maximum notifications in history
 */

/**
 * @typedef {Object} NotificationHistoryRequestPayload
 * @property {string} [requestId] - Request identifier for response matching
 * @property {Object} [options] - Query options
 * @property {string} [options.appId] - Filter by app ID
 * @property {string} [options.category] - Filter by category
 * @property {boolean} [options.unreadOnly] - Only unread notifications
 * @property {number} [options.limit] - Limit number of results
 */

/**
 * Notification status event payloads
 * @typedef {Object} NotificationCreatedPayload
 * @property {string} notificationId - Created notification ID
 * @property {string} sourceAppId - Source app identifier
 */

/**
 * @typedef {Object} NotificationErrorPayload
 * @property {string} error - Error message
 * @property {string} sourceAppId - Source app identifier
 */

/**
 * @typedef {Object} NotificationActionPayload
 * @property {string} notificationId - Notification identifier
 * @property {string} [actionId] - Action identifier if action was triggered
 * @property {string} type - Action type ('notification' or 'action')
 * @property {string} sourceAppId - Source app identifier
 * @property {string} category - Notification category
 */

/**
 * @typedef {Object} NotificationActionTriggeredPayload
 * @property {string} notificationId - Notification identifier
 * @property {string} actionId - Action identifier
 * @property {string} sourceAppId - Source app identifier
 */

/**
 * @typedef {Object} NotificationsClearedPayload
 * @property {number} count - Number of notifications cleared
 * @property {string} type - Clear type ('all' or 'app')
 * @property {string} [appId] - App ID if type is 'app'
 */

/**
 * @typedef {Object} NotificationHistoryResponsePayload
 * @property {Array} history - Array of historical notifications
 * @property {string} [requestId] - Request identifier
 */

/**
 * WebLLM Subsystem Event Payloads
 */

/**
 * @typedef {Object} WebLLMInitStartPayload
 * @property {string} modelId - Model identifier being initialized
 */

/**
 * @typedef {Object} WebLLMInitProgressPayload
 * @property {string} text - Progress description text
 * @property {number} progress - Progress value (0.0 to 1.0)
 * @property {string} [phase] - Current initialization phase
 */

/**
 * @typedef {Object} WebLLMInitCompletePayload
 * @property {string} modelId - Model identifier that was loaded
 * @property {Array} [knowledgeFiles] - Array of loaded knowledge files
 * @property {boolean} success - Whether initialization was successful
 */

/**
 * @typedef {Object} WebLLMInitErrorPayload
 * @property {string} error - Error message
 * @property {string} [modelId] - Model identifier that failed to load
 * @property {string} [phase] - Phase where error occurred
 */

/**
 * @typedef {Object} WebLLMGenerationStartPayload
 * @property {Array} messages - Array of message objects sent to model
 * @property {string} [conversationId] - Conversation identifier
 */

/**
 * @typedef {Object} WebLLMResponseChunkPayload
 * @property {string} text - Accumulated response text so far
 * @property {string} [delta] - Just the new chunk added
 * @property {string} [conversationId] - Conversation identifier
 */

/**
 * @typedef {Object} WebLLMResponseCompletePayload
 * @property {Object} message - Complete message object
 * @property {string} message.role - Message role (assistant)
 * @property {string} message.content - Complete message content
 * @property {string} [conversationId] - Conversation identifier
 */

/**
 * @typedef {Object} WebLLMGenerationErrorPayload
 * @property {string} error - Error message
 * @property {Array} [messages] - Messages that caused the error
 * @property {string} [conversationId] - Conversation identifier
 */

/**
 * @typedef {Object} WebLLMModelChangedPayload
 * @property {string} oldModelId - Previous model identifier
 * @property {string} newModelId - New model identifier
 * @property {string} reason - Reason for model change
 */

/**
 * @typedef {Object} WebLLMStatusChangedPayload
 * @property {boolean} isInitialized - Whether model is initialized
 * @property {boolean} isProcessing - Whether currently processing
 * @property {string} currentModel - Current model identifier
 * @property {boolean} hasWorker - Whether worker is available
 * @property {string} status - Human-readable status description
 */

/**
 * @typedef {Object} WebLLMWarningPayload
 * @property {string} warning - Warning message
 * @property {string} [context] - Context where warning occurred
 */

/**
 * @typedef {Object} WebLLMServiceReadyPayload
 * @property {string} serviceVersion - Version of WebLLM service
 * @property {Array} supportedModels - Array of supported model objects
 * @property {Object} capabilities - Service capabilities
 */

/**
 * @typedef {Object} WebLLMGenerateRequestPayload
 * @property {Array} messages - Array of message objects
 * @property {string} [conversationId] - Conversation identifier
 * @property {Object} [options] - Generation options
 * @property {number} [options.temperature] - Temperature setting
 * @property {number} [options.maxTokens] - Maximum tokens to generate
 * @property {boolean} [options.stream] - Whether to stream response
 */

/**
 * @typedef {Object} WebLLMInitializeRequestPayload
 * @property {string} modelId - Model identifier to initialize
 * @property {Object} [config] - Initialization configuration
 * @property {boolean} [force] - Whether to force reinitialization
 */

/**
 * @typedef {Object} WebLLMTerminateRequestPayload
 * @property {string} [reason] - Reason for termination
 * @property {boolean} [cleanup] - Whether to perform cleanup
 */


/**
 * Validate message payload against expected schema
 * @param {string} messageType - Type of message to validate
 * @param {Object} payload - Payload to validate
 * @returns {boolean} Whether payload is valid
 */
export function validateMessagePayload(messageType, payload) {
    if (!payload || typeof payload !== 'object') {
        console.warn(`Invalid payload for message type ${messageType}:`, payload);
        return false;
    }
    
    // Basic validation - can be extended with more specific checks
    switch (messageType) {
        case MESSAGES.LAUNCH_APP:
            return typeof payload.id === 'string' ;
        case MESSAGES.PUBLISH_TEXT:
            return payload.texts && (typeof payload.texts === 'string' || Array.isArray(payload.texts));
        case MESSAGES.WINDOW_CLOSED:
        case MESSAGES.WINDOW_MINIMIZE:
        case MESSAGES.WINDOW_FOCUS:
            return typeof payload.windowId === 'string' && typeof payload.appName === 'string';
        case MESSAGES.CREATE_NOTIFICATION:
            return typeof payload.sourceAppId === 'string' && typeof payload.title === 'string';
        case MESSAGES.FINDER_DIRECTORY_CHANGED:
            return typeof payload.path === 'string' && Array.isArray(payload.items);
        case MESSAGES.FINDER_SELECTION_CHANGED:
            return Array.isArray(payload.selectedItems);
        case MESSAGES.FINDER_VIEW_MODE_CHANGED:
            return typeof payload.mode === 'string';
        case MESSAGES.FINDER_FILE_OPENED:
            return typeof payload.path === 'string' && typeof payload.name === 'string';
        case MESSAGES.FINDER_FILE_CONTENT:
            return typeof payload.path === 'string' && 
                   typeof payload.name === 'string' && 
                   typeof payload.mimeType === 'string' &&
                   typeof payload.content === 'string';
        case MESSAGES.FINDER_FILE_REFERENCE:
            return typeof payload.path === 'string' && 
                   typeof payload.name === 'string' && 
                   typeof payload.mimeType === 'string';
        case MESSAGES.NOTIFICATION_CLICKED:
            return typeof payload.notificationId === 'string' && typeof payload.type === 'string';
        case MESSAGES.NOTIFICATION_DISMISSED:
            return typeof payload.notificationId === 'string';
        case MESSAGES.NOTIFICATION_PERMISSION_REQUEST:
            return typeof payload.appId === 'string';
        case MESSAGES.NOTIFICATION_CLEAR_APP:
            return typeof payload.appId === 'string';
        case MESSAGES.NOTIFICATION_SETTINGS_UPDATE:
            return typeof payload === 'object' && payload !== null;
        case MESSAGES.NOTIFICATION_CREATED:
            return typeof payload.notificationId === 'string' && typeof payload.sourceAppId === 'string';
        case MESSAGES.NOTIFICATION_ERROR:
            return typeof payload.error === 'string' && typeof payload.sourceAppId === 'string';
        case MESSAGES.NOTIFICATION_ACTION:
            return typeof payload.notificationId === 'string' && 
                   typeof payload.type === 'string' && 
                   typeof payload.sourceAppId === 'string';
        case MESSAGES.WEBLLM_INIT_START:
            return typeof payload.modelId === 'string';
        case MESSAGES.WEBLLM_INIT_PROGRESS:
            return typeof payload.text === 'string' && typeof payload.progress === 'number';
        case MESSAGES.WEBLLM_INIT_COMPLETE:
            return typeof payload.modelId === 'string' && typeof payload.success === 'boolean';
        case MESSAGES.WEBLLM_INIT_ERROR:
        case MESSAGES.WEBLLM_GENERATION_ERROR:
            return typeof payload.error === 'string';
        case MESSAGES.WEBLLM_GENERATION_START:
            return Array.isArray(payload.messages);
        case MESSAGES.WEBLLM_RESPONSE_CHUNK:
            return typeof payload.text === 'string';
        case MESSAGES.WEBLLM_RESPONSE_COMPLETE:
            return payload.message && typeof payload.message.content === 'string';
        case MESSAGES.WEBLLM_MODEL_CHANGED:
            return typeof payload.oldModelId === 'string' && typeof payload.newModelId === 'string';
        case MESSAGES.WEBLLM_STATUS_CHANGED:
            return typeof payload.isInitialized === 'boolean' && typeof payload.status === 'string';
        case MESSAGES.WEBLLM_GENERATE_REQUEST:
            return Array.isArray(payload.messages);
        case MESSAGES.WEBLLM_INITIALIZE_REQUEST:
            return typeof payload.modelId === 'string';
        default:
            return true; // Unknown message types are allowed
    }
}

/**
 * Get message type description for debugging
 * @param {string} messageType - Message type constant
 * @returns {string} Human-readable description
 */
export function getMessageDescription(messageType) {
    const descriptions = {
        [MESSAGES.LAUNCH_APP]: 'Launch an application',
        [MESSAGES.PUBLISH_TEXT]: 'Publish text content to the desktop',
        [MESSAGES.WINDOW_CLOSED]: 'Window was closed',
        [MESSAGES.WINDOW_MINIMIZE]: 'Window was minimized',
        [MESSAGES.WINDOW_MAXIMIZE]: 'Window was maximized',
        [MESSAGES.WINDOW_FOCUS]: 'Window received focus',
        [MESSAGES.WINDOW_FOCUSED]: 'Window focus changed',
        [MESSAGES.WINDOW_RESTORE]: 'Restore a minimized window',
        [MESSAGES.CREATE_NOTIFICATION]: 'Create a system notification',
        [MESSAGES.NOTIFICATION_CLICKED]: 'Notification was clicked',
        [MESSAGES.NOTIFICATION_DISMISSED]: 'Notification was dismissed',
        [MESSAGES.NOTIFICATION_PERMISSION_REQUEST]: 'App requests notification permission',
        [MESSAGES.NOTIFICATION_PERMISSION_RESULT]: 'Notification permission result',
        [MESSAGES.NOTIFICATION_CLEAR_ALL]: 'Clear all notifications',
        [MESSAGES.NOTIFICATION_CLEAR_APP]: 'Clear app notifications',
        [MESSAGES.NOTIFICATION_SETTINGS_UPDATE]: 'Update notification settings',
        [MESSAGES.NOTIFICATION_HISTORY_REQUEST]: 'Request notification history',
        [MESSAGES.NOTIFICATION_CREATED]: 'Notification was created successfully',
        [MESSAGES.NOTIFICATION_ERROR]: 'Notification creation failed',
        [MESSAGES.NOTIFICATION_ACTION]: 'Notification action was triggered',
        [MESSAGES.NOTIFICATION_ACTION_TRIGGERED]: 'Specific notification action triggered',
        [MESSAGES.NOTIFICATION_DISMISSED_COMPLETE]: 'Notification dismissal completed',
        [MESSAGES.NOTIFICATIONS_CLEARED]: 'Notifications were cleared',
        [MESSAGES.NOTIFICATION_SETTINGS_UPDATED]: 'Notification settings were updated',
        [MESSAGES.NOTIFICATION_HISTORY_RESPONSE]: 'Notification history response',
        [MESSAGES.FINDER_DIRECTORY_CHANGED]: 'Finder directory was changed',
        [MESSAGES.FINDER_VIEW_MODE_CHANGED]: 'Finder view mode was changed',
        [MESSAGES.FINDER_SELECTION_CHANGED]: 'Finder selection was changed',
        [MESSAGES.FINDER_FILE_OPENED]: 'File was opened in Finder',
        [MESSAGES.FINDER_FILE_CONTENT]: 'File content is available for processing',
        [MESSAGES.FINDER_FILE_REFERENCE]: 'File reference is available (binary or large file)',
        [MESSAGES.WALLPAPER_CHANGED]: 'Desktop wallpaper was changed',
        [MESSAGES.SETTINGS_UPDATED]: 'System settings were updated',
        [MESSAGES.WEBLLM_INIT_START]: 'WebLLM model initialization started',
        [MESSAGES.WEBLLM_INIT_PROGRESS]: 'WebLLM model initialization progress update',
        [MESSAGES.WEBLLM_INIT_COMPLETE]: 'WebLLM model initialization completed',
        [MESSAGES.WEBLLM_INIT_ERROR]: 'WebLLM model initialization failed',
        [MESSAGES.WEBLLM_WORKER_TERMINATED]: 'WebLLM worker was terminated',
        [MESSAGES.WEBLLM_GENERATION_START]: 'WebLLM response generation started',
        [MESSAGES.WEBLLM_RESPONSE_CHUNK]: 'WebLLM response chunk received',
        [MESSAGES.WEBLLM_RESPONSE_COMPLETE]: 'WebLLM response generation completed',
        [MESSAGES.WEBLLM_GENERATION_ERROR]: 'WebLLM response generation failed',
        [MESSAGES.WEBLLM_MODEL_CHANGED]: 'WebLLM model was changed',
        [MESSAGES.WEBLLM_STATUS_CHANGED]: 'WebLLM service status changed',
        [MESSAGES.WEBLLM_WARNING]: 'WebLLM service warning',
        [MESSAGES.WEBLLM_SERVICE_READY]: 'WebLLM service is ready for use',
        [MESSAGES.WEBLLM_SERVICE_UNAVAILABLE]: 'WebLLM service is unavailable',
        [MESSAGES.WEBLLM_GENERATE_REQUEST]: 'Request WebLLM to generate response',
        [MESSAGES.WEBLLM_INITIALIZE_REQUEST]: 'Request WebLLM to initialize model',
        [MESSAGES.WEBLLM_TERMINATE_REQUEST]: 'Request WebLLM to terminate worker'
    };
    
    return descriptions[messageType] || 'Unknown message type';
}