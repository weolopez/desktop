# WE-OS Documentation

WE-OS is a sophisticated web-based operating system simulation that recreates a complete desktop environment using modern web technologies. Built entirely with vanilla HTML, CSS, and JavaScript Web Components, it implements core operating system concepts within browser security constraints.

## 📚 Documentation Index

### Core Architecture
- **[WE-OS-Architecture.md](WE-OS-Architecture.md)** - Complete system architecture documentation
- **[startup-optimization.md](startup-optimization.md)** - Startup system design and optimization
- **[component-reference.md](component-reference.md)** - Core component documentation and APIs

### Application Development
- **[application-guide.md](application-guide.md)** - Building applications using existing patterns
- **[dynamic-component-system-integration.md](dynamic-component-system-integration.md)** - Dynamic component system integration guide
- **[event-system-api.md](event-system-api.md)** - Complete event system API reference

### System Services
- **[ai-subsystem.md](ai-subsystem.md)** - Complete AI subsystem integration including WebLLM, Chat Component, and Spotlight
- **[knowledge-configuration.md](knowledge-configuration.md)** - Configuring additional knowledge sources for AI
- **[notification-system.md](notification-system.md)** - Notification service documentation
- **[configuration-reference.md](configuration-reference.md)** - Complete config.json reference

### Project Guidelines
- **[REQUIREMENTS.md](REQUIREMENTS.md)** - Project requirements and specifications
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
2. **[component-reference.md](component-reference.md)** - Core component APIs and patterns
3. **[startup-optimization.md](startup-optimization.md)** - Startup system details
4. **[configuration-reference.md](configuration-reference.md)** - Configuration system reference

### For Application Development
1. **[application-guide.md](application-guide.md)** - Building applications step-by-step
2. **[event-system-api.md](event-system-api.md)** - Event system API reference
3. **[dynamic-component-system-integration.md](dynamic-component-system-integration.md)** - Component loading system
4. **Component examples in `/wc/dynamic-component-system/examples/`**

### For Service Integration
1. **[ai-subsystem.md](ai-subsystem.md)** - Complete AI subsystem integration with WebLLM, Chat Component, and Spotlight
2. **[knowledge-configuration.md](knowledge-configuration.md)** - Adding custom knowledge sources to AI
3. **[notification-system.md](notification-system.md)** - Notification system usage
4. **[event-system-api.md](event-system-api.md)** - Inter-component communication

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
- **AI Subsystem**: Complete local AI integration with WebLLM, Chat Component, and Spotlight
- **Multiple Models**: Support for different AI models (Qwen, DeepSeek)
- **Knowledge Integration**: Resume and project data for contextual responses
- **Global Access**: Spotlight (Cmd+K) for system-wide AI assistance
- **Event-Driven**: Integrated with desktop event system

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
    ├── README.md (this file)      # Documentation index
    ├── WE-OS-Architecture.md      # System architecture
    ├── application-guide.md       # Application development
    ├── event-system-api.md        # Event system reference
    ├── ai-subsystem.md            # Complete AI subsystem integration
    ├── knowledge-configuration.md # AI knowledge source configuration
    ├── notification-system.md     # Notification system
    ├── component-reference.md     # Core components
    ├── configuration-reference.md # Configuration guide
    ├── dynamic-component-system-integration.md
    ├── startup-optimization.md
    ├── REQUIREMENTS.md
    └── GEMINI.md
```

## 🤝 Contributing

1. Read the **[WE-OS-Architecture.md](WE-OS-Architecture.md)** for system understanding
2. Follow development guidelines in **[../CLAUDE.md](../CLAUDE.md)**
3. Test changes by opening `index.html` in a browser
4. Update documentation for significant changes

## 📄 License

MIT License - feel free to use and modify as needed.