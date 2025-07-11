/**
 * Event Monitor - Global debugging utility for custom events
 * 
 * Provides console-based debugging tools for tracking custom events
 * throughout the desktop environment.
 */

import { MESSAGES, getMessageDescription, validateMessagePayload } from './message-types.js';

/**
 * Global Event Monitor Class
 */
class EventMonitor {
    constructor() {
        this.isEnabled = false;
        this.eventHistory = [];
        this.maxHistorySize = 100;
        this.filters = new Set();
        this.subscribers = new Map();
        this.startTime = Date.now();
        
        // Bind methods for console access
        this.enable = this.enable.bind(this);
        this.disable = this.disable.bind(this);
        this.clear = this.clear.bind(this);
        this.filter = this.filter.bind(this);
        this.unfilter = this.unfilter.bind(this);
        this.history = this.history.bind(this);
        this.stats = this.stats.bind(this);
    }

    /**
     * Enable event monitoring
     * @param {boolean} [verbose=false] - Whether to log all events or just monitored ones
     */
    enable(verbose = false) {
        if (this.isEnabled) {
            console.log('🔍 Event Monitor is already enabled');
            return;
        }

        this.isEnabled = true;
        this.verbose = verbose;
        
        // Listen for all known message types
        Object.values(MESSAGES).forEach(messageType => {
            this.startMonitoring(messageType);
        });
        
        // Also listen for any custom events on document
        this.originalDispatchEvent = document.dispatchEvent;
        document.dispatchEvent = (event) => {
            if (event instanceof CustomEvent) {
                this.logEvent(event);
            }
            return this.originalDispatchEvent.call(document, event);
        };
        
        console.log('🔍 Event Monitor enabled');
        console.log('📝 Use eventMonitor.help() for available commands');
    }

    /**
     * Disable event monitoring
     */
    disable() {
        if (!this.isEnabled) {
            console.log('🔍 Event Monitor is already disabled');
            return;
        }

        this.isEnabled = false;
        
        // Remove all listeners
        this.subscribers.forEach((listener, messageType) => {
            document.removeEventListener(messageType, listener);
        });
        this.subscribers.clear();
        
        // Restore original dispatchEvent
        if (this.originalDispatchEvent) {
            document.dispatchEvent = this.originalDispatchEvent;
        }
        
        console.log('🔍 Event Monitor disabled');
    }

    /**
     * Start monitoring a specific message type
     * @param {string} messageType - Message type to monitor
     */
    startMonitoring(messageType) {
        if (this.subscribers.has(messageType)) {
            return; // Already monitoring
        }

        const listener = (event) => {
            this.logEvent(event);
        };

        document.addEventListener(messageType, listener);
        this.subscribers.set(messageType, listener);
    }

    /**
     * Log an event
     * @param {CustomEvent} event - Event to log
     */
    logEvent(event) {
        if (!this.isEnabled) return;

        const timestamp = Date.now();
        const relativeTime = timestamp - this.startTime;
        
        const eventData = {
            type: event.type,
            detail: event.detail,
            timestamp,
            relativeTime,
            target: event.target?.constructor?.name || 'unknown',
            bubbles: event.bubbles,
            composed: event.composed
        };

        // Add to history
        this.eventHistory.push(eventData);
        if (this.eventHistory.length > this.maxHistorySize) {
            this.eventHistory.shift();
        }

        // Check filters
        if (this.filters.size > 0 && !this.filters.has(event.type)) {
            return; // Filtered out
        }

        // Validate payload if known message type
        if (Object.values(MESSAGES).includes(event.type)) {
            const isValid = validateMessagePayload(event.type, event.detail);
            if (!isValid) {
                console.warn(`⚠️  Invalid payload for ${event.type}:`, event.detail);
            }
        }

        // Log the event
        const description = getMessageDescription(event.type);
        const timeStr = `+${relativeTime}ms`;
        
        if (this.verbose || this.filters.has(event.type)) {
            console.group(`📡 ${event.type} ${timeStr}`);
            console.log('📄 Description:', description);
            console.log('🎯 Target:', eventData.target);
            console.log('💾 Detail:', event.detail);
            console.log('⚙️  Config:', {
                bubbles: event.bubbles,
                composed: event.composed,
                cancelable: event.cancelable
            });
            console.groupEnd();
        } else {
            console.log(`📡 ${event.type} ${timeStr} - ${description}`);
        }
    }

    /**
     * Filter events to only show specific types
     * @param {...string} messageTypes - Message types to filter for
     */
    filter(...messageTypes) {
        messageTypes.forEach(type => this.filters.add(type));
        console.log(`🔍 Filtering events for:`, Array.from(this.filters));
    }

    /**
     * Remove event type filters
     * @param {...string} messageTypes - Message types to remove from filter
     */
    unfilter(...messageTypes) {
        if (messageTypes.length === 0) {
            this.filters.clear();
            console.log('🔍 All filters cleared');
        } else {
            messageTypes.forEach(type => this.filters.delete(type));
            console.log(`🔍 Removed filters for:`, messageTypes);
        }
    }

    /**
     * Get event history
     * @param {number} [count=10] - Number of recent events to show
     * @returns {Array} Recent events
     */
    history(count = 10) {
        const recent = this.eventHistory.slice(-count);
        console.table(recent.map(event => ({
            Type: event.type,
            Time: `+${event.relativeTime}ms`,
            Target: event.target,
            Detail: JSON.stringify(event.detail, null, 2).slice(0, 100) + '...'
        })));
        return recent;
    }

    /**
     * Get event statistics
     */
    stats() {
        const stats = {};
        this.eventHistory.forEach(event => {
            stats[event.type] = (stats[event.type] || 0) + 1;
        });

        console.log('📊 Event Statistics:');
        console.table(stats);
        
        const totalEvents = this.eventHistory.length;
        const uptime = Date.now() - this.startTime;
        const eventsPerSecond = (totalEvents / (uptime / 1000)).toFixed(2);
        
        console.log(`📈 Total events: ${totalEvents}`);
        console.log(`⏱️  Uptime: ${(uptime / 1000).toFixed(1)}s`);
        console.log(`🚀 Events/sec: ${eventsPerSecond}`);
        
        return stats;
    }

    /**
     * Clear event history
     */
    clear() {
        this.eventHistory = [];
        console.log('🗑️  Event history cleared');
    }

    /**
     * Search events by type or content
     * @param {string} query - Search query
     * @returns {Array} Matching events
     */
    search(query) {
        const results = this.eventHistory.filter(event => {
            const eventStr = JSON.stringify(event, null, 2).toLowerCase();
            return eventStr.includes(query.toLowerCase());
        });
        
        console.log(`🔍 Found ${results.length} events matching "${query}"`);
        console.table(results.map(event => ({
            Type: event.type,
            Time: `+${event.relativeTime}ms`,
            Target: event.target
        })));
        
        return results;
    }

    /**
     * Show help information
     */
    help() {
        console.log(`
🔍 Event Monitor Commands:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📡 Monitoring
  eventMonitor.enable()          - Enable event monitoring
  eventMonitor.enable(true)      - Enable verbose logging
  eventMonitor.disable()         - Disable event monitoring

🔍 Filtering
  eventMonitor.filter('LAUNCH_APP', 'WINDOW_CLOSED')  - Filter specific events
  eventMonitor.unfilter()        - Clear all filters
  eventMonitor.unfilter('LAUNCH_APP')  - Remove specific filter

📊 Analysis
  eventMonitor.history()         - Show recent events (default: 10)
  eventMonitor.history(25)       - Show last 25 events
  eventMonitor.stats()           - Show event statistics
  eventMonitor.search('window')  - Search events by content

🧹 Utilities
  eventMonitor.clear()           - Clear event history
  eventMonitor.help()            - Show this help

💡 Examples:
  eventMonitor.enable()
  eventMonitor.filter('LAUNCH_APP', 'WINDOW_CLOSED')
  eventMonitor.history(20)
  eventMonitor.stats()
        `);
    }
}

// Create global instance
const eventMonitor = new EventMonitor();

// Make it available globally
if (typeof window !== 'undefined') {
    window.eventMonitor = eventMonitor;
}

export { eventMonitor };
export default eventMonitor;