/**
 * EventBus - Centralized Event Management System
 * 
 * A unified service for dispatching and listening to custom events throughout
 * the desktop environment. This replaces scattered CustomEvent creation with
 * a clean, centralized API.
 * 
 */

import { MESSAGES, validateMessagePayload, getMessageDescription } from './message-types.js';

class EventBus {
    constructor() {
        this.listeners = new Map(); // Map of event types to listener arrays
        this.isDebugEnabled = false;

        window.eventLogs = [];
        const stored = localStorage.getItem('filteredEvents');
        window.filteredEvents = stored ? JSON.parse(stored) : [];
        window.addFilter = (eventType) => {
            !window.filteredEvents.includes(eventType) && (window.filteredEvents.push(eventType), localStorage.setItem('filteredEvents', JSON.stringify(window.filteredEvents)));
        };

        const originalDispatch = EventTarget.prototype.dispatchEvent;
        EventTarget.prototype.dispatchEvent = function(e) {
            if (e instanceof CustomEvent) {
                const isFiltered = window.filteredEvents.includes(e.type);
                if (!isFiltered) {
                    window.eventLogs.push({ type: e.type, detail: e.detail, time: Date.now(), target: this.tagName || 'window' });
                    if (window.eventLogs.length > 100) window.eventLogs.shift();
                }
            }
            return originalDispatch.apply(this, arguments);
        };
    }

    /**
     * Enable debug logging for all events
     * @param {boolean} enabled - Whether to enable debug logging
     */
    enableDebug(enabled = true) {
        this.isDebugEnabled = enabled;
        if (enabled) {
            console.log('🚌 EventBus debug logging enabled');
        }
    }

    /**
     * Publish an event to all listeners
     * @param {string} eventType - The event type (should be from MESSAGES enum)
     * @param {Object} payload - The event payload/detail
     * @param {Object} options - Additional event options
     * @param {boolean} options.bubbles - Whether the event bubbles (default: true)
     * @param {boolean} options.composed - Whether the event is composed (default: true)
     * @param {boolean} options.cancelable - Whether the event is cancelable (default: false)
     * @returns {boolean} True if event was dispatched successfully
     */
    publish(eventType, payload = {}, options = {}) {
        try {
            // Validate payload if it's a known message type
            if (Object.values(MESSAGES).includes(eventType)) {
                if (!validateMessagePayload(eventType, payload)) {
                    console.warn(`❌ EventBus: Invalid payload for ${eventType}:`, payload);
                    return false;
                }
            }

            // Create the custom event
            const event = new CustomEvent(eventType, {
                detail: payload,
                bubbles: options.bubbles !== false, // Default to true
                composed: options.composed !== false, // Default to true
                cancelable: options.cancelable === true // Default to false
            });

            // Debug logging
            if (this.isDebugEnabled) {
                const description = getMessageDescription(eventType);
                console.log(`🚌 EventBus.publish: ${eventType} - ${description}`, payload);
            }

            // Dispatch the event on the document
            document.dispatchEvent(event);
            
            return true;
        } catch (error) {
            console.error(`❌ EventBus: Failed to publish event ${eventType}:`, error);
            return false;
        }
    }

    /**
     * Subscribe to an event type
     * @param {string} eventType - The event type to listen for
     * @param {Function} callback - The callback function to execute
     * @param {Object} options - Additional options
     * @param {boolean} options.once - Whether to listen only once (default: false)
     * @returns {Function} Unsubscribe function
     */
    subscribe(eventType, callback, options = {}) {
        if (typeof callback !== 'function') {
            throw new Error('EventBus: Callback must be a function');
        }

        const wrappedCallback = (event) => {
            try {
                callback(event.detail, event);
            } catch (error) {
                console.error(`❌ EventBus: Error in event listener for ${eventType}:`, error);
            }
        };

        // Add event listener to document
        document.addEventListener(eventType, wrappedCallback, { once: options.once });

        // Track the listener for cleanup
        if (!this.listeners.has(eventType)) {
            this.listeners.set(eventType, []);
        }
        this.listeners.get(eventType).push(wrappedCallback);

        if (this.isDebugEnabled) {
            console.log(`🚌 EventBus.subscribe: ${eventType}`);
        }

        // Return unsubscribe function
        return () => {
            document.removeEventListener(eventType, wrappedCallback);
            const listeners = this.listeners.get(eventType);
            if (listeners) {
                const index = listeners.indexOf(wrappedCallback);
                if (index > -1) {
                    listeners.splice(index, 1);
                }
            }
        };
    }

    /**
     * Subscribe to an event type, but only listen once
     * @param {string} eventType - The event type to listen for
     * @param {Function} callback - The callback function to execute
     * @returns {Function} Unsubscribe function
     */
    once(eventType, callback) {
        return this.subscribe(eventType, callback, { once: true });
    }

    /**
     * Unsubscribe from all events of a specific type
     * @param {string} eventType - The event type to unsubscribe from
     */
    unsubscribeAll(eventType) {
        const listeners = this.listeners.get(eventType);
        if (listeners) {
            listeners.forEach(listener => {
                document.removeEventListener(eventType, listener);
            });
            this.listeners.delete(eventType);
        }

        if (this.isDebugEnabled) {
            console.log(`🚌 EventBus.unsubscribeAll: ${eventType}`);
        }
    }

    /**
     * Clear all event listeners managed by this EventBus
     */
    clear() {
        for (const [eventType, listeners] of this.listeners.entries()) {
            listeners.forEach(listener => {
                document.removeEventListener(eventType, listener);
            });
        }
        this.listeners.clear();

        if (this.isDebugEnabled) {
            console.log('🚌 EventBus: All listeners cleared');
        }
    }

    /**
     * Get statistics about current listeners
     * @returns {Object} Statistics object
     */
    getStats() {
        const stats = {
            totalEventTypes: this.listeners.size,
            totalListeners: 0,
            eventTypes: {}
        };

        for (const [eventType, listeners] of this.listeners.entries()) {
            stats.totalListeners += listeners.length;
            stats.eventTypes[eventType] = listeners.length;
        }

        return stats;
    }

    /**
     * Wait for a specific event to be published
     * @param {string} eventType - The event type to wait for
     * @param {number} timeout - Timeout in milliseconds (optional)
     * @returns {Promise} Promise that resolves with the event detail
     */
    waitFor(eventType, timeout) {
        return new Promise((resolve, reject) => {
            let timeoutId;
            
            const unsubscribe = this.once(eventType, (detail) => {
                if (timeoutId) {
                    clearTimeout(timeoutId);
                }
                resolve(detail);
            });

            if (timeout) {
                timeoutId = setTimeout(() => {
                    unsubscribe();
                    reject(new Error(`EventBus: Timeout waiting for event ${eventType}`));
                }, timeout);
            }
        });
    }
}

// Create and export a singleton instance
const eventBus = new EventBus();

// Make it available globally for debugging
if (typeof window !== 'undefined') {
    window.eventBus = eventBus;
}

export { eventBus };
export default eventBus;