import StorageService from '../services/storage-service.js';
import { MESSAGES } from "../events/message-types.js";
import eventBus from "../events/event-bus.js";
import "../events/event-monitor.js";
import '../components/window-component.js';


class DesktopComponent extends HTMLElement {
  static get observedAttributes() {
    return [
      "config",
      "wallpaper",
      "dock-position",
      "grid-snap",
      "show-desktop-icons",
      "accent-color",
      "notification-sounds",
    ];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" })

    // Legacy service references will be populated after startup
    this.appService = null;
    this.contextMenuManager = null;
    this.windowManager = null;

    // Storage service
    this.storageService = new StorageService();

    // Initialize attributes from storage if not set
    this._initializeAttributes().then(() => {
      // Attributes initialized
      console.log("DesktopComponent attributes initialized");
    });
  }

  async _getDB() {
      if (!this.storageService || !this.storageService.db) {
        await this.storageService.openDB();
      } 
      return this.storageService.db;
  }

  async _initializeAttributes() {

    const configURL = this.getAttribute("config") || window.startupConfig || '/desktop/config.json';

    try {
      await this._getDB();
 
      if (!this.hasAttribute("wallpaper")) {
        const savedWallpaper = await this.storageService.getItem("desktop-wallpaper", 'preferences') || "gradient";
        this.setAttribute("wallpaper", savedWallpaper);
      }
      if (!this.hasAttribute("grid-snap")) {
        const savedGridSnap = await this.storageService.getItem("grid-snap", 'preferences') || "false";
        this.setAttribute("grid-snap", savedGridSnap);
      }
      if (!this.hasAttribute("show-desktop-icons")) {
        const savedShowIcons = await this.storageService.getItem("show-desktop-icons", 'preferences') || "true";
        this.setAttribute("show-desktop-icons", savedShowIcons);
      }
      if (!this.hasAttribute("accent-color")) {
        const savedAccentColor = await this.storageService.getItem("accent-color", 'preferences') || "#007AFF";
        this.setAttribute("accent-color", savedAccentColor);
      }
      if (!this.hasAttribute("notification-sounds")) {
        const savedNotificationSounds = await this.storageService.getItem("notification-sounds", 'preferences') || "true";
        this.setAttribute("notification-sounds", savedNotificationSounds);
      }
    } catch (error) {
      console.error('Failed to load attributes from storage:', error);
      // Fallback to defaults if storage fails
      this.setAttribute("wallpaper", "gradient");
      this.setAttribute("dock-position", "bottom");
      this.setAttribute("grid-snap", "true");
      this.setAttribute("show-desktop-icons", "true");
      this.setAttribute("accent-color", "#007AFF");
      this.setAttribute("notification-sounds", "true");
    }
  }

  async attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;

    await this._getDB()

    switch (name) {
      case "wallpaper":
        this._updateWallpaper(newValue);
        this.storageService.setItem("desktop-wallpaper", newValue, 'preferences').catch(console.error);
        break;
      case "dock-position":
        this._updateDockPosition(newValue);
        this.storageService.setItem("dock-position", newValue, 'preferences').catch(console.error);
        break;
      case "grid-snap":
        this._updateGridSnap(newValue === "true");
        this.storageService.setItem("grid-snap", newValue, 'preferences').catch(console.error);
        break;
      case "show-desktop-icons":
        this._updateDesktopIcons(newValue === "true");
        this.storageService.setItem("show-desktop-icons", newValue, 'preferences').catch(console.error);
        break;
      case "accent-color":
        this._updateAccentColor(newValue);
        this.storageService.setItem("accent-color", newValue, 'preferences').catch(console.error);
        break;
      case "notification-sounds":
        this._updateNotificationSounds(newValue === "true");
        this.storageService.setItem("notification-sounds", newValue, 'preferences').catch(console.error);
        break;
    }
  }

  async connectedCallback() {
    this.render();

    this.setupPasteDrop();
    await this.setupAppEventListeners();
  }


  _initializeLoadedServices() {

    if (this.windowManager) {
      this.windowManager.setupEventListeners();
      this.windowManager.restoreWindowsState();
    }
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

  async setupAppEventListeners() {
    eventBus.subscribe(MESSAGES.LAUNCH_APP, await this.addApp.bind(this));
    // new CustomEvent('COMPONENT_REGISTERED' ` detail: { mimeType, success: true, tagName }
    document.addEventListener('COMPONENT_REGISTERED', async (e) => {
      // if e.detail.error alert it
      if (e.detail.error) {
        alert(`Error registering component: ${e.detail.error}`);
        return;
      }
      if (!e.detail.launch) return
      await this.addApp({
        name: e.detail.name || e.detail.tagName || "Dynamic Component",
        icon: e.detail.icon || "📦",
        tag: e.detail.tagName,
        sourceUrl: e.detail.url || e.detail.sourceUrl || ""
      });
    });
    // eventBus.subscribe(MESSAGES.APP_LAUNCHED, () => {
    //   console.log("App launched event received");
    // });

    // eventBus.subscribe(MESSAGES.WINDOW_CLOSED, () => {
    //   setTimeout(() => {
    //     console.log("Window closed event received");
    //   }, 100);
    // });

    // eventBus.subscribe(MESSAGES.LAUNCH_FINDER_WEBAPP, (e) => {
    //     eventBus.publish(MESSAGES.PUBLISH_TEXT, { texts: [e.detail.url] });
    // });
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
                :host([wallpaper="ice-blue"]) {
                    --desktop-wallpaper: linear-gradient(to bottom, #dff3ff 0%, #0088ff 100%);
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
                <div class="desktop-content">
                    <slot></slot>
                </div>
            </div>
        `;
    // Apply current attribute values to CSS custom properties
    this._updateAccentColor(this.getAttribute("accent-color") || "#007AFF");
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
      if ("DESKTOP-COMPONENT" === e.target.tagName) {
        this.handlePaste(e);
      }
    });

    // Add click event logging for testing event flow hierarchy
    desktopSurface.addEventListener("click", (e) => {
      this.logEventFlow("DESKTOP", e);
      // Don't stop propagation - let events flow to windows and apps
    });
  }
  // 'apps/finder/finder-webapp.js' is a valid URL too
  _isValidUrl(text) {
    try {
      //if ends with .js, treat as URL
      new URL(text);
      return true;
    } catch (e) {
      return false;
    }
  }

  handleFileDrop(e) {
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0 && this.appService) {
      this.appService.handleFiles(files);
    }
    //handle text if available
    if (e.dataTransfer.getData("text/plain")) {
      const text = e.dataTransfer.getData("text/plain");
      this._handleSingleText(text);
    }
    e.preventDefault();
    e.stopPropagation();
  }

  handlePaste(e) {
    const items = Array.from(e.clipboardData.items);
    items
      .filter((item) => item.kind === "string")
      //also filter type : "text/plain"
      .filter((item) => item.type === "text/plain")
      .forEach((item) => {
        item.getAsString((text) => {
          this._handleSingleText(text);
        });
      });
  }

  async _handleSingleText(text) {
    if (text && text.trim().length > 0) {
      if (text.endsWith(".js")) {
        let sourceUrl = text;
        if (!/^https?:\/\//i.test(sourceUrl)) {
          sourceUrl = window.location.origin + "/" + sourceUrl;
        }
        const detail = { url: sourceUrl, mimeType: "application/javascript", launch: true};
        document.dispatchEvent(new CustomEvent('PUBLISH_COMPONENT', { detail }));
      } else if (this._isValidUrl(text)) {
        eventBus.publish(MESSAGES.PUBLISH_URL, { url: text });
      } else {
        const WEB_COMPONENT_TAG_REGEX = /customElements\.define\s*\(\s*['"`]([^'"`]+)['"`]/;
        // check if text has a web component tag
        if (WEB_COMPONENT_TAG_REGEX.test(text)) {
          const detail = { code: text, mimeType: "application/javascript", launch: true };
          document.dispatchEvent(new CustomEvent('PUBLISH_COMPONENT', { detail }));
        }
        else eventBus.publish(MESSAGES.PUBLISH_TEXT, { texts: [text] });
      }
    }
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

  /**
   * Internal helper to create and configure a window-component
   */
  _createWindow(config, content) {
    const {
      name = config.appName || "Untitled",
      icon = config.appIcon || "📄",
      tag = config.appTag || "div",
      sourceUrl = "",
      x = 150 + (Math.random() * 200),
      y = 150 + (Math.random() * 100),
      width = 600,
      height = 400,
      isMinimized = false
    } = config;

    const windowEl = document.createElement("window-component");
    
    // Set properties
    Object.assign(windowEl, {
      appName: name,
      appIcon: icon,
      sourceUrl,
      appTag: tag,
      x, y, width, height,
      isMinimized
    });

    if (content) {
      if (typeof content === "string") {
        windowEl.innerHTML = content;
      } else {
        windowEl.appendChild(content);
      }
    }

    this.addWindow(windowEl);
    return windowEl;
  }

  async addApp(app) {
    // Singleton check
    if (app.singleton && this.shadowRoot.querySelector(app.tag)) {
      console.warn(`App ${app.name} is already running.`);
      return;
    }

    const content = document.createElement(app.tag || "div");
    this._createWindow(app, content);

    eventBus.publish(MESSAGES.APP_LAUNCHED, { name: app.name });
  }

  addContent(config) {
    this._createWindow({
      name: config.appName || "Content Viewer",
      icon: config.appIcon || "📄",
      ...config
    }, config.content);
  }

  getWindows() {
    return this.shadowRoot.querySelectorAll("window-component");
  }

  getDesktopSurface() {
    return this.shadowRoot.querySelector(".desktop-surface");
  }

  _updateWallpaper(wallpaper) {
    // Wallpaper is handled by CSS attribute selectors
  }

  // Wallpaper helpers (migrated from WallpaperManager)
  get currentWallpaper() {
    return this.getAttribute("wallpaper") || "gradient";
  }

  set currentWallpaper(value) {
    this.setAttribute("wallpaper", value);
  }

  changeWallpaper() {
    const wallpapers = ["gradient", "monterey", "big-sur", "ice-blue"];
    const currentIndex = wallpapers.indexOf(this.currentWallpaper);
    const nextIndex = (currentIndex + 1) % wallpapers.length;
    const newWallpaper = wallpapers[nextIndex];
    this.currentWallpaper = newWallpaper; // triggers attributeChangedCallback which persists
  }

  _updateGridSnap(enabled) {
    this.style.setProperty("--grid-snap-size", enabled ? "20px" : "0px");
  }

  _updateDesktopIcons(visible) {
    // Desktop icons visibility handled by CSS attribute selectors
  }

  _updateAccentColor(color) {
    this.style.setProperty("--accent-color", color);
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
    return;
    const timestamp = Date.now();
    const targetInfo = {
      tagName: event.target.tagName?.toLowerCase() || "unknown",
      className: event.target.className || "",
      id: event.target.id || "",
      textContent: event.target.textContent?.slice(0, 30) || "",
    };

    console.log(`🖱️ [${level}] Event received at ${timestamp}:`, {
      type: event.type,
      target: targetInfo,
      bubbles: event.bubbles,
      composed: event.composed,
      eventPhase: event.eventPhase,
      currentTarget: event.currentTarget.constructor.name,
    });

    // Store event flow data for global access
    if (!window.eventFlowTest) {
      window.eventFlowTest = {
        events: [],
        clear: () => {
          window.eventFlowTest.events = [];
          console.log("🧹 Event flow test data cleared");
        },
        analyze: () => {
          console.log("🔍 Event Flow Analysis:");
          console.log("=".repeat(50));

          if (window.eventFlowTest.events.length === 0) {
            console.log(
              "No events recorded. Click something in the System Preferences app!",
            );
            return;
          }

          // Group events by unique click sequence (within 50ms window)
          const sequences = [];
          let currentSequence = [];
          let lastTimestamp = 0;

          window.eventFlowTest.events.forEach((event) => {
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
              const phases = ["", "CAPTURING", "AT_TARGET", "BUBBLING"];
              const phaseText = phases[event.eventPhase] || "UNKNOWN";
              console.log(
                `  ${
                  eventIndex + 1
                }. [${event.level}] ${event.type} - ${phaseText} phase`,
              );
              console.log(
                `     Target: ${event.target.tagName}${
                  event.target.id ? "#" + event.target.id : ""
                }`,
              );
              if (event.appName) console.log(`     App: ${event.appName}`);
              console.log(
                `     Time: +${event.timestamp - sequence[0].timestamp}ms`,
              );
            });
          });

          console.log("\n✅ Actual Event Flow Discovered:");
          console.log(
            "   Window (mousedown) → App (click target) → Desktop (click bubbling)",
          );
          console.log(
            "   This is correct DOM behavior: Target phase first, then bubbling up!",
          );
          console.log(
            "\n💡 To test: Click buttons in System Preferences, then run eventFlowTest.analyze()",
          );
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
        },
      };
    }
    window.eventFlowTest.events.push({
      level,
      timestamp,
      type: event.type,
      target: targetInfo,
      eventPhase: event.eventPhase,
    });
  }
}

customElements.define("desktop-component", DesktopComponent);
