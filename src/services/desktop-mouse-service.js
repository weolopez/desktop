// Note: MESSAGES and desktop mouse message types are now dynamically 
// provided by camera-mouse-service.js when it initializes
// Using string literals for now until service initialization completes

/**
 * Desktop Mouse Service
 * 
 * Bridges between camera-mouse component and desktop-level mouse control.
 * Listens for camera gesture events and translates them into desktop mouse actions.
 */
export class DesktopMouseService {
    constructor() {
        this.isEnabled = false;
        this.sourceAppId = null;
        this.desktopElement = null;
        this.lastMousePosition = { x: 0, y: 0 };
        this.dragState = {
            isDragging: false,
            startPosition: null,
            draggedElement: null
        };
        
        // Performance tracking
        this.lastEventTime = 0;
        this.eventThrottle = 16; // ~60fps max
        
        // Camera controller integration
        this.cameraController = null;
        this.cameraControlEnabled = false;
        
        console.log('DesktopMouseService initialized');
    }

    /**
     * Initialize the service with desktop component reference
     * @param {HTMLElement} desktopElement - Main desktop element
     */
    init(desktopElement) {
        this.desktopElement = desktopElement;
        this.setupEventListeners();
        console.log('DesktopMouseService initialized with desktop element');
    }

    /**
     * Set up event listeners for desktop mouse control messages
     */
    setupEventListeners() {
        // Listen for desktop mouse control events (using string literals)
        document.addEventListener('desktop-mouse-move', this.handleMouseMove.bind(this));
        document.addEventListener('desktop-mouse-click', this.handleMouseClick.bind(this));
        document.addEventListener('desktop-mouse-right-click', this.handleMouseRightClick.bind(this));
        document.addEventListener('desktop-mouse-double-click', this.handleMouseDoubleClick.bind(this));
        document.addEventListener('desktop-mouse-scroll', this.handleMouseScroll.bind(this));
        document.addEventListener('desktop-mouse-drag-start', this.handleDragStart.bind(this));
        document.addEventListener('desktop-mouse-drag-end', this.handleDragEnd.bind(this));
        document.addEventListener('desktop-mouse-enabled', this.handleMouseEnabled.bind(this));
        document.addEventListener('desktop-mouse-disabled', this.handleMouseDisabled.bind(this));
        
        // Listen for gesture state changes for visual feedback
        document.addEventListener('gestureDetected', this.handleGestureDetected.bind(this));

        console.log('DesktopMouseService event listeners set up');
    }

    /**
     * Enable desktop mouse control from specified app
     * @param {string} appId - App ID requesting control
     */
    enableControl(appId) {
        this.isEnabled = true;
        this.sourceAppId = appId;
        
        // Add visual indicator
        this.addDesktopCursor();
        
        console.log(`Desktop mouse control enabled for app: ${appId}`);
    }

    /**
     * Disable desktop mouse control
     */
    disableControl() {
        const wasEnabled = this.isEnabled;
        const appId = this.sourceAppId;
        
        this.isEnabled = false;
        this.sourceAppId = null;
        
        // Remove visual indicator
        this.removeDesktopCursor();
        
        // End any ongoing drag
        if (this.dragState.isDragging) {
            this.endDrag();
        }
        
        if (wasEnabled) {
            // Dispatch disabled event
            const disabledEvent = new CustomEvent('desktop-mouse-disabled', {
                detail: { sourceAppId: appId, enabled: false },
                bubbles: true,
                composed: true
            });
            document.dispatchEvent(disabledEvent);
            
            console.log(`Desktop mouse control disabled for app: ${appId}`);
        }
    }

    /**
     * Handle mouse move events
     * @param {CustomEvent} event - Mouse move event
     */
    handleMouseMove(event) {
        if (!this.isEnabled || !this.validateEvent(event, 'desktop-mouse-move')) {
            return;
        }

        // Throttle events for performance
        const now = performance.now();
        if (now - this.lastEventTime < this.eventThrottle) {
            return;
        }
        this.lastEventTime = now;

        const { x, y } = event.detail;
        this.lastMousePosition = { x, y };
        
        // Update visual cursor
        this.updateDesktopCursor(x, y);
        
        // If dragging, update drag position
        if (this.dragState.isDragging) {
            this.updateDrag(x, y);
        }
    }

    /**
     * Handle mouse click events
     * @param {CustomEvent} event - Mouse click event
     */
    handleMouseClick(event) {
        if (!this.isEnabled || !this.validateEvent(event, 'desktop-mouse-click')) {
            return;
        }

        const { x, y } = event.detail;
        this.simulateDesktopClick(x, y, 'left');
    }

    /**
     * Handle mouse right click events
     * @param {CustomEvent} event - Mouse right click event
     */
    handleMouseRightClick(event) {
        if (!this.isEnabled || !this.validateEvent(event, 'desktop-mouse-right-click')) {
            return;
        }

        const { x, y } = event.detail;
        this.simulateDesktopClick(x, y, 'right');
    }

    /**
     * Handle mouse double click events
     * @param {CustomEvent} event - Mouse double click event
     */
    handleMouseDoubleClick(event) {
        if (!this.isEnabled || !this.validateEvent(event, 'desktop-mouse-double-click')) {
            return;
        }

        const { x, y } = event.detail;
        this.simulateDesktopDoubleClick(x, y);
    }

    /**
     * Handle mouse scroll events
     * @param {CustomEvent} event - Mouse scroll event
     */
    handleMouseScroll(event) {
        if (!this.isEnabled || !this.validateEvent(event, 'desktop-mouse-scroll')) {
            return;
        }

        const { x, y, deltaX, deltaY } = event.detail;
        this.simulateDesktopScroll(x, y, deltaX, deltaY);
    }

    /**
     * Handle drag start events
     * @param {CustomEvent} event - Drag start event
     */
    handleDragStart(event) {
        if (!this.isEnabled || !this.validateEvent(event, 'desktop-mouse-drag-start')) {
            return;
        }

        const { x, y } = event.detail;
        this.startDrag(x, y);
    }

    /**
     * Handle drag end events
     * @param {CustomEvent} event - Drag end event
     */
    handleDragEnd(event) {
        if (!this.isEnabled || !this.validateEvent(event, 'desktop-mouse-drag-end')) {
            return;
        }

        const { x, y } = event.detail;
        this.endDrag(x, y);
    }

    /**
     * Handle mouse enabled events
     * @param {CustomEvent} event - Mouse enabled event
     */
    handleMouseEnabled(event) {
        if (!this.validateBasicPayload(event.detail)) {
            return;
        }

        const { sourceAppId } = event.detail;
        this.enableControl(sourceAppId);
    }

    /**
     * Handle mouse disabled events
     * @param {CustomEvent} event - Mouse disabled event
     */
    handleMouseDisabled(event) {
        this.disableControl();
    }

    /**
     * Handle gesture detection events for visual feedback
     * @param {CustomEvent} event - Gesture detection event
     */
    handleGestureDetected(event) {
        if (!this.isEnabled) return;
        
        const gestureData = event.detail;
        this.updateCursorForGesture(gestureData);
    }

    /**
     * Simulate a desktop click at specified coordinates
     * @param {number} x - Screen x coordinate
     * @param {number} y - Screen y coordinate
     * @param {string} button - Mouse button ('left', 'right')
     */
    simulateDesktopClick(x, y, button = 'left') {
        const element = this.getElementAtPosition(x, y);
        if (!element) {
            console.log(`No element found at (${x}, ${y})`);
            return;
        }

        const eventType = button === 'right' ? 'contextmenu' : 'click';
        const mouseButton = button === 'right' ? 2 : 0;

        // Get the element's bounding rect for accurate coordinates
        const rect = element.getBoundingClientRect();
        const elementX = x - rect.left;
        const elementY = y - rect.top;

        console.log(`Desktop ${button} click at (${x}, ${y}) on:`, {
            element: element.tagName,
            classes: element.className,
            id: element.id,
            elementCoords: `(${elementX.toFixed(1)}, ${elementY.toFixed(1)})`,
            rect: `${rect.width.toFixed(1)}x${rect.height.toFixed(1)}`
        });

        // Create and dispatch mouse events in correct sequence
        const mouseDown = new MouseEvent('mousedown', {
            clientX: x,
            clientY: y,
            button: mouseButton,
            bubbles: true,
            cancelable: true,
            detail: 1
        });

        const mouseUp = new MouseEvent('mouseup', {
            clientX: x,
            clientY: y,
            button: mouseButton,
            bubbles: true,
            cancelable: true,
            detail: 1
        });

        const clickEvent = new MouseEvent(eventType, {
            clientX: x,
            clientY: y,
            button: mouseButton,
            bubbles: true,
            cancelable: true,
            detail: 1
        });

        // Dispatch events in correct order
        try {
            element.dispatchEvent(mouseDown);
            
            // Small delay to simulate real mouse behavior
            setTimeout(() => {
                element.dispatchEvent(mouseUp);
                element.dispatchEvent(clickEvent);
                
                // Also try triggering any click handlers directly
                if (element.click && eventType === 'click') {
                    element.click();
                }
            }, 10);
            
        } catch (error) {
            console.error('Error dispatching click events:', error);
        }
    }

    /**
     * Simulate a desktop double click
     * @param {number} x - Screen x coordinate
     * @param {number} y - Screen y coordinate
     */
    simulateDesktopDoubleClick(x, y) {
        const element = this.getElementAtPosition(x, y);
        if (!element) return;

        const dblClickEvent = new MouseEvent('dblclick', {
            clientX: x,
            clientY: y,
            button: 0,
            bubbles: true,
            cancelable: true
        });

        element.dispatchEvent(dblClickEvent);
        console.log(`Desktop double click at (${x}, ${y})`);
    }

    /**
     * Simulate desktop scroll
     * @param {number} x - Screen x coordinate
     * @param {number} y - Screen y coordinate
     * @param {number} deltaX - Horizontal scroll delta
     * @param {number} deltaY - Vertical scroll delta
     */
    simulateDesktopScroll(x, y, deltaX, deltaY) {
        const element = this.getElementAtPosition(x, y);
        if (!element) return;

        const wheelEvent = new WheelEvent('wheel', {
            clientX: x,
            clientY: y,
            deltaX: deltaX,
            deltaY: deltaY,
            deltaMode: WheelEvent.DOM_DELTA_PIXEL,
            bubbles: true,
            cancelable: true
        });

        element.dispatchEvent(wheelEvent);
        console.log(`Desktop scroll at (${x}, ${y}) delta: (${deltaX}, ${deltaY})`);
    }

    /**
     * Start drag operation
     * @param {number} x - Screen x coordinate
     * @param {number} y - Screen y coordinate
     */
    startDrag(x, y) {
        const element = this.getElementAtPosition(x, y);
        if (!element) {
            console.log(`No element found to drag at (${x}, ${y})`);
            return;
        }

        // Check if this is a window header or draggable element
        const draggableElement = this.findDraggableParent(element);
        
        this.dragState = {
            isDragging: true,
            startPosition: { x, y },
            draggedElement: element,
            draggableElement: draggableElement,
            originalPosition: draggableElement ? this.getElementPosition(draggableElement) : null
        };

        console.log(`Drag started at (${x}, ${y}) on:`, {
            element: element.tagName,
            classes: element.className,
            draggableElement: draggableElement?.tagName,
            draggableClasses: draggableElement?.className
        });

        // Dispatch mousedown to start drag
        const mouseDownEvent = new MouseEvent('mousedown', {
            clientX: x,
            clientY: y,
            button: 0,
            bubbles: true,
            cancelable: true
        });

        element.dispatchEvent(mouseDownEvent);
        
        // For window components, also try to trigger their drag handlers
        if (draggableElement && draggableElement.tagName === 'WINDOW-COMPONENT') {
            this.startWindowDrag(draggableElement, x, y);
        }
    }

    /**
     * Update drag position
     * @param {number} x - Screen x coordinate
     * @param {number} y - Screen y coordinate
     */
    updateDrag(x, y) {
        if (!this.dragState.isDragging) return;

        // Calculate drag delta
        const deltaX = x - this.dragState.startPosition.x;
        const deltaY = y - this.dragState.startPosition.y;

        // Update window position if dragging a window
        if (this.dragState.draggableElement && this.dragState.draggableElement.tagName === 'WINDOW-COMPONENT') {
            const window = this.dragState.draggableElement;
            if (this.dragState.originalPosition) {
                const newX = this.dragState.originalPosition.x + deltaX;
                const newY = this.dragState.originalPosition.y + deltaY;
                
                // Update window position
                window.style.left = `${newX}px`;
                window.style.top = `${newY}px`;
                
                // Also update window's internal position if it has setPosition method
                if (window.setPosition) {
                    window.setPosition(newX, newY);
                }
            }
        }

        // Visual feedback for drag operation
        this.updateDragVisual(x, y);
        
        console.log(`Dragging to (${x}, ${y}), delta: (${deltaX.toFixed(1)}, ${deltaY.toFixed(1)})`);
    }

    /**
     * End drag operation
     * @param {number} x - Screen x coordinate
     * @param {number} y - Screen y coordinate
     */
    endDrag(x, y) {
        if (!this.dragState.isDragging) return;

        // End window drag if we were dragging a window
        if (this.dragState.draggableElement && this.dragState.draggableElement.tagName === 'WINDOW-COMPONENT') {
            const windowElement = this.dragState.draggableElement;
            
            // Call window's end drag method if it exists
            if (windowElement.endDrag && typeof windowElement.endDrag === 'function') {
                windowElement.endDrag(x, y);
            }
            
            // Set dragging state to false
            if (windowElement.setDragging && typeof windowElement.setDragging === 'function') {
                windowElement.setDragging(false);
            }
            
            console.log('Window drag ended for:', windowElement.appName || 'unnamed window');
        }

        // Dispatch mouseup event
        if (this.dragState.draggedElement) {
            const mouseUpEvent = new MouseEvent('mouseup', {
                clientX: x,
                clientY: y,
                button: 0,
                bubbles: true,
                cancelable: true
            });

            this.dragState.draggedElement.dispatchEvent(mouseUpEvent);
        }

        // Reset cursor visual
        const cursor = document.getElementById('desktop-mouse-cursor');
        if (cursor) {
            cursor.style.background = 'radial-gradient(circle, #ff4444 30%, rgba(255, 68, 68, 0.3) 70%)';
            cursor.style.boxShadow = '0 0 10px rgba(255, 68, 68, 0.5)';
            cursor.style.transform = 'translate(-50%, -50%) scale(1)';
        }

        this.dragState = {
            isDragging: false,
            startPosition: null,
            draggedElement: null,
            draggableElement: null,
            originalPosition: null
        };

        console.log(`Drag ended at (${x}, ${y})`);
    }

    /**
     * Get DOM element at specified position
     * @param {number} x - Screen x coordinate
     * @param {number} y - Screen y coordinate
     * @returns {Element|null} Element at position
     */
    getElementAtPosition(x, y) {
        // Temporarily hide desktop cursor to get element underneath
        const cursor = document.getElementById('desktop-mouse-cursor');
        const originalDisplay = cursor?.style.display;
        const originalPointerEvents = cursor?.style.pointerEvents;
        
        if (cursor) {
            cursor.style.display = 'none';
            cursor.style.pointerEvents = 'none';
        }

        // Get element at position
        const element = document.elementFromPoint(x, y);

        // Restore cursor
        if (cursor) {
            if (originalDisplay !== undefined) {
                cursor.style.display = originalDisplay;
            } else {
                cursor.style.display = '';
            }
            if (originalPointerEvents !== undefined) {
                cursor.style.pointerEvents = originalPointerEvents;
            } else {
                cursor.style.pointerEvents = 'none';
            }
        }

        return element;
    }

    /**
     * Add visual desktop cursor
     */
    addDesktopCursor() {
        let cursor = document.getElementById('desktop-mouse-cursor');
        if (cursor) return; // Already exists

        cursor = document.createElement('div');
        cursor.id = 'desktop-mouse-cursor';
        cursor.style.cssText = `
            position: fixed;
            width: 20px;
            height: 20px;
            background: radial-gradient(circle, #ff4444 30%, rgba(255, 68, 68, 0.3) 70%);
            border: 2px solid rgba(255, 255, 255, 0.8);
            border-radius: 50%;
            pointer-events: none;
            z-index: 10000;
            transform: translate(-50%, -50%);
            transition: opacity 0.3s ease;
            box-shadow: 0 0 10px rgba(255, 68, 68, 0.5);
        `;

        document.body.appendChild(cursor);
    }

    /**
     * Remove visual desktop cursor
     */
    removeDesktopCursor() {
        const cursor = document.getElementById('desktop-mouse-cursor');
        if (cursor) {
            cursor.remove();
        }
    }

    /**
     * Update desktop cursor position
     * @param {number} x - Screen x coordinate
     * @param {number} y - Screen y coordinate
     */
    updateDesktopCursor(x, y) {
        const cursor = document.getElementById('desktop-mouse-cursor');
        if (cursor) {
            cursor.style.left = x + 'px';
            cursor.style.top = y + 'px';
        }
    }

    /**
     * Update cursor appearance based on current gesture
     * @param {Object} gestureData - Gesture data from camera mouse service
     */
    updateCursorForGesture(gestureData) {
        const cursor = document.getElementById('desktop-mouse-cursor');
        if (!cursor) return;

        // Reset to default appearance
        cursor.style.background = 'radial-gradient(circle, #ff4444 30%, rgba(255, 68, 68, 0.3) 70%)';
        cursor.style.boxShadow = '0 0 10px rgba(255, 68, 68, 0.5)';
        cursor.style.transform = 'translate(-50%, -50%) scale(1)';
        cursor.style.borderRadius = '50%';

        // Apply gesture-specific styling
        if (gestureData.state.isClicking) {
            // Left click - green pulse
            cursor.style.background = 'radial-gradient(circle, #28a745 30%, rgba(40, 167, 69, 0.4) 70%)';
            cursor.style.boxShadow = '0 0 15px rgba(40, 167, 69, 0.8)';
            cursor.style.transform = 'translate(-50%, -50%) scale(1.2)';
        } else if (gestureData.state.isRightClicking) {
            // Right click - orange/yellow
            cursor.style.background = 'radial-gradient(circle, #ffc107 30%, rgba(255, 193, 7, 0.4) 70%)';
            cursor.style.boxShadow = '0 0 15px rgba(255, 193, 7, 0.8)';
            cursor.style.borderRadius = '20%';
        } else if (gestureData.state.isScrolling) {
            // Scroll - blue rotating
            cursor.style.background = 'radial-gradient(circle, #17a2b8 30%, rgba(23, 162, 184, 0.4) 70%)';
            cursor.style.boxShadow = '0 0 15px rgba(23, 162, 184, 0.8)';
            cursor.style.borderRadius = '30%';
        } else if (gestureData.state.isDragging) {
            // Drag - purple trail effect
            cursor.style.background = 'radial-gradient(circle, #6f42c1 30%, rgba(111, 66, 193, 0.4) 70%)';
            cursor.style.boxShadow = '0 0 20px rgba(111, 66, 193, 0.9)';
            cursor.style.transform = 'translate(-50%, -50%) scale(1.3)';
        } else if (gestureData.gesture === 'point') {
            // Pointing - smaller, precise cursor
            cursor.style.background = 'radial-gradient(circle, #007bff 30%, rgba(0, 123, 255, 0.3) 70%)';
            cursor.style.boxShadow = '0 0 8px rgba(0, 123, 255, 0.6)';
            cursor.style.transform = 'translate(-50%, -50%) scale(0.8)';
        }
    }

    /**
     * Update drag visual feedback
     * @param {number} x - Screen x coordinate
     * @param {number} y - Screen y coordinate
     */
    updateDragVisual(x, y) {
        const cursor = document.getElementById('desktop-mouse-cursor');
        if (cursor) {
            cursor.style.background = 'radial-gradient(circle, #44ff44 30%, rgba(68, 255, 68, 0.3) 70%)';
            cursor.style.boxShadow = '0 0 15px rgba(68, 255, 68, 0.7)';
        }
    }

    /**
     * Validate event payload
     * @param {CustomEvent} event - Event to validate
     * @param {string} messageType - Expected message type
     * @returns {boolean} Whether event is valid
     */
    validateEvent(event, messageType) {
        if (!event.detail || !this.validateBasicPayload(event.detail)) {
            console.warn(`Invalid ${messageType} event:`, event.detail);
            return false;
        }
        
        // Verify source app matches current controller
        if (event.detail.sourceAppId !== this.sourceAppId) {
            console.warn(`Desktop mouse event from unauthorized app: ${event.detail.sourceAppId}`);
            return false;
        }
        
        return true;
    }
    
    /**
     * Basic payload validation for desktop mouse events
     * @param {Object} payload - Payload to validate
     * @returns {boolean} Whether payload has basic required fields
     */
    validateBasicPayload(payload) {
        return payload && 
               typeof payload === 'object' && 
               typeof payload.sourceAppId === 'string';
    }

    /**
     * Find draggable parent element (like window-component)
     * @param {Element} element - Starting element
     * @returns {Element|null} Draggable parent or null
     */
    findDraggableParent(element) {
        let current = element;
        while (current && current !== document.body) {
            // Check for window component
            if (current.tagName === 'WINDOW-COMPONENT') {
                return current;
            }
            // Check for elements with draggable attributes or classes
            if (current.hasAttribute('draggable') || 
                current.classList?.contains('draggable') ||
                current.classList?.contains('window-header') ||
                current.classList?.contains('title-bar')) {
                return current.closest('window-component') || current;
            }
            current = current.parentElement;
        }
        return null;
    }

    /**
     * Get element position
     * @param {Element} element - Element to get position for
     * @returns {Object} Position {x, y}
     */
    getElementPosition(element) {
        const rect = element.getBoundingClientRect();
        return {
            x: rect.left,
            y: rect.top
        };
    }

    /**
     * Start window drag operation
     * @param {Element} windowElement - Window element to drag
     * @param {number} x - Start x coordinate
     * @param {number} y - Start y coordinate
     */
    startWindowDrag(windowElement, x, y) {
        // Try to call the window's startDrag method if it exists
        if (windowElement.startDrag && typeof windowElement.startDrag === 'function') {
            windowElement.startDrag(x, y);
        }
        
        // Set dragging state on window
        if (windowElement.setDragging && typeof windowElement.setDragging === 'function') {
            windowElement.setDragging(true);
        }
        
        console.log('Window drag initiated for:', windowElement.appName || 'unnamed window');
    }

    /**
     * Get current control status
     * @returns {Object} Control status information
     */
    getStatus() {
        return {
            isEnabled: this.isEnabled,
            sourceAppId: this.sourceAppId,
            lastMousePosition: { ...this.lastMousePosition },
            isDragging: this.dragState.isDragging
        };
    }

    /**
     * Register camera controller for desktop mouse control
     * @param {Object} cameraService - Camera mouse service instance
     */
    async registerCameraController(cameraService) {
        if (!cameraService) {
            console.warn('Cannot register null camera controller');
            return;
        }
        
        this.cameraController = cameraService;
        this.cameraControlEnabled = true;
        
        // Enable desktop mouse control from camera
        this.enableControl('camera-mouse');
        
        console.log('Camera controller registered and enabled for desktop mouse control');
        
        // Listen for camera service events to provide additional feedback
        if (cameraService.addEventListener) {
            cameraService.addEventListener('gestureDetected', (event) => {
                this.handleGestureDetected(event);
            });
        }
    }
    
    /**
     * Unregister camera controller
     */
    unregisterCameraController() {
        if (this.cameraController) {
            console.log('Unregistering camera controller');
            this.cameraController = null;
            this.cameraControlEnabled = false;
            this.disableControl();
        }
    }
    
    /**
     * Check if camera control is enabled
     * @returns {boolean} Whether camera control is active
     */
    isCameraControlEnabled() {
        return this.cameraControlEnabled && this.cameraController !== null;
    }
    
    /**
     * Get camera controller instance
     * @returns {Object|null} Camera controller or null
     */
    getCameraController() {
        return this.cameraController;
    }

    /**
     * Cleanup service
     */
    cleanup() {
        this.unregisterCameraController();
        this.disableControl();
        console.log('DesktopMouseService cleaned up');
    }
}