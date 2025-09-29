import eventBus from "../events/event-bus.js";
import { MESSAGES } from "../events/message-types.js";
class WindowComponent extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        
        // Window properties
        this.windowId = 'window-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        this.appName = this.getAttribute('app-name') || 'Untitled';
        this.appIcon = this.getAttribute('app-icon') || '📄';
        this.sourceUrl = this.getAttribute('source-url') || '';
        this.isFocused = true;
        this.appTag = this.getAttribute('app-tag') || ''

        // State flags
        this.isMinimized = this.hasAttribute('minimized');
        this.isMaximized = this.hasAttribute('maximized');

        // Position and size
        const initialX = this.getAttribute('x');
        const initialY = this.getAttribute('y');
        const initialWidth = this.getAttribute('width');
        const initialHeight = this.getAttribute('height');

        console.log('🪟 WindowComponent constructor - Reading attributes:', {
            x: initialX, y: initialY, width: initialWidth, height: initialHeight,
            minimized: this.hasAttribute('minimized'),
            maximized: this.hasAttribute('maximized')
        });

        this.x = initialX !== null ? parseInt(initialX) : 100;
        this.y = initialY !== null ? parseInt(initialY) : 100;
        this.width = initialWidth !== null ? parseInt(initialWidth) : 600;
        this.height = initialHeight !== null ? parseInt(initialHeight) : 400;

        console.log('🪟 WindowComponent constructor - Final values:', {
            x: this.x, y: this.y, width: this.width, height: this.height,
            isMinimized: this.isMinimized, isMaximized: this.isMaximized
        });

        if (this.isMaximized) {
            this.savedX = parseInt(this.getAttribute('saved-x'));
            this.savedY = parseInt(this.getAttribute('saved-y'));
            this.savedWidth = parseInt(this.getAttribute('saved-width'));
            this.savedHeight = parseInt(this.getAttribute('saved-height'));
        }
        this.minWidth = 100;
        this.minHeight = 100;
        
        // Dragging state
        this.isDragging = false;
        this.isResizing = false;
        this.dragStartX = 0;
        this.dragStartY = 0;
        this.resizeHandle = null;
    }

    connectedCallback() {
        console.log('🪟 WindowComponent connectedCallback - Starting with state:', {
            x: this.x, y: this.y, width: this.width, height: this.height,
            isMinimized: this.isMinimized, isMaximized: this.isMaximized
        });
        
        this.render();
        this.setupEventListeners();
        this.updatePosition();

        if (this.isMinimized) {
            console.log('🪟 WindowComponent - Applying minimized state');
            this.style.display = 'none';
            eventBus.publish(MESSAGES.WINDOW_MINIMIZE, {
                windowId: this.windowId,
                appName: this.appName,
                appIcon: this.appIcon,
                appTag: this.appTag
            });
        }
        
        console.log('🪟 WindowComponent connectedCallback - Final DOM state:', {
            styleLeft: this.style.left,
            styleTop: this.style.top,
            styleDisplay: this.style.display
        });
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    position: absolute;
                    top: 0;
                    left: 0;
                    z-index: 100;
                    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
                }

                .window {
                    position: absolute;
                    background: rgba(255, 255, 255, 0.95);
                    backdrop-filter: blur(20px);
                    border-radius: 12px;
                    box-shadow: 0 16px 48px rgba(0, 0, 0, 0.2), 
                                0 0 0 1px rgba(255, 255, 255, 0.1);
                    overflow: hidden;
                    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                    min-width: 100px;
                    min-height: 100px;
                }

                .window.focused {
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3), 
                                0 0 0 1px rgba(255, 255, 255, 0.2);
                }

                .window.unfocused {
                    opacity: 0.9;
                    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
                }

                .window.minimizing {
                    transform: scale(0.1);
                    opacity: 0;
                }

                .title-bar {
                    height: 36px;
                    background: rgba(246, 246, 246, 0.8);
                    backdrop-filter: blur(20px);
                    border-bottom: 1px solid rgba(0, 0, 0, 0.1);
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 0 16px;
                    cursor: move;
                    user-select: none;
                }

                .traffic-lights {
                    display: flex;
                    gap: 8px;
                    align-items: center;
                }

                .traffic-light {
                    width: 12px;
                    height: 12px;
                    border-radius: 50%;
                    cursor: pointer;
                    transition: all 0.1s ease;
                    border: 0.5px solid rgba(0, 0, 0, 0.1);
                    position: relative;
                }

                .traffic-light.close {
                    background: #ff5f57;
                }

                .traffic-light.minimize {
                    background: #ffbd2e;
                }

                .traffic-light.maximize {
                    background: #28ca42;
                }

                .traffic-light:hover {
                    filter: brightness(1.1);
                    transform: scale(1.1);
                }

                .traffic-light.close:hover::after {
                    content: '×';
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    font-size: 8px;
                    color: rgba(0, 0, 0, 0.6);
                    font-weight: bold;
                }

                .traffic-light.minimize:hover::after {
                    content: '−';
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    font-size: 8px;
                    color: rgba(0, 0, 0, 0.6);
                    font-weight: bold;
                }

                .traffic-light.maximize:hover::after {
                    content: '+';
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    font-size: 8px;
                    color: rgba(0, 0, 0, 0.6);
                    font-weight: bold;
                }

                .window-title {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    position: absolute;
                    left: 50%;
                    transform: translateX(-50%);
                    font-size: 13px;
                    font-weight: 500;
                    color: #1d1d1f;
                }

                .window-icon {
                    font-size: 16px;
                }

                .window-content {
                    height: calc(100% - 36px);
                    overflow: auto;
                    background: white;
                }

                .resize-handle {
                    position: absolute;
                    z-index: 10;
                }

                .resize-handle.top {
                    top: 0;
                    left: 8px;
                    right: 8px;
                    height: 4px;
                    cursor: n-resize;
                }

                .resize-handle.bottom {
                    bottom: 0;
                    left: 8px;
                    right: 8px;
                    height: 4px;
                    cursor: s-resize;
                }

                .resize-handle.left {
                    left: 0;
                    top: 8px;
                    bottom: 8px;
                    width: 4px;
                    cursor: w-resize;
                }

                .resize-handle.right {
                    right: 0;
                    top: 8px;
                    bottom: 8px;
                    width: 4px;
                    cursor: e-resize;
                }

                .resize-handle.top-left {
                    top: 0;
                    left: 0;
                    width: 8px;
                    height: 8px;
                    cursor: nw-resize;
                }

                .resize-handle.top-right {
                    top: 0;
                    right: 0;
                    width: 8px;
                    height: 8px;
                    cursor: ne-resize;
                }

                .resize-handle.bottom-left {
                    bottom: 0;
                    left: 0;
                    width: 8px;
                    height: 8px;
                    cursor: sw-resize;
                }

                .resize-handle.bottom-right {
                    bottom: 0;
                    right: 0;
                    width: 8px;
                    height: 8px;
                    cursor: se-resize;
                }
            </style>

            <div class="window ${this.isFocused ? 'focused' : 'unfocused'}" 
                 style="width: ${this.width}px; height: ${this.height}px;">
                
                <div class="title-bar">
                    <div class="traffic-lights">
                        <div class="traffic-light close" data-action="close"></div>
                        <div class="traffic-light minimize" data-action="minimize"></div>
                        <div class="traffic-light maximize" data-action="maximize"></div>
                    </div>
                    
                    <div class="window-title">
                        <span class="window-icon">${this.appIcon}</span>
                        <span>${this.appName}</span>
                    </div>
                </div>
                
                <div class="window-content">
                    <slot></slot>
                </div>
                
                <!-- Resize handles -->
                <div class="resize-handle top" data-resize="top"></div>
                <div class="resize-handle bottom" data-resize="bottom"></div>
                <div class="resize-handle left" data-resize="left"></div>
                <div class="resize-handle right" data-resize="right"></div>
                <div class="resize-handle top-left" data-resize="top-left"></div>
                <div class="resize-handle top-right" data-resize="top-right"></div>
                <div class="resize-handle bottom-left" data-resize="bottom-left"></div>
                <div class="resize-handle bottom-right" data-resize="bottom-right"></div>
            </div>
        `;
    }

    setupEventListeners() {
        const titleBar = this.shadowRoot.querySelector('.title-bar');
        const window = this.shadowRoot.querySelector('.window');

        // Traffic light actions
        this.shadowRoot.addEventListener('click', (e) => {
            const action = e.target.getAttribute('data-action');
            if (action) {
                e.stopPropagation();
                this.handleTrafficLightAction(action);
            }
        });

        // Window dragging
        titleBar.addEventListener('mousedown', (e) => {
            if (e.target.hasAttribute('data-action')) return;
            
            this.isDragging = true;
            this.dragStartX = e.clientX - this.x;
            this.dragStartY = e.clientY - this.y;
            this.focus();
            
            document.addEventListener('mousemove', this.handleMouseMove);
            document.addEventListener('mouseup', this.handleMouseUp);
        });

        // Window resizing
        this.shadowRoot.addEventListener('mousedown', (e) => {
            const resizeHandle = e.target.getAttribute('data-resize');
            if (resizeHandle) {
                this.isResizing = true;
                this.resizeHandle = resizeHandle;
                this.dragStartX = e.clientX;
                this.dragStartY = e.clientY;
                this.startWidth = this.width;
                this.startHeight = this.height;
                this.startX = this.x;
                this.startY = this.y;
                
                document.addEventListener('mousemove', this.handleMouseMove);
                document.addEventListener('mouseup', this.handleMouseUp);
                e.preventDefault();
            }
        });

        // Window focus on click
        this.addEventListener('mousedown', (e) => {
            this.logEventFlow("WINDOW", e);
            this.focus();
        });

        // Prevent context menu on title bar and window chrome only
        titleBar.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            e.stopPropagation();
        });

        // Prevent desktop context menu from showing when right-clicking on window content
        // but allow the browser's native context menu for the content area
        this.shadowRoot.addEventListener('contextmenu', (e) => {
            // Only stop propagation if not clicking on the content area
            if (!e.target.closest('.window-content')) {
                e.stopPropagation();
            }
        });
    }

    handleMouseMove = (e) => {
        if (this.isDragging) {
            this.x = e.clientX - this.dragStartX;
            this.y = e.clientY - this.dragStartY;
            
            // Keep window within bounds
            this.x = Math.max(0, Math.min(this.x, window.innerWidth - this.width));
            this.y = Math.max(0, Math.min(this.y, window.innerHeight)); // Account for menu bar and dock
            
            this.updatePosition();
        } else if (this.isResizing) {
            this.handleResize(e);
        }
    }

    handleMouseUp = () => {
        this.isDragging = false;
        this.isResizing = false;
        this.resizeHandle = null;
        
        document.removeEventListener('mousemove', this.handleMouseMove);
        document.removeEventListener('mouseup', this.handleMouseUp);
    }

    handleResize(e) {
        const deltaX = e.clientX - this.dragStartX;
        const deltaY = e.clientY - this.dragStartY;
        
        switch (this.resizeHandle) {
            case 'right':
                this.width = Math.max(this.minWidth, this.startWidth + deltaX);
                break;
            case 'bottom':
                this.height = Math.max(this.minHeight, this.startHeight + deltaY);
                break;
            case 'left':
                const newWidth = Math.max(this.minWidth, this.startWidth - deltaX);
                if (newWidth > this.minWidth) {
                    this.x = this.startX + deltaX;
                    this.width = newWidth;
                }
                break;
            case 'top':
                const newHeight = Math.max(this.minHeight, this.startHeight - deltaY);
                if (newHeight > this.minHeight) {
                    this.y = this.startY + deltaY;
                    this.height = newHeight;
                }
                break;
            case 'bottom-right':
                this.width = Math.max(this.minWidth, this.startWidth + deltaX);
                this.height = Math.max(this.minHeight, this.startHeight + deltaY);
                break;
            case 'bottom-left':
                const newWidthBL = Math.max(this.minWidth, this.startWidth - deltaX);
                if (newWidthBL > this.minWidth) {
                    this.x = this.startX + deltaX;
                    this.width = newWidthBL;
                }
                this.height = Math.max(this.minHeight, this.startHeight + deltaY);
                break;
            case 'top-right':
                this.width = Math.max(this.minWidth, this.startWidth + deltaX);
                const newHeightTR = Math.max(this.minHeight, this.startHeight - deltaY);
                if (newHeightTR > this.minHeight) {
                    this.y = this.startY + deltaY;
                    this.height = newHeightTR;
                }
                break;
            case 'top-left':
                const newWidthTL = Math.max(this.minWidth, this.startWidth - deltaX);
                const newHeightTL = Math.max(this.minHeight, this.startHeight - deltaY);
                if (newWidthTL > this.minWidth) {
                    this.x = this.startX + deltaX;
                    this.width = newWidthTL;
                }
                if (newHeightTL > this.minHeight) {
                    this.y = this.startY + deltaY;
                    this.height = newHeightTL;
                }
                break;
        }
        
        this.updatePosition();
        this.updateSize();
    }

    handleTrafficLightAction(action) {
        switch (action) {
            case 'close':
                this.close();
                break;
            case 'minimize':
                this.minimize();
                break;
            case 'maximize':
                this.maximize();
                break;
        }
    }

    close() {
        eventBus.publish(MESSAGES.WINDOW_CLOSED, {
            windowId: this.windowId,
            appName: this.appName
        });
        this.remove();
    }

    minimize() {
        const window = this.shadowRoot.querySelector('.window');
        window.classList.add('minimizing');
        
        eventBus.publish(MESSAGES.WINDOW_MINIMIZE, {
            windowId: this.windowId,
            appName: this.appName,
            appIcon: this.appIcon,
            appTag: this.appTag
        });
        
        setTimeout(() => {
            this.style.display = 'none';
            this.isMinimized = true;
        }, 200);
    }

    maximize() {
        if (this.isMaximized) {
            // Restore
            this.x = this.savedX || 100;
            this.y = this.savedY || 100;
            this.width = this.savedWidth || 600;
            this.height = this.savedHeight || 400;
            this.isMaximized = false;
        } else {
            // Maximize
            this.savedX = this.x;
            this.savedY = this.y;
            this.savedWidth = this.width;
            this.savedHeight = this.height;
            
            this.x = 0;
            this.y = 0; // Account for menu bar
            this.width = window.innerWidth;
            this.height = window.innerHeight - 80; // Account for menu bar and dock
            this.isMaximized = true;
        }
        
        this.updatePosition();
        this.updateSize();
    }

    restore() {
        const window = this.shadowRoot.querySelector('.window');
        this.style.display = 'block';
        window.classList.remove('minimizing');
        this.isMinimized = false;
        this.focus();
    }

    focus() {
        console.log('🪟 Window focus() - Root node host:', this.getRootNode().host);
        console.log('🪟 Window focus() - Host windowManager:', this.getRootNode().host?.windowManager);
        console.log('🪟 Window focus() - getNextZIndex available:', !!this.getRootNode().host?.windowManager?.getNextZIndex);
        
        this.isFocused = true;
        const host = this.getRootNode().host;
        if (host && host.windowManager && host.windowManager.getNextZIndex) {
            this.style.zIndex = host.windowManager.getNextZIndex();
        } else {
            console.warn('🪟 Window focus() - WindowManager not available, using fallback z-index');
            this.style.zIndex = '1000'; // Fallback
        }
        
        // Update visual state
        const window = this.shadowRoot.querySelector('.window');
        window.classList.remove('unfocused');
        window.classList.add('focused');
        
        // Notify other windows to unfocus
        eventBus.publish(MESSAGES.WINDOW_FOCUS, {
            windowId: this.windowId,
            appName: this.appName
        });
    }

    unfocus() {
        this.isFocused = false;
        const window = this.shadowRoot.querySelector('.window');
        window.classList.remove('focused');
        window.classList.add('unfocused');
    }

    updatePosition() {
        this.style.left = `${this.x}px`;
        this.style.top = `${this.y}px`;
    }

    updateSize() {
        const window = this.shadowRoot.querySelector('.window');
        window.style.width = `${this.width}px`;
        window.style.height = `${this.height}px`;
    }


    logEventFlow(level, event) {
        const timestamp = Date.now();
        const targetInfo = {
            tagName: event.target.tagName?.toLowerCase() || 'unknown',
            className: event.target.className || '',
            id: event.target.id || '',
            textContent: event.target.textContent?.slice(0, 30) || ''
        };
        
        console.log(`🖱️ [${level}] Event received at ${timestamp}:`, {
            type: event.type,
            target: targetInfo,
            bubbles: event.bubbles,
            composed: event.composed,
            eventPhase: event.eventPhase,
            currentTarget: event.currentTarget.constructor.name,
            windowId: this.windowId,
            appName: this.appName
        });
        
        // Store event flow data for global access
        if (!window.eventFlowTest) {
            window.eventFlowTest = { events: [] };
        }
        window.eventFlowTest.events.push({
            level,
            timestamp,
            type: event.type,
            target: targetInfo,
            eventPhase: event.eventPhase,
            windowId: this.windowId,
            appName: this.appName
        });
    }

    // Getters for window state
    get windowState() {
        const appContent = this.children[0];
        const appState = appContent && typeof appContent.getAppState === 'function'
            ? appContent.getAppState()
            : {};

        return {
            id: this.windowId,
            appName: this.appName,
            appIcon: this.appIcon,
            appTag: this.appTag,
            sourceUrl: this.sourceUrl,
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height,
            isMinimized: this.isMinimized,
            isMaximized: this.isMaximized,
            isFocused: this.isFocused,
            savedX: this.savedX,
            savedY: this.savedY,
            savedWidth: this.savedWidth,
            savedHeight: this.savedHeight,
            appState: appState
        };
    }
}

customElements.define('window-component', WindowComponent);