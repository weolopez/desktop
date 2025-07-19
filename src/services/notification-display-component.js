/**
 * Notification Display Component
 * 
 * UI component for displaying notifications in the desktop environment.
 * Integrated with the core notification system and event framework.
 */

import { MESSAGES } from '../events/message-types.js';
import eventBus from '../events/event-bus.js';

class NotificationDisplayComponent extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.activeNotifications = new Map();
        this.animationQueue = [];
        this.isAnimating = false;
        
        this.render();
        this.setupEventListeners();
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
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
                    display: flex;
                    gap: 10px;
                    animation: slideIn 0.3s ease-out;
                    transform-origin: top right;
                    pointer-events: auto; /* Enable clicks on notifications */
                    cursor: pointer;
                    position: relative;
                    border: 1px solid rgba(255, 255, 255, 0.2);
                }
                
                .notification-item:hover {
                    background-color: rgba(245, 245, 245, 0.98);
                    box-shadow: 0 6px 16px rgba(0,0,0,0.2), 
                                0 0 0 1px rgba(255, 255, 255, 0.15);
                }
                
                .notification-item.closing {
                    animation: slideOut 0.3s ease-in forwards;
                }
                
                .notification-item.system {
                    border-left: 4px solid #007AFF;
                }
                
                .notification-item.warning {
                    border-left: 4px solid #FF9500;
                }
                
                .notification-item.error {
                    border-left: 4px solid #FF3B30;
                }
                
                .notification-item.success {
                    border-left: 4px solid #34C759;
                }
                
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
                
                .icon {
                    font-size: 24px;
                    flex-shrink: 0;
                    width: 32px;
                    height: 32px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: rgba(255, 255, 255, 0.3);
                    border-radius: 8px;
                }
                
                .content {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                    flex-grow: 1;
                    min-width: 0; /* Allow text to truncate */
                }
                
                .header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    gap: 8px;
                }
                
                .title {
                    font-weight: 600;
                    font-size: 14px;
                    color: #1d1d1f;
                    line-height: 1.2;
                    flex: 1;
                    word-wrap: break-word;
                }
                
                .timestamp {
                    font-size: 11px;
                    color: #666;
                    flex-shrink: 0;
                    font-weight: 400;
                }
                
                .body {
                    font-size: 13px;
                    color: #333;
                    line-height: 1.4;
                    word-wrap: break-word;
                    margin-top: 2px;
                }
                
                .actions {
                    margin-top: 8px;
                    display: flex;
                    gap: 8px;
                    justify-content: flex-end;
                    flex-wrap: wrap;
                }
                
                .action-button {
                    background-color: rgba(0, 122, 255, 0.1);
                    border: 1px solid rgba(0, 122, 255, 0.3);
                    border-radius: 6px;
                    padding: 4px 10px;
                    font-size: 12px;
                    font-weight: 500;
                    cursor: pointer;
                    color: #007AFF;
                    transition: all 0.2s ease;
                }
                
                .action-button:hover {
                    background-color: rgba(0, 122, 255, 0.2);
                    border-color: rgba(0, 122, 255, 0.5);
                    transform: translateY(-1px);
                }
                
                .action-button:active {
                    transform: translateY(0);
                }
                
                .source-indicator {
                    position: absolute;
                    top: 8px;
                    right: 8px;
                    font-size: 10px;
                    color: #999;
                    background: rgba(255, 255, 255, 0.5);
                    padding: 2px 6px;
                    border-radius: 4px;
                    pointer-events: none;
                }
                
                .close-button {
                    position: absolute;
                    top: 4px;
                    right: 4px;
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    background: rgba(0, 0, 0, 0.1);
                    border: none;
                    cursor: pointer;
                    display: none;
                    align-items: center;
                    justify-content: center;
                    font-size: 12px;
                    color: #666;
                    transition: all 0.2s ease;
                }
                
                .notification-item:hover .close-button {
                    display: flex;
                }
                
                .close-button:hover {
                    background: rgba(255, 59, 48, 0.8);
                    color: white;
                    transform: scale(1.1);
                }
                
                @media (max-width: 768px) {
                    :host {
                        right: 10px;
                        top: 30px;
                    }
                    
                    .notification-item {
                        width: 280px;
                    }
                }
                
                @media (max-width: 480px) {
                    :host {
                        right: 5px;
                        left: 5px;
                        align-items: stretch;
                    }
                    
                    .notification-item {
                        width: auto;
                    }
                }
            </style>
        `;
    }

    setupEventListeners() {
        // Listen for system-wide notification events
        document.addEventListener('notification-created', (e) => {
            // We don't handle this here as it's handled by the manager
        });
        
        // Handle visibility change to pause/resume animations
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pauseAnimations();
            } else {
                this.resumeAnimations();
            }
        });
    }

    /**
     * Show a notification
     * @param {Object} notification - Notification data
     */
    showNotification(notification) {
        // Check if notification already exists
        if (this.activeNotifications.has(notification.id)) {
            console.warn(`Notification ${notification.id} already displayed`);
            return;
        }

        const item = this.createNotificationItem(notification);
        this.shadowRoot.appendChild(item);
        this.activeNotifications.set(notification.id, item);

        console.log(`🔔 Displaying notification: ${notification.title} (${notification.id})`);
    }

    /**
     * Create a notification DOM element
     * @param {Object} notification - Notification data
     * @returns {HTMLElement} Notification element
     */
    createNotificationItem(notification) {
        const item = document.createElement('div');
        item.className = `notification-item ${notification.category || 'default'}`;
        item.dataset.id = notification.id;
        item.dataset.sourceAppId = notification.sourceAppId;

        const iconHtml = `<div class="icon">${notification.icon || '🔔'}</div>`;
        
        // Format timestamp
        const timeString = this.formatTimestamp(notification.timestamp);
        
        // Build actions HTML
        let actionsHtml = '';
        if (notification.actions && notification.actions.length > 0) {
            actionsHtml = '<div class="actions">';
            notification.actions.forEach(action => {
                actionsHtml += `<button class="action-button" data-action-id="${action.actionId}">${action.label}</button>`;
            });
            actionsHtml += '</div>';
        }

        item.innerHTML = `
            ${iconHtml}
            <div class="content">
                <div class="header">
                    <div class="title">${this.escapeHtml(notification.title)}</div>
                    <div class="timestamp">${timeString}</div>
                </div>
                <div class="body">${this.escapeHtml(notification.body)}</div>
                ${actionsHtml}
            </div>
            <div class="source-indicator">${notification.sourceAppId}</div>
            <button class="close-button" data-action="close">×</button>
        `;

        // Set up event listeners
        this.setupNotificationEventListeners(item, notification);

        return item;
    }

    /**
     * Setup event listeners for a notification item
     * @param {HTMLElement} item - Notification DOM element
     * @param {Object} notification - Notification data
     */
    setupNotificationEventListeners(item, notification) {
        // Main click handler
        item.addEventListener('click', (e) => {
            // Ignore clicks on action buttons and close button
            if (e.target.classList.contains('action-button') || 
                e.target.classList.contains('close-button')) {
                return;
            }

            // Dispatch notification clicked event
            this.dispatchNotificationEvent(MESSAGES.NOTIFICATION_CLICKED, {
                notificationId: notification.id,
                type: 'notification'
            });
        });

        // Action button clicks
        item.addEventListener('click', (e) => {
            if (e.target.classList.contains('action-button')) {
                e.stopPropagation();
                
                const actionId = e.target.dataset.actionId;
                this.dispatchNotificationEvent(MESSAGES.NOTIFICATION_CLICKED, {
                    notificationId: notification.id,
                    actionId,
                    type: 'action'
                });
            }
        });

        // Close button click
        item.addEventListener('click', (e) => {
            if (e.target.classList.contains('close-button') || 
                e.target.dataset.action === 'close') {
                e.stopPropagation();
                this.dismissNotification(notification.id);
            }
        });

        // Keyboard accessibility
        item.setAttribute('tabindex', '0');
        item.setAttribute('role', 'alert');
        item.setAttribute('aria-live', 'polite');
        
        item.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                item.click();
            } else if (e.key === 'Escape') {
                this.dismissNotification(notification.id);
            }
        });
    }

    /**
     * Dismiss a notification
     * @param {string} id - Notification ID
     */
    dismissNotification(id) {
        const item = this.activeNotifications.get(id);
        if (!item || item.classList.contains('closing')) {
            return;
        }

        item.classList.add('closing');
        
        // Dispatch dismissed event
        this.dispatchNotificationEvent(MESSAGES.NOTIFICATION_DISMISSED, {
            notificationId: id
        });
        
        // Remove after animation
        item.addEventListener('animationend', () => {
            if (item.parentNode) {
                item.remove();
            }
            this.activeNotifications.delete(id);
        }, { once: true });
    }

    /**
     * Clear all notifications
     */
    clearAllNotifications() {
        for (const id of this.activeNotifications.keys()) {
            this.dismissNotification(id);
        }
    }

    /**
     * Clear notifications for a specific app
     * @param {string} appId - App identifier
     */
    clearAppNotifications(appId) {
        for (const [id, item] of this.activeNotifications.entries()) {
            if (item.dataset.sourceAppId === appId) {
                this.dismissNotification(id);
            }
        }
    }

    /**
     * Format timestamp for display
     * @param {Date} timestamp - Timestamp to format
     * @returns {string} Formatted time string
     */
    formatTimestamp(timestamp) {
        const now = new Date();
        const diff = now - timestamp;
        
        // Less than 1 minute
        if (diff < 60000) {
            return 'now';
        }
        
        // Less than 1 hour
        if (diff < 3600000) {
            const minutes = Math.floor(diff / 60000);
            return `${minutes}m ago`;
        }
        
        // Less than 1 day
        if (diff < 86400000) {
            const hours = Math.floor(diff / 3600000);
            return `${hours}h ago`;
        }
        
        // Show actual time for older notifications
        return timestamp.toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    }

    /**
     * Escape HTML to prevent XSS
     * @param {string} text - Text to escape
     * @returns {string} Escaped text
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Dispatch a notification event using EventBus
     * @param {string} eventType - Event type
     * @param {Object} detail - Event detail
     */
    dispatchNotificationEvent(eventType, detail) {
        eventBus.publish(eventType, detail);
    }

    /**
     * Pause animations (when page is hidden)
     */
    pauseAnimations() {
        this.shadowRoot.querySelectorAll('.notification-item').forEach(item => {
            item.style.animationPlayState = 'paused';
        });
    }

    /**
     * Resume animations (when page becomes visible)
     */
    resumeAnimations() {
        this.shadowRoot.querySelectorAll('.notification-item').forEach(item => {
            item.style.animationPlayState = 'running';
        });
    }

    /**
     * Get current notification count
     * @returns {number} Number of active notifications
     */
    getNotificationCount() {
        return this.activeNotifications.size;
    }

    /**
     * Get notifications for a specific app
     * @param {string} appId - App identifier
     * @returns {Array} Array of notification elements
     */
    getAppNotifications(appId) {
        return Array.from(this.activeNotifications.values())
            .filter(item => item.dataset.sourceAppId === appId);
    }
}

customElements.define('notification-display-component', NotificationDisplayComponent);

export { NotificationDisplayComponent };