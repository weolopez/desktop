/**
 * Simple Event Bus for component communication
 * Allows components to publish and subscribe to events without direct coupling
 */
class EventBus {
    constructor() {
        this.events = new Map();
        this.listenForAllEvents();
    }

    /**
     * Listen for all EVENTS and publish them
     */
    listenForAllEvents() {
        Object.values(EVENTS).forEach(eventName => {
            document.addEventListener(eventName, (e) => {
                this.publish(eventName, e.detail);
            });
        });
    }

    /**
     * Subscribe to an event
     * @param {string} eventName - Name of the event to listen for
     * @param {Function} callback - Function to call when event is fired
     * @param {Object} context - Optional context to bind the callback to
     */
    subscribe(eventName, callback, context = null) {
        if (!this.events.has(eventName)) {
            this.events.set(eventName, []);
        }
        
        const subscription = { callback, context };
        this.events.get(eventName).push(subscription);
        
        // Return unsubscribe function
        return () => {
            const subscribers = this.events.get(eventName);
            if (subscribers) {
                const index = subscribers.indexOf(subscription);
                if (index > -1) {
                    subscribers.splice(index, 1);
                }
            }
        };
    }

    /**
     * Publish an event
     * @param {string} eventName - Name of the event to publish
     * @param {any} data - Data to pass to subscribers
     */
    publish(eventName, data = null) {
        console.log(`[EVENT-BUS] Publishing event: ${eventName}`, data);
        
        const subscribers = this.events.get(eventName);
        if (!subscribers) {
            return;
        }

        subscribers.forEach(({ callback, context }) => {
            try {
                if (context) {
                    callback.call(context, data);
                } else {
                    callback(data);
                }
            } catch (error) {
                console.error(`[EVENT-BUS] Error in event handler for ${eventName}:`, error);
            }
        });
    }

    /**
     * Remove all subscribers for an event
     * @param {string} eventName - Name of the event to clear
     */
    clear(eventName) {
        this.events.delete(eventName);
    }

    /**
     * Remove all subscribers for all events
     */
    clearAll() {
        this.events.clear();
    }
}

// Create a global event bus instance
export const eventBus = new EventBus();

// Define standard event names
export const EVENTS = {
    SYSTEM_STARTUP: 'sys:startup',
    LAUNCH_APP: 'sys:launch-app',
    DB_INIT_REQUESTED: 'db:init-requested',
};