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
    this.body = document.body;
    this.desktopContent = document.createElement("div");
    this.desktopContent.classList.add("desktop-content");
    this.body.appendChild(this.desktopContent);

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
        // this._updateWallpaper(newValue);
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
    document.addEventListener('COMPONENT_REGISTERED', async (e) => {
      if (e.detail.error) {
        console.error(`Error registering component: ${e.detail.error}`, e.detail);
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
  }

  render() {
    this.innerHTML = `
            <style>
                desktop-component {
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

                desktop-component[wallpaper="gradient"] {
                    --desktop-wallpaper: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                }

                desktop-component[wallpaper="monterey"] {
                    --desktop-wallpaper: linear-gradient(135deg, #1e3c72 0%, #2a5298 50%, #764ba2 100%);
                }

                desktop-component[wallpaper="big-sur"] {
                    --desktop-wallpaper: linear-gradient(180deg, #ff9a9e 0%, #fecfef 50%, #fecfef 100%);
                }
                desktop-component[wallpaper="ice-blue"] {
                    --desktop-wallpaper: linear-gradient(to bottom, #dff3ff 0%, #0088ff 100%);
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

                desktop-component[show-desktop-icons="false"] .desktop-icons {
                    display: none;
                }

                desktop-component[grid-snap="true"] .desktop-content {
                    background-image: 
                        linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px),
                        linear-gradient(to bottom, rgba(255,255,255,0.1) 1px, transparent 1px);
                    background-size: var(--grid-snap-size) var(--grid-snap-size);
                }
            </style>
            
            <div class="desktop-background"></div>
            
            <div class="desktop-surface">
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

  }
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
        if (WEB_COMPONENT_TAG_REGEX.test(text)) {
          const detail = { code: text, mimeType: "application/javascript", launch: true };
          document.dispatchEvent(new CustomEvent('PUBLISH_COMPONENT', { detail }));
        }
        else eventBus.publish(MESSAGES.PUBLISH_TEXT, { texts: [text] });
      }
    }
  }
  addWindow(windowElement) {
    return document.querySelector(".desktop-content").appendChild(
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
      width,
      height,
      isMinimized = false
    } = config;

    let windowEl = document.createElement("window-component");
    //set data-window-id attribute
    windowEl.setAttribute('data-window-id', windowEl.windowId);
    // Set properties
    Object.assign(windowEl, {
      appName: name,
      appIcon: icon,
      sourceUrl,
      appTag: tag,
      x, y, 
      width: width || 600,
      height: height || 400,
      isMinimized
    });
    windowEl=this.addWindow(windowEl);

    const slot = windowEl.querySelector('#window-slot') || windowEl;
    if (content) {
      if (typeof content === "string") {
        slot.innerHTML = content;
      } else {
        slot.appendChild(content);
      }

      // If width or height weren't explicitly provided, measure the natural size of the content
      if (width === undefined || height === undefined) {
        const windowDiv = windowEl.querySelector('.window');
        const windowContent = windowEl.querySelector('.window-content');
        
        if (windowDiv) {
          // Temporarily set to auto to measure natural size
          windowDiv.style.width = 'auto';
          windowDiv.style.height = 'auto';
          if (windowContent) windowContent.style.height = 'auto';
          
          // Measure the window dimensions (includes title bar and content)
          const rect = windowDiv.getBoundingClientRect();
          
          if (width === undefined) {
            windowEl.width = Math.max(Math.ceil(rect.width), 200);
          }
          if (height === undefined) {
            windowEl.height = Math.max(Math.ceil(rect.height), 150);
          }
          
          // Restore the window-content height calc and apply final measured size
          if (windowContent) windowContent.style.height = ''; 
          windowEl.updateSize();
        }
      }
    }

    return windowEl;
  }

  async addApp(app) {
    // Singleton check
    if (app.singleton && this.querySelector(app.tag)) {
      console.warn(`App ${app.name} is already running.`);
      return;
    }

    const content = document.createElement(app.tag || "div");
    this._createWindow(app, content);

    eventBus.publish(MESSAGES.APP_LAUNCHED, app);
  }

  addContent(config) {
    this._createWindow({
      name: config.appName || "Content Viewer",
      icon: config.appIcon || "📄",
      ...config
    }, config.content);
  }

  getWindows() {
    return document.querySelectorAll("window-component");
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

  _updateDockPosition(newValue) {
    const dock = this.querySelector('dock-component');
    if (dock) {
      dock.setAttribute('dock-position', newValue);
    }
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

}

customElements.define("desktop-component", DesktopComponent);
