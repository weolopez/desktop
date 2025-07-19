import { WallpaperManager } from "../services/wallpaper-manager.js";
import { ContextMenuManager } from "../services/context-menu-manager.js";
import { WindowManager } from "../services/window-manager.js";
import { NotificationManager } from "../services/notification-manager.js";
import "../services/notification-display-component.js";
import { AppService } from "../services/app-service.js";
import { MESSAGES, createPublishTextMessage } from "../events/message-types.js";
import "../events/event-monitor.js";

// import { PreviewService } from '../services/preview-service.js';

class DesktopComponent extends HTMLElement {
  static get observedAttributes() {
    return ['wallpaper', 'dock-position', 'grid-snap', 'show-desktop-icons', 'accent-color', 'notification-sounds'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });

    this.appService = new AppService();
    this.appService.init(this);

    this.wallpaperManager = new WallpaperManager(this);
    this.contextMenuManager = new ContextMenuManager(
      this,
      this.wallpaperManager,
    );
    this.windowManager = new WindowManager(this, this.appService);
    this.notificationManager = new NotificationManager(this);

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

  connectedCallback() {
    this.render();
    this.contextMenuManager.init();
    this.windowManager.setupEventListeners();
    this.windowManager.restoreWindowsState();
    this.notificationManager.init();
    this.setupPasteDrop();
    this.setupNotificationDisplayConnection();
    // this.setupAppEventListeners();
    // this.showTestNotification();
  }

  // showTestNotification() {
  //   setTimeout(() => {
  //     document.dispatchEvent(
  //       new CustomEvent("create-notification", {
  //         detail: {
  //           sourceAppId: "system",
  //           title: "Welcome to your Desktop!",
  //           body: "The notification system is now active.",
  //           icon: "🎉",
  //         },
  //       }),
  //     );
  //   }, 2000);
  // }

  // setupAppEventListeners() {
  //   this.addEventListener("app-launched", () => {
  //     console.log("App launched event received");
  //   });

  //   this.addEventListener("window-closed", () => {
  //     setTimeout(() => {
  //       console.log("Window closed event received");
  //     }, 100);
  //   });

  //   this.addEventListener("launch-finder-webapp", (e) => {
  //     document.dispatchEvent(
  //       new CustomEvent("PUBLISH_TEXT", { detail: { texts: [e.detail.url] } }),
  //     );
  //   });
  // }

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
                
                <div class="dock-container">
                    <dock-component></dock-component>
                </div>
            </div>
            <notification-display-component id="notification-display"></notification-display-component>
        `;
    // Apply current attribute values to CSS custom properties
    this._updateAccentColor(this.getAttribute('accent-color') || '#007AFF');
  }

  setupNotificationDisplayConnection() {
    // Connect the notification manager to the display component
    const notificationDisplay = this.shadowRoot.getElementById("notification-display");
    if (notificationDisplay) {
      this.notificationManager.setDisplayComponent(notificationDisplay);
      
      // Create a welcome notification to show the system is working
      setTimeout(() => {
        this.notificationManager.createTestNotification('system');
      }, 2000);
    }
  }

  setupPasteDrop() {
    const desktopSurface = this.shadowRoot.querySelector(".desktop-surface");

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
      if (e.currentTarget === e.target) {
        this.handlePaste(e);
      }
    });
  }

  handleFileDrop(e) {
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      this.appService.handleFiles(files);
    }
    //handle text if available
    if (e.dataTransfer.getData("text/plain")) {
      const text = e.dataTransfer.getData("text/plain");
      document.dispatchEvent(createPublishTextMessage({ texts: [text] }));
    }
    e.preventDefault();
    e.stopPropagation();
  }

  handlePaste(e) {
    const items = Array.from(e.clipboardData.items);
    //emit an event to the app service to handle the pasted items
    this.appService.handleFiles(
      items.filter((item) => item.kind === "file").map((item) =>
        item.getAsFile()
      ),
    );
    // Handle pasted string items (e.g., plain text, URLs)
    items
      .filter((item) => item.kind === "string")
      //also filter type : "text/plain"
      .filter((item) => item.type === "text/plain")
      .forEach((item) => {
        item.getAsString((text) => {
          if (text && text.trim().length > 0) {
            document.dispatchEvent(createPublishTextMessage({ texts: [text] }));
          }
        });
      });

    // Prevent default paste behavior
    e.preventDefault();
    e.stopPropagation();
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
      this.appService.displayPlainTextInWindow(processedContent, "Pasted Text");
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

    // this.dispatchEvent(
    //     new CustomEvent("app-launched", {
    //         detail: { appName },
    //         bubbles: true,
    //         composed: true,
    //     }),
    // );
  }
  addContent(div) {
    // appName: title,
    // appIcon: "📄",
    // width: 500,
    // height: 300,
    // content: contentDiv,
    alert("addContent is deprecated, use addApp instead", div);
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
}

customElements.define("desktop-component", DesktopComponent);
