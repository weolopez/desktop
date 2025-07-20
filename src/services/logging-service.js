/**
 * Centralized Logging Service
 * 
 * Provides event-driven logging system that replaces console.log calls
 * with structured events that can be monitored, filtered, and routed.
 */

import { MESSAGES } from '../events/message-types.js';

/**
 * Log levels enum
 */
export const LOG_LEVELS = {
    DEBUG: 'debug',
    INFO: 'info', 
    WARN: 'warn',
    ERROR: 'error'
};

/**
 * Centralized Logging Service Class
 */
class LoggingService {
    constructor() {
        this.isEnabled = true;
        this.developmentMode = this.isDevelopmentMode();
        this.logBuffer = [];
        this.maxBufferSize = 1000;
        this.logLevel = this.developmentMode ? LOG_LEVELS.DEBUG : LOG_LEVELS.INFO; // Set default log level based on mode
        this.filters = new Set();
        this.consoleOutput = this.developmentMode; // Enable console output only in development
        
        // Performance tracking
        this.performanceMarks = new Map();
        
        // Initialize service
        this.init();
    }

    /**
     * Initialize the logging service
     */
    init() {
        // Log initialization message based on mode
        if (this.developmentMode) {
            this.info('LoggingService', 'Initialized in development mode');
        } else {
            this.info('LoggingService', 'Initialized in production mode');
        }
    }

    /**
     * Detect if we're in development mode
     */
    isDevelopmentMode() {
        return window.location.hostname === 'localhost' || 
               window.location.hostname === '127.0.0.1' ||
               window.location.protocol === 'file:';
    }

    /**
     * Set log level filter
     * @param {string} level - Minimum log level to output
     */
    setLogLevel(level) {
        const levels = Object.values(LOG_LEVELS);
        if (levels.includes(level)) {
            this.logLevel = level;
            this.log(LOG_LEVELS.INFO, 'LoggingService', `Log level set to ${level}`);
        }
    }

    /**
     * Enable or disable console output
     * @param {boolean} enabled - Whether to output to console
     */
    setConsoleOutput(enabled) {
        this.consoleOutput = enabled;
        this.log(LOG_LEVELS.INFO, 'LoggingService', `Console output ${enabled ? 'enabled' : 'disabled'}`);
    }

    /**
     * Check if log level should be output
     * @param {string} level - Log level to check
     * @returns {boolean} Whether to output this level
     */
    shouldLog(level) {
        const levels = [LOG_LEVELS.DEBUG, LOG_LEVELS.INFO, LOG_LEVELS.WARN, LOG_LEVELS.ERROR];
        const currentIndex = levels.indexOf(this.logLevel);
        const messageIndex = levels.indexOf(level);
        return messageIndex >= currentIndex;
    }

    /**
     * Core logging method
     * @param {string} level - Log level
     * @param {string} source - Source component/service
     * @param {string} message - Log message
     * @param {Object} metadata - Additional metadata
     */
    log(level, source, message, metadata = {}) {
        if (!this.isEnabled || !this.shouldLog(level)) {
            return;
        }

        const timestamp = Date.now();
        const logEntry = {
            level,
            source,
            message,
            metadata,
            timestamp
        };

        // Add to buffer
        this.addToBuffer(logEntry);

        // Output to console in development mode
        if (this.developmentMode && this.consoleOutput) {
            this.outputToConsole(logEntry);
        }

        // Emit as event
        this.emitLogEvent(level, logEntry);
    }

    /**
     * Add log entry to buffer
     * @param {Object} logEntry - Log entry to buffer
     */
    addToBuffer(logEntry) {
        this.logBuffer.push(logEntry);
        if (this.logBuffer.length > this.maxBufferSize) {
            this.logBuffer.shift();
        }
    }

    /**
     * Output log to console with appropriate styling
     * @param {Object} logEntry - Log entry to output
     */
    outputToConsole(logEntry) {
        const { level, source, message, metadata, timestamp } = logEntry;
        const time = new Date(timestamp).toLocaleTimeString();
        
        const styles = {
            [LOG_LEVELS.DEBUG]: 'color: #888; font-size: 0.9em',
            [LOG_LEVELS.INFO]: 'color: #007acc',
            [LOG_LEVELS.WARN]: 'color: #ff8c00; font-weight: bold',
            [LOG_LEVELS.ERROR]: 'color: #d73a49; font-weight: bold'
        };

        const prefix = {
            [LOG_LEVELS.DEBUG]: '🔍',
            [LOG_LEVELS.INFO]: 'ℹ️',
            [LOG_LEVELS.WARN]: '⚠️',
            [LOG_LEVELS.ERROR]: '❌'
        };

        console.log(
            `%c${prefix[level]} [${time}] ${source}: ${message}`,
            styles[level]
        );

        if (Object.keys(metadata).length > 0) {
            console.log('   Metadata:', metadata);
        }
    }

    /**
     * Emit log as system event
     * @param {string} level - Log level
     * @param {Object} logEntry - Log entry data
     */
    emitLogEvent(level, logEntry) {
        const eventType = {
            [LOG_LEVELS.DEBUG]: MESSAGES.SYSTEM_LOG_DEBUG,
            [LOG_LEVELS.INFO]: MESSAGES.SYSTEM_LOG_INFO,
            [LOG_LEVELS.WARN]: MESSAGES.SYSTEM_LOG_WARN,
            [LOG_LEVELS.ERROR]: MESSAGES.SYSTEM_LOG_ERROR
        }[level];

        if (eventType) {
            document.dispatchEvent(new CustomEvent(eventType, {
                detail: logEntry
            }));
        }
    }

    /**
     * Debug log
     * @param {string} source - Source component
     * @param {string} message - Debug message
     * @param {Object} metadata - Additional metadata
     */
    debug(source, message, metadata = {}) {
        this.log(LOG_LEVELS.DEBUG, source, message, metadata);
    }

    /**
     * Info log
     * @param {string} source - Source component
     * @param {string} message - Info message
     * @param {Object} metadata - Additional metadata
     */
    info(source, message, metadata = {}) {
        this.log(LOG_LEVELS.INFO, source, message, metadata);
    }

    /**
     * Warning log
     * @param {string} source - Source component
     * @param {string} message - Warning message
     * @param {Object} metadata - Additional metadata
     */
    warn(source, message, metadata = {}) {
        this.log(LOG_LEVELS.WARN, source, message, metadata);
    }

    /**
     * Error log
     * @param {string} source - Source component
     * @param {string} message - Error message
     * @param {Object} metadata - Additional metadata
     */
    error(source, message, metadata = {}) {
        this.log(LOG_LEVELS.ERROR, source, message, metadata);
    }

    /**
     * Component lifecycle logging
     * @param {string} component - Component name
     * @param {string} action - Lifecycle action
     * @param {Object} metadata - Additional metadata
     */
    lifecycle(component, action, metadata = {}) {
        const logEntry = {
            component,
            action,
            metadata,
            timestamp: Date.now()
        };

        this.addToBuffer({ ...logEntry, level: LOG_LEVELS.INFO, source: 'Lifecycle' });

        if (this.developmentMode && this.consoleOutput) {
            console.log(`🔄 [${component}] ${action}`, metadata);
        }

        document.dispatchEvent(new CustomEvent(MESSAGES.COMPONENT_LIFECYCLE_LOG, {
            detail: logEntry
        }));
    }

    /**
     * User action logging
     * @param {string} action - Action type
     * @param {string} target - Target element/component
     * @param {Object} metadata - Additional metadata
     */
    userAction(action, target, metadata = {}) {
        const logEntry = {
            action,
            target,
            metadata,
            timestamp: Date.now()
        };

        this.addToBuffer({ ...logEntry, level: LOG_LEVELS.INFO, source: 'UserAction' });

        if (this.developmentMode && this.consoleOutput) {
            console.log(`👆 User ${action} on ${target}`, metadata);
        }

        document.dispatchEvent(new CustomEvent(MESSAGES.USER_ACTION_LOG, {
            detail: logEntry
        }));
    }

    /**
     * Performance logging
     * @param {string} metric - Metric name
     * @param {number} value - Metric value
     * @param {string} unit - Unit of measurement
     * @param {string} source - Source operation
     * @param {Object} metadata - Additional metadata
     */
    performance(metric, value, unit, source, metadata = {}) {
        const logEntry = {
            metric,
            value,
            unit,
            source,
            metadata,
            timestamp: Date.now()
        };

        this.addToBuffer({ ...logEntry, level: LOG_LEVELS.INFO, source: 'Performance' });

        if (this.developmentMode && this.consoleOutput) {
            console.log(`⚡ ${metric}: ${value}${unit} (${source})`, metadata);
        }

        document.dispatchEvent(new CustomEvent(MESSAGES.PERFORMANCE_LOG, {
            detail: logEntry
        }));
    }

    /**
     * Startup progress logging
     * @param {string} phase - Startup phase
     * @param {string} component - Component being loaded
     * @param {string} status - Status (started, completed, failed)
     * @param {number} duration - Duration in ms
     * @param {Object} metadata - Additional metadata
     */
    startupProgress(phase, component, status, duration = null, metadata = {}) {
        const logEntry = {
            phase,
            component,
            status,
            duration,
            metadata,
            timestamp: Date.now()
        };

        this.addToBuffer({ ...logEntry, level: LOG_LEVELS.INFO, source: 'Startup' });

        if (this.developmentMode && this.consoleOutput) {
            const durationStr = duration ? ` (${duration}ms)` : '';
            console.log(`🚀 [${phase}] ${component} ${status}${durationStr}`, metadata);
        }

        document.dispatchEvent(new CustomEvent(MESSAGES.STARTUP_PROGRESS_LOG, {
            detail: logEntry
        }));
    }

    /**
     * File operation logging
     * @param {string} operation - Operation type
     * @param {string} path - File path
     * @param {string} status - Operation status
     * @param {number} size - File size
     * @param {Object} metadata - Additional metadata
     */
    fileOperation(operation, path, status, size = null, metadata = {}) {
        const logEntry = {
            operation,
            path,
            status,
            size,
            metadata,
            timestamp: Date.now()
        };

        this.addToBuffer({ ...logEntry, level: LOG_LEVELS.INFO, source: 'FileSystem' });

        if (this.developmentMode && this.consoleOutput) {
            const sizeStr = size ? ` (${size} bytes)` : '';
            console.log(`📁 ${operation} ${path} ${status}${sizeStr}`, metadata);
        }

        document.dispatchEvent(new CustomEvent(MESSAGES.FILE_OPERATION_LOG, {
            detail: logEntry
        }));
    }

    /**
     * Start performance timing
     * @param {string} mark - Performance mark name
     */
    startTiming(mark) {
        this.performanceMarks.set(mark, Date.now());
    }

    /**
     * End performance timing and log result
     * @param {string} mark - Performance mark name
     * @param {string} source - Source operation
     * @param {Object} metadata - Additional metadata
     */
    endTiming(mark, source, metadata = {}) {
        const startTime = this.performanceMarks.get(mark);
        if (startTime) {
            const duration = Date.now() - startTime;
            this.performance(mark, duration, 'ms', source, metadata);
            this.performanceMarks.delete(mark);
            return duration;
        }
        return null;
    }

    /**
     * Get log buffer
     * @param {number} limit - Number of recent logs to return
     * @returns {Array} Recent log entries
     */
    getLogBuffer(limit = 100) {
        return this.logBuffer.slice(-limit);
    }

    /**
     * Clear log buffer
     */
    clearBuffer() {
        this.logBuffer = [];
        this.info('LoggingService', 'Log buffer cleared');
    }

    /**
     * Get logging statistics
     * @returns {Object} Logging statistics
     */
    getStats() {
        const stats = {
            totalLogs: this.logBuffer.length,
            byLevel: {},
            bySource: {},
            timeRange: {
                start: this.logBuffer.length > 0 ? this.logBuffer[0].timestamp : null,
                end: this.logBuffer.length > 0 ? this.logBuffer[this.logBuffer.length - 1].timestamp : null
            }
        };

        this.logBuffer.forEach(entry => {
            stats.byLevel[entry.level] = (stats.byLevel[entry.level] || 0) + 1;
            stats.bySource[entry.source] = (stats.bySource[entry.source] || 0) + 1;
        });

        return stats;
    }
}

// Create and export singleton instance
const loggingService = new LoggingService();

// Make it available globally for console access
if (typeof window !== 'undefined') {
    window.loggingService = loggingService;
}

// Export both the class and singleton for different use cases
export { LoggingService, loggingService };
export default loggingService;