export const APPS = [
    { 
        id: 'finder', 
        name: 'Finder', 
        icon: '📁', 
        sourceUrl: '/experiments/editor/wc/github-explorer.js', 
        tag: "github-explorer", 
        onstartup: false 
    },
    { 
        id: 'chat', 
        name: 'Chat', 
        icon: '💬', 
        sourceUrl: '/chat-component/chat-component.js', 
        tag: "chat-component", 
        onstartup: false 
    },
    { 
        id: 'chat2', 
        name: 'Chat2', 
        icon: '💬2', 
        sourceUrl: '/experiments/vibe-coder/vibe-coder-chat.js', 
        tag: "vibe-coder-chat", 
        onstartup: false 
    },
    { 
        id: 'user-management', 
        name: 'User Management', 
        icon: '👨‍⚕️', 
        sourceUrl: '/wc/google-login.js', 
        tag: "google-login", 
        onstartup: false 
    },
    { 
        id: 'resume-component', 
        name: 'Resume Component', 
        icon: '🔮', 
        sourceUrl: '/resume-component.js', 
        tag: "resume-component", 
        onstartup: false,
        singleton: true 
    },
    { 
        id: 'system-preferences', 
        name: 'System Preferences', 
        icon: '⚙️', 
        sourceUrl: '/desktop/src/apps/system-preferences-webapp.js', 
        tag: "system-preferences-webapp", 
        onstartup: false,
        singleton: true
    },
    { 
        id: 'terminal', 
        name: 'Terminal', 
        icon: '⚫', 
        sourceUrl: '../apps/terminal-webapp.js', 
        tag: "terminal-webapp", 
        onstartup: false 
    },
    {
        id: 'monaco-editor-instance',
        name: 'Monaco Editor Instance',
        icon: '📝',
        sourceUrl: '/sites/desktop/wc/monaco-editor-instance.js',
        tag: 'monaco-editor-instance',
        onstartup: false
    },
    {
        id: 'event-debugger',
        name: 'Event Debugger',
        icon: '🛠️',
        sourceUrl: '/experiments/wc/vibe-event-debugger.js',
        tag: "vibe-event-debugger",
        onstartup: false,
        singleton: true
    },
    { 
        id: 'controls', 
        name: 'Controls', 
        icon: '🧭', 
        sourceUrl: '/experiments/vibe-coder/vibe-coder-controls.js', 
        tag: "vibe-coder-controls.js", 
        onstartup: false,
        singleton: true 
    }, // add /wc/mouse-trail.js a mouse trail
    { 
        id: 'mouse-trail', 
        name: 'Mouse Trail', 
        icon: '🐭', 
        sourceUrl: '/wc/mouse-trail.js', 
        tag: "mouse-trail", 
        onstartup: false 
    }
    // { 
    //     id: 'notification', 
    //     name: 'Notification', 
    //     icon: '🔔', 
    //     sourceUrl: '/apps/notification/notification-display-component.js', 
    //     tag: "notification-display-component", 
    //     onstartup: true, 
    //     static: true 
    // }
];

    // { id: 'finder', name: 'Finder', icon: '📁', sourceUrl: 'https://weolopez.com/desktop/src/apps/finder/finder-webapp.js' },
    // { id: 'textedit', name: 'TextEdit', icon: '📝' },
    // { id: 'safari', name: 'Safari', icon: '🧭' },
    // { id: 'system-preferences', name: 'System Preferences', icon: '⚙️' },
    // { id: 'activity-monitor', name: 'Activity Monitor', icon: '📊' },
export const APP_URL_MAP = new Map(
    APPS.filter(app => app.sourceUrl).map(app => [`${app.id}-webapp`, app.sourceUrl])
);