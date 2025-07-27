# WE-OS Documentation

WE-OS is a sophisticated web-based operating system simulation that recreates a complete desktop environment using modern web technologies. Built entirely with vanilla HTML, CSS, and JavaScript Web Components, it implements core operating system concepts within browser security constraints.

## 📚 Documentation Index

### Core Architecture
- **[WE-OS-Architecture.md](WE-OS-Architecture.md)** - Complete system architecture documentation
- **[startup-optimization.md](startup-optimization.md)** - Startup system design and optimization

### Project Planning & Requirements
- **[REQUIREMENTS.md](REQUIREMENTS.md)** - Project requirements and specifications
- **[desktop-PLAN.md](desktop-PLAN.md)** - Desktop development plan
- **[window-state-persistence-plan.md](window-state-persistence-plan.md)** - Window state management plan
- **[dynamic-component-system-integration.md](dynamic-component-system-integration.md)** - Dynamic component system integration guide

### Development Guidelines
- **[GEMINI.md](GEMINI.md)** - Gemini AI integration guidelines
- **[../CLAUDE.md](../CLAUDE.md)** - Claude AI development instructions

## 🏗️ System Overview

### Key Features
- **Complete Desktop Environment**: Window management, dock, menu bar, desktop icons
- **Dynamic Component System**: ES6 web component applications loaded at runtime
- **Configurable Startup System**: 3-phase startup with dependency resolution
- **AI Integration**: WebLLM service for local AI capabilities
- **Advanced Notifications**: Visual notification system with animations
- **Search Integration**: Spotlight-like search functionality
- **Virtual File System**: Unix-like file system with terminal
- **Web Component Architecture**: Modular, reusable component system
- **Security Model**: Safe code execution with import resolution and error handling

### Architecture Highlights

```
Desktop Environment (Browser-Based OS)
├── Configurable Startup System (3 phases)
│   ├── Critical: Core services (AppService, WindowManager, WallpaperManager)
│   ├── UI: Interface components (Dock, ContextMenu, Notifications)
│   └── Optional: Background services (AI, Search, Monitoring)
├── Application Ecosystem
│   ├── Terminal (Virtual file system)
│   ├── Safari/Chrome (Web browsing)
│   ├── TextEdit (Text processing)
│   ├── Preview (File viewer)
│   └── System Preferences (Configuration)
├── Event-Driven Communication
│   ├── EventBus (Inter-component messaging)
│   ├── Message Types (Protocol definitions)
│   └── Event Monitor (System monitoring)
└── Web Technologies
    ├── Web Components (Shadow DOM)
    ├── ES6 Modules (Dynamic loading)
    ├── Web Workers (AI processing)
    └── Web APIs (Storage, Performance, etc.)
```

## 🚀 Quick Start

### Development Setup

1. **No Build Process Required**: This project runs directly in the browser
2. **Open `index.html`**: Simply open in a modern web browser
3. **Configuration**: Edit `config.json` for startup customization

### Browser Compatibility
- Chrome/Chromium (Recommended)
- Firefox
- Safari
- Edge

### Key Files
- **`index.html`**: Main entry point
- **`config.json`**: Startup and feature configuration
- **`src/components/desktop-component.js`**: Main desktop kernel
- **`src/services/startup-manager.js`**: Configurable startup system

## 📖 Reading Guide

### For New Developers
1. Start with **[WE-OS-Architecture.md](WE-OS-Architecture.md)** for system overview
2. Review **[REQUIREMENTS.md](REQUIREMENTS.md)** for project goals
3. Check **[../CLAUDE.md](../CLAUDE.md)** for development guidelines

### For System Architecture
1. **[WE-OS-Architecture.md](WE-OS-Architecture.md)** - Complete architecture documentation
2. **[startup-optimization.md](startup-optimization.md)** - Startup system details
3. **[dynamic-component-system-integration.md](dynamic-component-system-integration.md)** - Component loading system

### For Feature Development
1. **[desktop-PLAN.md](desktop-PLAN.md)** - Desktop feature planning
2. **[window-state-persistence-plan.md](window-state-persistence-plan.md)** - Window management
3. **Configuration examples in `config.json`**

## 🔧 Configuration

The system uses a sophisticated configuration system:

- **Runtime Config**: `config.json` for startup phases and features
- **localStorage Override**: For development configuration testing
- **Feature Flags**: Enable/disable AI, notifications, monitoring
- **Performance Tuning**: Concurrent loading limits, timeouts, retries

See **[WE-OS-Architecture.md](WE-OS-Architecture.md)** for detailed configuration examples.

## 🌟 Notable Features

### Startup System
- **3-Phase Loading**: Critical → UI → Optional components
- **Dependency Resolution**: Automatic component ordering
- **Graceful Fallbacks**: Failed optional components don't break system
- **Performance Monitoring**: Real-time startup metrics

### AI Integration
- **WebLLM Service**: Local AI inference using Web Workers
- **Multiple Models**: Support for different AI models (Qwen, DeepSeek)
- **Event-Driven**: Integrated with desktop event system
- **Configurable**: Model selection and generation parameters

### Desktop Environment
- **Window Management**: Full windowing system with drag, resize, focus
- **Virtual File System**: Unix-like commands and directory structure
- **Notification System**: Visual notifications with glassmorphism design
- **Search**: Spotlight-like global search functionality

## 📁 Project Structure

```
├── index.html                 # Main entry point
├── config.json               # Startup and feature configuration
├── src/
│   ├── components/           # Core UI components
│   │   ├── desktop-component.js
│   │   ├── window-component.js
│   │   ├── dock-component.js
│   │   └── menu-bar-component.js
│   ├── services/            # System services
│   │   ├── startup-manager.js
│   │   ├── window-manager.js
│   │   ├── wallpaper-manager.js
│   │   ├── notification-service.js
│   │   └── webllm-service.js
│   ├── apps/               # Application components
│   │   ├── terminal-webapp.js
│   │   ├── textedit-webapp.js
│   │   ├── safari-webapp.js
│   │   └── preview/
│   └── events/             # Event system
│       ├── event-bus.js
│       ├── message-types.js
│       └── event-monitor.js
└── docs/                   # Documentation
    ├── WE-OS-Architecture.md
    ├── startup-optimization.md
    └── [this file]
```

## 🤝 Contributing

1. Read the **[WE-OS-Architecture.md](WE-OS-Architecture.md)** for system understanding
2. Follow development guidelines in **[../CLAUDE.md](../CLAUDE.md)**
3. Test changes by opening `index.html` in a browser
4. Update documentation for significant changes

## 📄 License

MIT License - feel free to use and modify as needed.