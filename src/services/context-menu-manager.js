import eventBus from "../events/event-bus.js";
import { MESSAGES } from "../events/message-types.js";

export class ContextMenuManager {
  constructor() {
    this.desktopComponent = document.querySelector('desktop-component');
    this.contextMenuHtml = `
            <div class="context-menu" id="contextMenu">
                <div class="context-menu-item" data-action="clear-cache">Clear Cache</div>
                <div class="context-menu-separator"></div>
                <div class="context-menu-item" data-action="use-cmouse">Use Camera Mouse</div>
                <div class="context-menu-item" data-action="show-view-options">Show View Options</div>
                <div class="context-menu-separator"></div>
                <div class="context-menu-item" data-action="paste">Paste</div>
                <div class="context-menu-item" data-action="get-info">Get Info</div>
                <div class="context-menu-item" data-action="open-finder-webapp">Open Finder Web App</div>
                <div class="context-menu-separator"></div>
                <div class="context-menu-item" data-action="inspect">Right Click to Inspect</div>
            </div>
        `;
    this.contextMenuCss = `
            .context-menu {
                position: absolute;
                background: rgba(255, 255, 255, 0.85);
                backdrop-filter: blur(20px);
                border-radius: 8px;
                border: 1px solid rgba(255, 255, 255, 0.2);
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
                padding: 4px 0;
                min-width: 200px;
                display: none;
                z-index: 10000;
                font-size: 13px;
            }

            .context-menu-item {
                padding: 6px 16px;
                cursor: pointer;
                color: #1d1d1f;
                transition: background-color 0.1s ease;
            }

            .context-menu-item:hover {
                background-color: rgba(0, 122, 255, 0.8);
                color: white;
            }

            .context-menu-separator {
                height: 1px;
                background: rgba(0, 0, 0, 0.1);
                margin: 4px 0;
            }
        `;
        this.init() 
  }

  init() {
    this.desktopComponent = document.querySelector('desktop-component');
    if (!this.desktopComponent) {
      console.warn('⚠️ ContextMenuManager: desktop-component not found');
      return;
    }
    const style = document.createElement("style");
    style.textContent = this.contextMenuCss;
    this.desktopComponent.appendContextMenu(this.contextMenuHtml, style);
    this.setupEventListeners();
  }

  setupEventListeners() {
    if (!this.desktopComponent) return;

    this.desktopComponent.getDesktopSurface().addEventListener(
      "contextmenu",
      (e) => {
        e.preventDefault();
        this.desktopComponent.showContextMenu(e.clientX, e.clientY);
      },
    );

    this.desktopComponent.addEventListener("click", (e) => {
      const contextMenu = this.desktopComponent.getElementById(
        "contextMenu",
      );
      if (contextMenu && !contextMenu.contains(e.target)) {
        this.desktopComponent.hideContextMenu();
      }
    });
    const comp = this.desktopComponent.getElementById("contextMenu");
    comp.addEventListener("click", (e) => {
      if (e.target.hasAttribute("data-action")) {
        const action = e.target.getAttribute("data-action");
        this.handleContextMenuAction(action);
        this.desktopComponent.hideContextMenu();
      }
    });
  }

  async handleContextMenuAction(action) {
    switch (action) {
      case "clear-cache":
          localStorage.clear()
          // reload the page to apply changes
          window.location.reload();
        break;
      case "show-view-options":
        console.log("Show view options clicked");
        break;
      case "use-cmouse":
        this.launchCameraMouse();
        break;
      case "paste":
        try {
          const text = await navigator.clipboard.readText();
          if (text) {
            eventBus.publish(MESSAGES.TEXT_MESSAGE_PUBLISH, { texts: [text] });
          }
        } catch (err) {
          console.error("Failed to read clipboard contents: ", err);
        }
        break;
      case "get-info":
        console.log("Get info clicked");
        break;
      case "inspect":
        if (window && window.open) {
          window.open('about:blank', '_blank').document.write('<script>debugger;</script>');
        }
        break;
      case "open-finder-webapp":
        eventBus.publish(MESSAGES.TEXT_MESSAGE_PUBLISH, { texts: ["finder-webapp"] });
        break;
    }
  }

  launchCameraMouse() {
    console.log("🎯 Context Menu: Starting headless camera mouse tracking");
    // this.setupServiceEventListeners();
    async function startCameraMouseTracking() {
      const statusModule = await import(
        "/apps/camera-mouse/camera-mouse-status.js"
      );
      const statusTag = document.createElement("camera-mouse-status");
      statusTag.setAttribute("headless", "true");
      statusTag.setAttribute("source", "context-menu");
      document.body.appendChild(statusTag);

    }
    startCameraMouseTracking().then(() => {
      console.log("Camera Mouse Tracking started successfully");
    }).catch((error) => {
      console.error("Error starting Camera Mouse Tracking:", error);
    });
    // document.dispatchEvent(createStartCameraMouseMessage({
    //   source: "context-menu",
    //   headless: true,
    // }));
  }
}
