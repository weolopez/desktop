# Project Requirements

## Core Functionality

- **Virtual Desktop Environment:** Create a desktop-like interface in the browser, inspired by macOS.
- **Menu Bar:** A global menu bar at the top of the screen, which changes based on the active application.
- **Windowing System:**
    - Windows will act as containers for web components.
    - Windows can be opened, closed, moved, resized, minimized, and maximized.
    - Support for overlapping windows and managing focus (active vs. inactive windows).
- **Dock:** A specialized window that is pinned to an edge of the desktop. It will contain application launchers and icons for running applications. It can be positioned at the bottom, left, or right edge of the desktop.
- **Desktop Icons:** Icons on the desktop for launching applications or opening files/folders.
- **Application Launcher:** A full-screen view (like Launchpad) to display and launch all available applications.
- **Context Menus:** Right-click context menus on the desktop and within applications.
- **Desktop Wallpaper:** Ability to set and change the desktop background image.
- **Virtual File System:** An in-memory file system to manage files and folders, allowing them to be represented by icons on the desktop.
- **Drag and Drop:** Support for dragging icons on the desktop and potentially files into application windows.

## Technical Requirements

- **Frontend:**
    - Use vanilla HTML, CSS, and JavaScript.
    - No third-party JavaScript libraries or frameworks (e.g., React, Vue, Angular).
    - No CSS frameworks (e.g., Bootstrap, Tailwind CSS).
- **Web Components:** Leverage standard web components for creating reusable UI elements.
    - **Desktop Component:** The main container for the entire application. It will be the only component in the `index.html` body. It will manage the windows, menu bar, dock, and desktop icons.
    - **Window Component:** A draggable and resizable window. It will have a title bar with close, minimize, and maximize buttons. It will contain the content of an application.
    - **Dock Component:** A specialized window that is pinned to an edge of the desktop. It will contain `Dock-Icon` components.
    - **Icon Component:** A generic component for desktop icons and application launcher icons.
    - **Menu-Bar Component:** The global menu bar at the top of the screen.
- **Build Process:** No Node.js, npm, or any build tools. The project should run directly in the browser without any compilation or bundling steps.

## Project Structure

- **Root Directory:**
  - `index.html`: The main HTML file.
  - `style.css`: The main stylesheet.
  - `script.js`: The main JavaScript file for initializing the desktop.
- **`/wc/` Directory:** Contains all the core web components.
  - `desktop-component.js`
  - `window-component.js`
  - `dock-component.js`
  - `icon-component.js`
  - `menu-bar-component.js`
- **`/apps/` Directory:** Contains the web components for each application.
  - Example: `settings-webapp.js`
- **`/assets/` Directory:** Contains all static assets.
  - `/icons/`: For application and UI icons.
  - `/wallpapers/`: For desktop background images.

- **Component Directory:** All web components will reside in a `/wc/` directory.
- **Application Naming:** Web components that function as full applications will be named `<name>-webapp.js`.

## State Management

- **URL Persistence (Deep Linking):** The list of currently open applications will be stored in the URL as a query parameter to allow for persistent, shareable desktop states. For example: `?apps=<app1>-webapp.js,<app2>-webapp.js`.
- **Long-Term State (localStorage):** User preferences that should persist across sessions will be stored in `localStorage`. This includes:
    - Desktop wallpaper
    - Dock position and size
    - Desktop icon positions
- **Short-Term State (sessionStorage):** The state of the desktop for the current session will be stored in `sessionStorage`. This includes:
    - Open window positions and dimensions
    - The z-index order of windows

## Non-Functional Requirements

- **Performance:** The application should be lightweight and performant, with smooth animations and interactions.
- **Compatibility:** The application should be compatible with the latest versions of modern web browsers (e.g., Chrome, Firefox, Safari, Edge).
- **Code Quality:** The code should be well-organized, commented, and easy to maintain.
- **Accessibility:** The application should adhere to basic web accessibility standards (WCAG).
