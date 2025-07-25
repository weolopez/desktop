import { StartupManager } from "../services/startup-manager.js";
import { MESSAGES } from "../events/message-types.js";
import eventBus from "../events/event-bus.js";
import "../events/event-monitor.js";

// import { PreviewService } from '../services/preview-service.js';

class DesktopComponent extends HTMLElement {
  static get observedAttributes() {
    return ['wallpaper', 'dock-position', 'grid-snap', 'show-desktop-icons', 'accent-color', 'notification-sounds'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });

    // Initialize startup manager for configurable component loading
    this.startupManager = new StartupManager();
    
    // Legacy service references will be populated after startup
    this.appService = null;
    this.wallpaperManager = null;
    this.contextMenuManager = null;
    this.windowManager = null;

    // Initialize attributes from localStorage if not set
    this._initializeAttributes();
  }

  _initializeAttributes() {
    if (!this.hasAttribute('wallpaper')) {
      const savedWallpaper = localStorage.getItem('desktop-wallpaper') || 'gradient';
      this.setAttribute('wallpaper', savedWallpaper);
    }
    if (!this.hasAttribute('dock-position')) {
      const savedDockPosition = localStorage.getItem('dock-position') || 'bottom';
      this.setAttribute('dock-position', savedDockPosition);
    }
    if (!this.hasAttribute('grid-snap')) {
      const savedGridSnap = localStorage.getItem('grid-snap') || 'true';
      this.setAttribute('grid-snap', savedGridSnap);
    }
    if (!this.hasAttribute('show-desktop-icons')) {
      const savedShowIcons = localStorage.getItem('show-desktop-icons') || 'true';
      this.setAttribute('show-desktop-icons', savedShowIcons);
    }
    if (!this.hasAttribute('accent-color')) {
      const savedAccentColor = localStorage.getItem('accent-color') || '#007AFF';
      this.setAttribute('accent-color', savedAccentColor);
    }
    if (!this.hasAttribute('notification-sounds')) {
      const savedNotificationSounds = localStorage.getItem('notification-sounds') || 'true';
      this.setAttribute('notification-sounds', savedNotificationSounds);
    }
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;
    
    switch (name) {
      case 'wallpaper':
        this._updateWallpaper(newValue);
        localStorage.setItem('desktop-wallpaper', newValue);
        break;
      case 'dock-position':
        this._updateDockPosition(newValue);
        localStorage.setItem('dock-position', newValue);
        break;
      case 'grid-snap':
        this._updateGridSnap(newValue === 'true');
        localStorage.setItem('grid-snap', newValue);
        break;
      case 'show-desktop-icons':
        this._updateDesktopIcons(newValue === 'true');
        localStorage.setItem('show-desktop-icons', newValue);
        break;
      case 'accent-color':
        this._updateAccentColor(newValue);
        localStorage.setItem('accent-color', newValue);
        break;
      case 'notification-sounds':
        this._updateNotificationSounds(newValue === 'true');
        localStorage.setItem('notification-sounds', newValue);
        break;
    }
  }

  async connectedCallback() {
    this.render();
    
    // Initialize and run startup sequence
    await this.startupManager.init();
    await this.startupManager.startupSequence(this);
    
    // Populate legacy service references for backwards compatibility
    this._populateLegacyReferences();
    
    // Initialize services that were successfully loaded
    this._initializeLoadedServices();
    
    // Log startup metrics for debugging
    this._logStartupMetrics();
    
    this.setupPasteDrop();
    // Notification display setup is now handled by StartupManager
    // this.setupAppEventListeners();
    // this.showTestNotification();
  }

  _populateLegacyReferences() {
    this.appService = this.startupManager.getComponent('AppService');
    this.wallpaperManager = this.startupManager.getComponent('WallpaperManager');
    this.contextMenuManager = this.startupManager.getComponent('ContextMenuManager');
    this.windowManager = this.startupManager.getComponent('WindowManager');
  }

  _initializeLoadedServices() {
    // AppService.init() is now called during instantiation in StartupManager
    
    if (this.contextMenuManager) {
      this.contextMenuManager.init();
    }
    
    if (this.windowManager) {
      this.windowManager.setupEventListeners();
      this.windowManager.restoreWindowsState();
    }
    
  }

  _logStartupMetrics() {
    const metrics = this.startupManager.getStartupMetrics();
    console.log('🎯 Desktop Startup Metrics:', {
      totalTime: `${metrics.totalTime.toFixed(2)}ms`,
      componentsLoaded: metrics.componentsLoaded,
      phasesCompleted: metrics.phasesCompleted,
      servicesStatus: {
        appService: !!this.appService,
        wallpaperManager: !!this.wallpaperManager,
        contextMenuManager: !!this.contextMenuManager,
        windowManager: !!this.windowManager,
      }
    });
  }

  showTestNotification() {
    setTimeout(() => {
        eventBus.publish(MESSAGES.CREATE_NOTIFICATION, {
            sourceAppId: "system",
            title: "Welcome to your Desktop!",
            body: "The notification system is now active.",
            icon: "🎉",
        });
    }, 2000);
  }

  setupAppEventListeners() {
    eventBus.subscribe(MESSAGES.APP_LAUNCHED, () => {
      console.log("App launched event received");
    });

    eventBus.subscribe(MESSAGES.WINDOW_CLOSED, () => {
      setTimeout(() => {
        console.log("Window closed event received");
      }, 100);
    });

    eventBus.subscribe(MESSAGES.LAUNCH_FINDER_WEBAPP, (e) => {
        eventBus.publish(MESSAGES.PUBLISH_TEXT, { texts: [e.detail.url] });
    });
  }

  render() {
    this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    width: 100vw;
                    height: 100vh;
                    overflow: hidden;
                    position: relative;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    
                    /* CSS Custom Properties for reactive theming */
                    --desktop-wallpaper: var(--wallpaper-gradient);
                    --dock-position: bottom;
                    --accent-color: #007AFF;
                    --grid-snap-size: 20px;
                    --desktop-icons-visible: block;
                }

                .desktop-background {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    z-index: -1;
                    background: var(--desktop-wallpaper);
                }

                :host([wallpaper="gradient"]) {
                    --desktop-wallpaper: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                }

                :host([wallpaper="monterey"]) {
                    --desktop-wallpaper: linear-gradient(135deg, #1e3c72 0%, #2a5298 50%, #764ba2 100%);
                }

                :host([wallpaper="big-sur"]) {
                    --desktop-wallpaper: linear-gradient(180deg, #ff9a9e 0%, #fecfef 50%, #fecfef 100%);
                }

                :host([dock-position="bottom"]) .dock-container {
                    bottom: 8px;
                    left: 50%;
                    top: unset;
                    right: unset;
                    transform: translateX(-50%);
                    flex-direction: row;
                }

                :host([dock-position="left"]) .dock-container {
                    left: 8px;
                    top: 50%;
                    bottom: unset;
                    right: unset;
                    transform: translateY(-50%);
                    flex-direction: column;
                }

                :host([dock-position="right"]) .dock-container {
                    right: 8px;
                    top: 50%;
                    bottom: unset;
                    left: unset;
                    transform: translateY(-50%);
                    flex-direction: column;
                }

                .desktop-surface {
                    width: 100%;
                    height: 100%;
                    position: relative;
                    display: flex;
                    flex-direction: column;
                }

                .menu-bar-container {
                    height: 24px;
                    width: 100%;
                    z-index: 1000;
                }

                .desktop-content {
                    flex: 1;
                    position: relative;
                }

                .dock-container {
                    position: absolute;
                    z-index: 999;
                }

                :host([show-desktop-icons="false"]) .desktop-icons {
                    display: none;
                }

                :host([grid-snap="true"]) .desktop-content {
                    background-image: 
                        linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px),
                        linear-gradient(to bottom, rgba(255,255,255,0.1) 1px, transparent 1px);
                    background-size: var(--grid-snap-size) var(--grid-snap-size);
                }
            </style>
            
            <div class="desktop-background"></div>
            
            <div class="desktop-surface">
                <!--<div class="menu-bar-container">
                    <menu-bar-component></menu-bar-component>
                </div>-->

                <div class="desktop-content">
                    <slot></slot>
                </div>
                
                <div class="dock-container" id="dock-container">
                    <!-- dock-component will be inserted here by StartupManager -->
                </div>
            </div>
            <!-- notification-display-component is now loaded dynamically by StartupManager -->
        `;
    // Apply current attribute values to CSS custom properties
    this._updateAccentColor(this.getAttribute('accent-color') || '#007AFF');
  }


  setupPasteDrop() {
    const desktopSurface = document.querySelector("body");

    desktopSurface.addEventListener("dragover", (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
    });

    desktopSurface.addEventListener("drop", (e) => {
      e.preventDefault();
      this.handleFileDrop(e);
    });

    // Handle paste events
    desktopSurface.addEventListener("paste", (e) => {
      if ('DESKTOP-COMPONENT' === e.target.tagName) {
        this.handlePaste(e);
      }
    });

    // Add click event logging for testing event flow hierarchy
    desktopSurface.addEventListener("click", (e) => {
      this.logEventFlow("DESKTOP", e);
      // Don't stop propagation - let events flow to windows and apps
    });
  }

  handleFileDrop(e) {
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0 && this.appService) {
      this.appService.handleFiles(files);
    }
    //handle text if available
    if (e.dataTransfer.getData("text/plain")) {
      const text = e.dataTransfer.getData("text/plain");
      eventBus.publish(MESSAGES.PUBLISH_TEXT, { texts: [text] });
    }
    e.preventDefault();
    e.stopPropagation();
  }

  handlePaste(e) {
    const items = Array.from(e.clipboardData.items);
    //emit an event to the app service to handle the pasted items
    if (this.appService) {
      this.appService.handleFiles(
        items.filter((item) => item.kind === "file").map((item) =>
          item.getAsFile()
        ),
      );
    }
    // Handle pasted string items (e.g., plain text, URLs)
    items
      .filter((item) => item.kind === "string")
      //also filter type : "text/plain"
      .filter((item) => item.type === "text/plain")
      .forEach((item) => {
        item.getAsString((text) => {
          if (text && text.trim().length > 0) {
            eventBus.publish(MESSAGES.PUBLISH_TEXT, { texts: [text] });
          }
        });
      });
  }

  // processImageFile(file) {
  //     const reader = new FileReader();
  //     reader.onload = (e) => {
  //         const imageData = e.target.result;
  //         this.previewService.launchPreview(imageData);
  //     };
  //     reader.readAsDataURL(file);
  // }

  // Methods to be called by services
  addWindow(windowElement) {
    this.shadowRoot.querySelector(".desktop-content").appendChild(
      windowElement,
    );
  }

  async importText(text, sourceUrl = undefined) {
    try {
      let processedContent = text;
      //default to domain as base
      let baseUrl = window.location.origin + "/";
      if (sourceUrl && text.includes("from './")) {
        baseUrl = sourceUrl.substring(0, sourceUrl.lastIndexOf("/") + 1);
      } 
      if (text.includes("from './")) {
        console.log("Converting relative imports to absolute URLs...");
        console.log("Base URL for imports:", baseUrl);

        processedContent = text.replace(
          /from\s+['"`]\.\/([^'"`]+)['"`]/g,
          (match, relativePath) => {
            const absoluteUrl = baseUrl + relativePath;
            console.log(`Converting: ${match} -> from '${absoluteUrl}'`);
            return `from '${absoluteUrl}'`;
          },
        );
      }
      const blob = new Blob([processedContent], { type: "application/javascript" });
      const url = URL.createObjectURL(blob);
      this.importUrl(url);
      //URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to import text as module:", error);
      // Optionally, you can display the text in a window or handle it differently
      if (this.appService) {
        this.appService.displayPlainTextInWindow(processedContent, "Pasted Text");
      }
    }
  }

  async importUrl(sourceUrl) {
    await import(sourceUrl);
  }
  addApp(app) {
    const {
      name = app.name || "Untitled App", // Default name if not provided
      icon = app.icon || "📄", // Default icon if not provided
      tag = app.tag || "untagged",
      sourceUrl = app.sourceUrl || "",
      x = app.x || 150 + (Math.random() * 200),
      y = app.y || 150 + (Math.random() * 100),
      width = app.width || 600, // Default width if not provided
      height = app.height || 400, // Default height if not provided
    } = app;
    // Create the content element for the app
    const content = document.createElement(tag);
    const windowEl = document.createElement("window-component");

    // Get content's derived width and height
    const { width: contentWidth, height: contentHeight } = content.getBoundingClientRect();
    // If content's width or height is less than 10px, use the defaults passed in
    if (contentWidth < 10 || contentHeight < 10) {
      windowEl.width = width;
      windowEl.height = height;
    } else {
      windowEl.width = contentWidth;
      windowEl.height = contentHeight;
    }

    windowEl.appName = name
    windowEl.appIcon = icon
    windowEl.sourceUrl = sourceUrl
    windowEl.appTag = tag
    windowEl.x = x
    windowEl.y = y
    windowEl.isMinimized = app.isMinimized || false; // Default to false if not provided

    windowEl.appendChild(content);
    this.addWindow(windowEl);

    eventBus.publish(MESSAGES.APP_LAUNCHED, { name });
  }
  addContent(config) {
    const {
        appName = 'Content Viewer',
        appIcon = '📄',
        width = 600,
        height = 400,
        content,
    } = config;

    const windowEl = document.createElement("window-component");
    windowEl.appName = appName;
    windowEl.appIcon = appIcon;
    windowEl.width = width;
    windowEl.height = height;
    windowEl.x = 150 + (Math.random() * 200);
    windowEl.y = 150 + (Math.random() * 100);

    if (typeof content === 'string') {
        windowEl.innerHTML = content;
    } else if (content instanceof HTMLElement) {
        windowEl.appendChild(content);
    }

    this.addWindow(windowEl);
  }
  getWindows() {
    return this.shadowRoot.querySelectorAll("window-component");
  }

  getDesktopSurface() {
    return this.shadowRoot.querySelector(".desktop-surface");
  }

  // Attribute handler methods
  _updateWallpaper(wallpaper) {
    // Wallpaper is now handled by CSS attribute selectors
    // No additional JavaScript needed
  }

  _updateDockPosition(position) {
    // Dock position is now handled by CSS attribute selectors
    // Notify dock component if needed
    const dockComponent = this.shadowRoot.querySelector('dock-component');
    if (dockComponent) {
      dockComponent.setAttribute('position', position);
    } else if (this.startupManager) {
      // If dock not loaded yet, it will get the position when it loads
      console.log(`📍 Dock position will be set to "${position}" when dock loads`);
    }
  }

  _updateGridSnap(enabled) {
    this.style.setProperty('--grid-snap-size', enabled ? '20px' : '0px');
  }

  _updateDesktopIcons(visible) {
    // Desktop icons visibility handled by CSS attribute selectors
  }

  _updateAccentColor(color) {
    this.style.setProperty('--accent-color', color);
  }

  _updateNotificationSounds(enabled) {
    // Store for notification manager to use
    this._notificationSoundsEnabled = enabled;
  }

  showContextMenu(x, y) {
    const contextMenu = this.shadowRoot.getElementById("contextMenu");
    if (!contextMenu) return;

    contextMenu.style.display = "block";
    contextMenu.style.left = `${x}px`;
    contextMenu.style.top = `${y}px`;

    const rect = contextMenu.getBoundingClientRect();
    if (rect.right > window.innerWidth) {
      contextMenu.style.left = `${x - rect.width}px`;
    }
    if (rect.bottom > window.innerHeight) {
      contextMenu.style.top = `${y - rect.height}px`;
    }
  }

  hideContextMenu() {
    const contextMenu = this.shadowRoot.getElementById("contextMenu");
    if (contextMenu) {
      contextMenu.style.display = "none";
    }
  }

  appendContextMenu(menuHtml, style) {
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = menuHtml;
    while (tempDiv.firstChild) {
      this.shadowRoot.appendChild(tempDiv.firstChild);
    }
    this.shadowRoot.appendChild(style);
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
      currentTarget: event.currentTarget.constructor.name
    });
    
    // Store event flow data for global access
    if (!window.eventFlowTest) {
      window.eventFlowTest = { 
        events: [],
        clear: () => {
          window.eventFlowTest.events = [];
          console.log('🧹 Event flow test data cleared');
        },
        analyze: () => {
          console.log('🔍 Event Flow Analysis:');
          console.log('='.repeat(50));
          
          if (window.eventFlowTest.events.length === 0) {
            console.log('No events recorded. Click something in the System Preferences app!');
            return;
          }
          
          // Group events by unique click sequence (within 50ms window)
          const sequences = [];
          let currentSequence = [];
          let lastTimestamp = 0;
          
          window.eventFlowTest.events.forEach(event => {
            if (event.timestamp - lastTimestamp > 50) {
              if (currentSequence.length > 0) {
                sequences.push([...currentSequence]);
              }
              currentSequence = [];
            }
            currentSequence.push(event);
            lastTimestamp = event.timestamp;
          });
          
          if (currentSequence.length > 0) {
            sequences.push(currentSequence);
          }
          
          sequences.forEach((sequence, index) => {
            console.log(`\n📋 Event Sequence ${index + 1}:`);
            sequence.forEach((event, eventIndex) => {
              const phases = ['', 'CAPTURING', 'AT_TARGET', 'BUBBLING'];
              const phaseText = phases[event.eventPhase] || 'UNKNOWN';
              console.log(`  ${eventIndex + 1}. [${event.level}] ${event.type} - ${phaseText} phase`);
              console.log(`     Target: ${event.target.tagName}${event.target.id ? '#' + event.target.id : ''}`);
              if (event.appName) console.log(`     App: ${event.appName}`);
              console.log(`     Time: +${event.timestamp - sequence[0].timestamp}ms`);
            });
          });
          
          console.log('\n✅ Actual Event Flow Discovered:');
          console.log('   Window (mousedown) → App (click target) → Desktop (click bubbling)');
          console.log('   This is correct DOM behavior: Target phase first, then bubbling up!');
          console.log('\n💡 To test: Click buttons in System Preferences, then run eventFlowTest.analyze()');
        },
        help: () => {
          console.log(`
🖱️ Event Flow Test Utility
=========================

Commands:
  eventFlowTest.clear()    - Clear recorded events
  eventFlowTest.analyze()  - Analyze event flow patterns
  eventFlowTest.help()     - Show this help

How to test:
1. Open System Preferences app
2. Click various buttons/checkboxes
3. Run eventFlowTest.analyze() to see the flow

Expected flow: Desktop → Window → App
          `);
        }
      };
    }
    window.eventFlowTest.events.push({
      level,
      timestamp,
      type: event.type,
      target: targetInfo,
      eventPhase: event.eventPhase
    });
  }
}

customElements.define("desktop-component", DesktopComponent);
