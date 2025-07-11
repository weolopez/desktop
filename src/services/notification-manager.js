/**
 * Notification Manager
 * 
 * Manages integration between the NotificationService and the desktop environment.
 * Handles event listening, coordination with other services, and UI updates.
 */

import { MESSAGES, validateMessagePayload } from '../events/message-types.js';
import { NotificationService } from './notification-service.js';

export class NotificationManager {
    constructor(desktopComponent) {
        this.desktopComponent = desktopComponent;
        this.notificationService = new NotificationService();
        this.displayComponent = null; // Will be set when display component is ready
        
        // Auto-dismiss timers
        this.dismissTimers = new Map();
    }

    /**
     * Initialize the notification manager
     */
    init() {
        this.setupEventListeners();
        this.requestDefaultPermissions();
        
        console.log('🔔 NotificationManager initialized');
    }

    /**
     * Set the display component reference
     * @param {NotificationDisplayComponent} displayComponent - The UI component
     */
    setDisplayComponent(displayComponent) {
        this.displayComponent = displayComponent;
        console.log('🖥️ Notification display component connected');
    }

    /**
     * Setup event listeners for notification-related events
     */
    setupEventListeners() {
        // Listen for notification creation requests
        document.addEventListener(MESSAGES.CREATE_NOTIFICATION, (e) => {
            this.handleCreateNotification(e.detail);
        });

        // Listen for notification interactions
        document.addEventListener(MESSAGES.NOTIFICATION_CLICKED, (e) => {
            this.handleNotificationClick(e.detail);
        });

        document.addEventListener(MESSAGES.NOTIFICATION_DISMISSED, (e) => {
            this.handleNotificationDismiss(e.detail);
        });

        // Listen for permission requests
        document.addEventListener('notification-permission-request', (e) => {
            this.handlePermissionRequest(e.detail);
        });

        // Listen for bulk operations
        document.addEventListener('notification-clear-all', () => {
            this.handleClearAll();
        });

        document.addEventListener('notification-clear-app', (e) => {
            this.handleClearApp(e.detail);
        });

        // Listen for settings updates
        document.addEventListener('notification-settings-update', (e) => {
            this.handleSettingsUpdate(e.detail);
        });

        // Listen for history requests
        document.addEventListener('notification-history-request', (e) => {
            this.handleHistoryRequest(e.detail);
        });

        // Listen for app launch events to auto-grant permissions
        document.addEventListener(MESSAGES.LAUNCH_APP, (e) => {
            this.handleAppLaunch(e.detail);
        });
    }

    /**
     * Handle notification creation request
     * @param {NotificationPayload} payload - Notification data
     */
    handleCreateNotification(payload) {
        try {
            // Validate the payload
            if (!validateMessagePayload(MESSAGES.CREATE_NOTIFICATION, payload)) {
                console.error('Invalid notification payload:', payload);
                return;
            }

            // Create the notification
            const notificationId = this.notificationService.createNotification(payload);
            
            if (!notificationId) {
                // Permission denied or notifications disabled
                return;
            }

            // Get the created notification
            const notification = this.notificationService.getActiveNotifications()
                .find(n => n.id === notificationId);

            if (notification && this.displayComponent) {
                // Show in UI
                this.displayComponent.showNotification(notification);

                // Set up auto-dismiss timer if not persistent
                if (!notification.persistent && notification.duration > 0) {
                    this.setDismissTimer(notificationId, notification.duration);
                }
            }

            // Dispatch success event
            this.dispatchNotificationEvent('notification-created', {
                notificationId,
                sourceAppId: payload.sourceAppId
            });

        } catch (error) {
            console.error('Failed to create notification:', error);
            
            // Dispatch error event
            this.dispatchNotificationEvent('notification-error', {
                error: error.message,
                sourceAppId: payload.sourceAppId
            });
        }
    }

    /**
     * Handle notification click
     * @param {NotificationClickedPayload} payload - Click event data
     */
    handleNotificationClick(payload) {
        const { notificationId, actionId, type } = payload;
        
        // Update notification state
        this.notificationService.handleNotificationClick(notificationId, actionId);
        
        // Clear dismiss timer
        this.clearDismissTimer(notificationId);
        
        // Get notification details for event
        const notification = this.notificationService.getNotificationHistory({ limit: 1000 })
            .find(n => n.id === notificationId);

        if (notification) {
            // Dispatch click event with notification context
            this.dispatchNotificationEvent('notification-action', {
                notificationId,
                actionId,
                type,
                sourceAppId: notification.sourceAppId,
                category: notification.category
            });

            // If this was an action click, notify the source app
            if (actionId && notification.sourceAppId) {
                this.dispatchNotificationEvent('notification-action-triggered', {
                    notificationId,
                    actionId,
                    sourceAppId: notification.sourceAppId
                });
            }
        }

        // Auto-dismiss after click (unless it was an action that should keep it open)
        if (type === 'notification' || (type === 'action' && actionId !== 'keep-open')) {
            if (this.displayComponent) {
                this.displayComponent.dismissNotification(notificationId);
            }
        }
    }

    /**
     * Handle notification dismissal
     * @param {NotificationDismissedPayload} payload - Dismiss event data
     */
    handleNotificationDismiss(payload) {
        const { notificationId } = payload;
        
        // Update notification state
        this.notificationService.dismissNotification(notificationId, 'user');
        
        // Clear dismiss timer
        this.clearDismissTimer(notificationId);
        
        // Get notification details for event
        const notification = this.notificationService.getNotificationHistory({ limit: 1000 })
            .find(n => n.id === notificationId);

        if (notification) {
            // Dispatch dismiss event
            this.dispatchNotificationEvent('notification-dismissed-complete', {
                notificationId,
                sourceAppId: notification.sourceAppId
            });
        }
    }

    /**
     * Handle permission request
     * @param {Object} payload - Permission request data
     */
    handlePermissionRequest(payload) {
        const { appId, level = 'default' } = payload;
        
        try {
            const granted = this.notificationService.requestPermission(appId, level);
            
            // Dispatch permission result
            this.dispatchNotificationEvent('notification-permission-result', {
                appId,
                level,
                granted
            });
            
        } catch (error) {
            console.error('Failed to handle permission request:', error);
            
            this.dispatchNotificationEvent('notification-permission-result', {
                appId,
                level,
                granted: false,
                error: error.message
            });
        }
    }

    /**
     * Handle clear all notifications
     */
    handleClearAll() {
        const clearedCount = this.notificationService.clearAllNotifications();
        
        // Clear all UI notifications
        if (this.displayComponent) {
            this.displayComponent.clearAllNotifications();
        }
        
        // Clear all timers
        this.dismissTimers.clear();
        
        // Dispatch cleared event
        this.dispatchNotificationEvent('notifications-cleared', {
            count: clearedCount,
            type: 'all'
        });
    }

    /**
     * Handle clear app notifications
     * @param {Object} payload - Clear request data
     */
    handleClearApp(payload) {
        const { appId } = payload;
        const clearedCount = this.notificationService.clearAppNotifications(appId);
        
        // Clear app notifications from UI
        if (this.displayComponent) {
            this.displayComponent.clearAppNotifications(appId);
        }
        
        // Clear related timers
        for (const [notificationId, timer] of this.dismissTimers.entries()) {
            const notification = this.notificationService.getActiveNotifications()
                .find(n => n.id === notificationId);
            if (notification?.sourceAppId === appId) {
                clearTimeout(timer);
                this.dismissTimers.delete(notificationId);
            }
        }
        
        // Dispatch cleared event
        this.dispatchNotificationEvent('notifications-cleared', {
            count: clearedCount,
            type: 'app',
            appId
        });
    }

    /**
     * Handle settings update
     * @param {Object} payload - Settings data
     */
    handleSettingsUpdate(payload) {
        this.notificationService.updateSettings(payload);
        
        // If notifications were disabled, clear all active notifications
        if (payload.enableNotifications === false) {
            this.handleClearAll();
        }
        
        // Dispatch settings updated event
        this.dispatchNotificationEvent('notification-settings-updated', {
            settings: this.notificationService.getSettings()
        });
    }

    /**
     * Handle history request
     * @param {Object} payload - History request data
     */
    handleHistoryRequest(payload) {
        const history = this.notificationService.getNotificationHistory(payload.options || {});
        
        // Dispatch history response
        this.dispatchNotificationEvent('notification-history-response', {
            history,
            requestId: payload.requestId
        });
    }

    /**
     * Handle app launch - auto-grant notification permission
     * @param {LaunchAppPayload} payload - App launch data
     */
    handleAppLaunch(payload) {
        const { id: appId } = payload;
        
        // Auto-grant basic notification permission to launched apps
        if (appId && !this.notificationService.hasPermission(appId)) {
            this.notificationService.requestPermission(appId, 'default');
            console.log(`🔔 Auto-granted notification permission to ${appId}`);
        }
    }

    /**
     * Request default permissions for system components
     */
    requestDefaultPermissions() {
        // Grant permissions to system components
        const systemComponents = ['system', 'desktop', 'finder', 'window-manager'];
        
        systemComponents.forEach(componentId => {
            this.notificationService.requestPermission(componentId, 'alerts');
        });
    }

    /**
     * Set auto-dismiss timer for a notification
     * @param {string} notificationId - Notification ID
     * @param {number} duration - Duration in milliseconds
     */
    setDismissTimer(notificationId, duration) {
        // Clear existing timer if any
        this.clearDismissTimer(notificationId);
        
        const timer = setTimeout(() => {
            // Auto-dismiss the notification
            this.notificationService.dismissNotification(notificationId, 'timeout');
            
            // Remove from UI
            if (this.displayComponent) {
                this.displayComponent.dismissNotification(notificationId);
            }
            
            // Clean up timer
            this.dismissTimers.delete(notificationId);
            
            console.log(`⏰ Auto-dismissed notification: ${notificationId}`);
            
        }, duration);
        
        this.dismissTimers.set(notificationId, timer);
    }

    /**
     * Clear dismiss timer for a notification
     * @param {string} notificationId - Notification ID
     */
    clearDismissTimer(notificationId) {
        const timer = this.dismissTimers.get(notificationId);
        if (timer) {
            clearTimeout(timer);
            this.dismissTimers.delete(notificationId);
        }
    }

    /**
     * Dispatch a notification-related event
     * @param {string} eventType - Event type
     * @param {Object} detail - Event detail data
     */
    dispatchNotificationEvent(eventType, detail) {
        const event = new CustomEvent(eventType, {
            detail,
            bubbles: true,
            composed: true
        });
        
        document.dispatchEvent(event);
    }

    /**
     * Create a test notification (for debugging)
     * @param {string} sourceAppId - Source app identifier
     */
    createTestNotification(sourceAppId = 'system') {
        const testNotification = {
            sourceAppId,
            title: 'Test Notification',
            body: 'This is a test notification from the integrated notification system!',
            icon: '🧪',
            category: 'test',
            actions: [
                { actionId: 'test-action', label: 'Test Action' },
                { actionId: 'dismiss', label: 'Dismiss' }
            ]
        };
        
        // Dispatch create notification event
        document.dispatchEvent(new CustomEvent(MESSAGES.CREATE_NOTIFICATION, {
            detail: testNotification,
            bubbles: true,
            composed: true
        }));
    }

    /**
     * Get notification statistics
     * @returns {Object} Statistics about the notification system
     */
    getStatistics() {
        return {
            service: this.notificationService.getStatistics(),
            activeTimers: this.dismissTimers.size,
            displayComponentConnected: !!this.displayComponent
        };
    }

    /**
     * Get notification service instance (for direct access if needed)
     * @returns {NotificationService} The notification service
     */
    getService() {
        return this.notificationService;
    }
}