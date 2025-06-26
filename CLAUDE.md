# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a virtual desktop environment web application that recreates a macOS-like desktop experience in the browser. The project uses vanilla HTML, CSS, and JavaScript with standard web components - no third-party libraries, frameworks, or build tools.

## Development Environment

**No Build Process Required:** This project runs directly in the browser without compilation or bundling. Simply open `index.html` in a browser to run the application.

**Testing:** Open `index.html` in a modern web browser (Chrome, Firefox, Safari, Edge) to test changes.

## Architecture

### Core Structure
- **`index.html`:** Entry point containing only the `<desktop-component>` element
- **`script.js`:** Initializes the desktop by importing the main component
- **`style.css`:** Global styles (minimal - most styling is component-scoped)
- **`/wc/`:** All core web components for the desktop system
- **`/apps/`:** Web components for individual applications (named `*-webapp.js`)
- **`/assets/`:** Static resources (icons, wallpapers)

### Web Components Pattern
All UI elements are custom web components using Shadow DOM:
- Components extend `HTMLElement` and use `attachShadow({ mode: 'open' })`
- Styling is scoped within each component's shadow root
- No external CSS frameworks - all styling is custom

### State Management System
- **URL Parameters:** Open applications persisted as `?apps=app1-webapp.js,app2-webapp.js`
- **localStorage:** User preferences (wallpaper, dock position, icon positions)
- **sessionStorage:** Current session state (window positions, z-index order)

### Planned Component Architecture
- **Desktop Component:** Main container managing windows, menu bar, dock, and icons
- **Window Component:** Draggable/resizable windows with title bars and controls
- **Dock Component:** Pinned edge container for application launchers
- **Icon Component:** Generic component for desktop and launcher icons
- **Menu Bar Component:** Global menu bar that changes based on active application

## Development Guidelines

### Component Creation
- Place core components in `/wc/` directory
- Name application components as `<name>-webapp.js` in `/apps/` directory
- Use Shadow DOM for style encapsulation
- Follow the existing pattern: extend HTMLElement, attachShadow, define in connectedCallback

### File System Conventions
- Virtual file system will be in-memory only
- Desktop icons represent files/folders in the virtual filesystem
- Support drag and drop between desktop and application windows

### Feature Implementation
The desktop should support:
- Window management (open, close, move, resize, minimize, maximize, focus)
- Dock positioning (bottom, left, right edges)
- Context menus on right-click
- Desktop wallpaper customization
- Application launcher (full-screen Launchpad-style view)
- Deep linking for shareable desktop states

### Browser Compatibility
Target modern web browsers with ES6+ support and standard web components API.