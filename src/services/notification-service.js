/**
 * Core Notification Service
 * 
 * Handles notification business logic, state management, and persistence.
 * This is the central service for all notification operations in the desktop environment.
 */

import { MESSAGES, validateMessagePayload } from '../events/message-types.js';

export class NotificationService {
    constructor() {
        this.notifications = new Map(); // Active notifications
        this.history = []; // All notifications (for history/center)
        this.permissions = new Map(); // App permissions
        this.settings = {
            enableNotifications: true,
            enableSounds: true,
            defaultDuration: 5000,
            maxActiveNotifications: 5,
            historyLimit: 100
        };
        
        this.nextId = 1;
        
        // Load persisted data
        this.loadPersistedData();
    }

    /**
     * Create a new notification
     * @param {NotificationPayload} payload - Notification data
     * @returns {string} Notification ID
     */
    createNotification(payload) {
        // Validate payload
        if (!validateMessagePayload(MESSAGES.CREATE_NOTIFICATION, payload)) {
            throw new Error('Invalid notification payload');
        }

        // Check permissions
        if (!this.hasPermission(payload.sourceAppId)) {
            console.warn(`App ${payload.sourceAppId} does not have notification permission`);
            return null;
        }

        // Check if notifications are enabled
        if (!this.settings.enableNotifications) {
            console.log('Notifications are disabled');
            return null;
        }

        // Generate unique ID
        const id = `notification-${this.nextId++}`;
        
        // Create notification object
        const notification = {
            id,
            sourceAppId: payload.sourceAppId,
            title: payload.title,
            body: payload.body,
            icon: payload.icon || '🔔',
            category: payload.category || 'default',
            duration: payload.duration || this.settings.defaultDuration,
            persistent: payload.persistent || false,
            actions: payload.actions || [],
            data: payload.data || {},
            timestamp: new Date(),
            status: 'active', // 'active', 'dismissed', 'clicked'
            read: false
        };

        // Add to active notifications
        this.notifications.set(id, notification);
        
        // Add to history
        this.addToHistory(notification);
        
        // Enforce max active notifications limit
        this.enforceNotificationLimits();
        
        // Persist changes
        this.persistData();
        
        console.log(`📱 Created notification: ${notification.title} (${id})`);
        
        return id;
    }

    /**
     * Update an existing notification
     * @param {string} id - Notification ID
     * @param {Object} updates - Updates to apply
     */
    updateNotification(id, updates) {
        const notification = this.notifications.get(id);
        if (!notification) {
            console.warn(`Notification ${id} not found`);
            return false;
        }

        // Apply updates
        Object.assign(notification, updates);
        notification.updatedAt = new Date();
        
        // Update history entry as well
        const historyEntry = this.history.find(n => n.id === id);
        if (historyEntry) {
            Object.assign(historyEntry, updates);
        }
        
        this.persistData();
        return true;
    }

    /**
     * Dismiss a notification
     * @param {string} id - Notification ID
     * @param {string} reason - Dismissal reason ('user', 'timeout', 'action')
     */
    dismissNotification(id, reason = 'user') {
        const notification = this.notifications.get(id);
        if (!notification) {
            return false;
        }

        // Update status
        notification.status = 'dismissed';
        notification.dismissedAt = new Date();
        notification.dismissReason = reason;
        
        // Remove from active notifications
        this.notifications.delete(id);
        
        // Update history
        const historyEntry = this.history.find(n => n.id === id);
        if (historyEntry) {
            historyEntry.status = 'dismissed';
            historyEntry.dismissedAt = notification.dismissedAt;
            historyEntry.dismissReason = reason;
        }
        
        this.persistData();
        
        console.log(`🗑️ Dismissed notification: ${id} (${reason})`);
        return true;
    }

    /**
     * Handle notification click
     * @param {string} id - Notification ID
     * @param {string} actionId - Optional action ID if action was clicked
     */
    handleNotificationClick(id, actionId = null) {
        const notification = this.notifications.get(id);
        if (!notification) {
            return false;
        }

        // Update status
        notification.status = 'clicked';
        notification.clickedAt = new Date();
        notification.read = true;
        
        if (actionId) {
            notification.clickedAction = actionId;
        }
        
        // Update history
        const historyEntry = this.history.find(n => n.id === id);
        if (historyEntry) {
            historyEntry.status = 'clicked';
            historyEntry.clickedAt = notification.clickedAt;
            historyEntry.read = true;
            if (actionId) {
                historyEntry.clickedAction = actionId;
            }
        }
        
        this.persistData();
        
        console.log(`👆 Notification clicked: ${id}${actionId ? ` (action: ${actionId})` : ''}`);
        return true;
    }

    /**
     * Clear all notifications for an app
     * @param {string} appId - App identifier
     */
    clearAppNotifications(appId) {
        let clearedCount = 0;
        
        // Remove from active notifications
        for (const [id, notification] of this.notifications.entries()) {
            if (notification.sourceAppId === appId) {
                this.dismissNotification(id, 'cleared');
                clearedCount++;
            }
        }
        
        console.log(`🧹 Cleared ${clearedCount} notifications for app: ${appId}`);
        return clearedCount;
    }

    /**
     * Clear all active notifications
     */
    clearAllNotifications() {
        const count = this.notifications.size;
        
        for (const id of this.notifications.keys()) {
            this.dismissNotification(id, 'cleared');
        }
        
        console.log(`🧹 Cleared all ${count} active notifications`);
        return count;
    }

    /**
     * Get active notifications
     * @param {string} appId - Optional app filter
     * @returns {Array} Array of active notifications
     */
    getActiveNotifications(appId = null) {
        const notifications = Array.from(this.notifications.values());
        
        if (appId) {
            return notifications.filter(n => n.sourceAppId === appId);
        }
        
        return notifications;
    }

    /**
     * Get notification history
     * @param {Object} options - Query options
     * @returns {Array} Array of historical notifications
     */
    getNotificationHistory(options = {}) {
        let history = [...this.history];
        
        // Apply filters
        if (options.appId) {
            history = history.filter(n => n.sourceAppId === options.appId);
        }
        
        if (options.category) {
            history = history.filter(n => n.category === options.category);
        }
        
        if (options.unreadOnly) {
            history = history.filter(n => !n.read);
        }
        
        // Apply sorting
        history.sort((a, b) => b.timestamp - a.timestamp);
        
        // Apply limit
        if (options.limit) {
            history = history.slice(0, options.limit);
        }
        
        return history;
    }

    /**
     * Request notification permission for an app
     * @param {string} appId - App identifier
     * @param {string} level - Permission level ('default', 'alerts', 'banners')
     */
    requestPermission(appId, level = 'default') {
        if (!appId) {
            throw new Error('App ID is required for notification permission');
        }
        
        // For now, automatically grant permission
        // In the future, this could show a permission dialog
        this.permissions.set(appId, {
            level,
            granted: true,
            grantedAt: new Date()
        });
        
        this.persistData();
        
        console.log(`✅ Granted ${level} notification permission to app: ${appId}`);
        return true;
    }

    /**
     * Check if an app has notification permission
     * @param {string} appId - App identifier
     * @returns {boolean} Whether app has permission
     */
    hasPermission(appId) {
        const permission = this.permissions.get(appId);
        return permission?.granted || false;
    }

    /**
     * Update notification settings
     * @param {Object} newSettings - Settings to update
     */
    updateSettings(newSettings) {
        Object.assign(this.settings, newSettings);
        this.persistData();
        
        console.log('⚙️ Updated notification settings:', newSettings);
    }

    /**
     * Get current notification settings
     * @returns {Object} Current settings
     */
    getSettings() {
        return { ...this.settings };
    }

    /**
     * Add notification to history
     * @private
     */
    addToHistory(notification) {
        // Add copy to history
        this.history.unshift({ ...notification });
        
        // Enforce history limit
        if (this.history.length > this.settings.historyLimit) {
            this.history = this.history.slice(0, this.settings.historyLimit);
        }
    }

    /**
     * Enforce notification limits
     * @private
     */
    enforceNotificationLimits() {
        if (this.notifications.size <= this.settings.maxActiveNotifications) {
            return;
        }
        
        // Dismiss oldest notifications first
        const sorted = Array.from(this.notifications.entries())
            .sort(([, a], [, b]) => a.timestamp - b.timestamp);
        
        const toRemove = sorted.slice(0, this.notifications.size - this.settings.maxActiveNotifications);
        
        for (const [id] of toRemove) {
            this.dismissNotification(id, 'limit');
        }
    }

    /**
     * Load persisted data from localStorage
     * @private
     */
    loadPersistedData() {
        try {
            // Load settings
            const savedSettings = localStorage.getItem('desktopNotificationSettings');
            if (savedSettings) {
                Object.assign(this.settings, JSON.parse(savedSettings));
            }
            
            // Load permissions
            const savedPermissions = localStorage.getItem('desktopNotificationPermissions');
            if (savedPermissions) {
                const permissionsData = JSON.parse(savedPermissions);
                this.permissions = new Map(Object.entries(permissionsData));
            }
            
            // Load history
            const savedHistory = localStorage.getItem('desktopNotificationHistory');
            if (savedHistory) {
                this.history = JSON.parse(savedHistory).map(n => ({
                    ...n,
                    timestamp: new Date(n.timestamp),
                    dismissedAt: n.dismissedAt ? new Date(n.dismissedAt) : undefined,
                    clickedAt: n.clickedAt ? new Date(n.clickedAt) : undefined
                }));
            }
            
            // Load next ID
            const savedNextId = localStorage.getItem('desktopNotificationNextId');
            if (savedNextId) {
                this.nextId = parseInt(savedNextId);
            }
            
        } catch (error) {
            console.error('Failed to load notification data:', error);
        }
    }

    /**
     * Persist data to localStorage
     * @private
     */
    persistData() {
        try {
            // Save settings
            localStorage.setItem('desktopNotificationSettings', JSON.stringify(this.settings));
            
            // Save permissions
            const permissionsObj = Object.fromEntries(this.permissions);
            localStorage.setItem('desktopNotificationPermissions', JSON.stringify(permissionsObj));
            
            // Save history
            localStorage.setItem('desktopNotificationHistory', JSON.stringify(this.history));
            
            // Save next ID
            localStorage.setItem('desktopNotificationNextId', this.nextId.toString());
            
        } catch (error) {
            console.error('Failed to persist notification data:', error);
        }
    }

    /**
     * Get notification statistics
     * @returns {Object} Statistics about notifications
     */
    getStatistics() {
        const totalHistory = this.history.length;
        const activeCount = this.notifications.size;
        const unreadCount = this.history.filter(n => !n.read).length;
        
        const appStats = {};
        this.history.forEach(n => {
            if (!appStats[n.sourceAppId]) {
                appStats[n.sourceAppId] = { total: 0, unread: 0 };
            }
            appStats[n.sourceAppId].total++;
            if (!n.read) {
                appStats[n.sourceAppId].unread++;
            }
        });
        
        return {
            total: totalHistory,
            active: activeCount,
            unread: unreadCount,
            permissions: this.permissions.size,
            byApp: appStats
        };
    }
}