export const APPS = [
    { 
        id: 'finder', 
        name: 'Finder', 
        icon: '📁', 
        sourceUrl: '/apps/finder/finder-webapp.js', 
        tag: "finder-webapp", 
        onstartup: false 
    },
    { 
        id: 'chat', 
        name: 'Chat', 
        icon: '💬', 
        sourceUrl: '/chat/chat-component.js', 
        tag: "chat-component", 
        onstartup: false 
    },
    { 
        id: 'user-management', 
        name: 'User Management', 
        icon: '👨‍⚕️', 
        sourceUrl: '/admin/user-management/user-management-dashboard.js', 
        tag: "user-management-dashboard", 
        onstartup: false 
    },
    { 
        id: 'ask-genai', 
        name: 'Ask GenAI', 
        icon: '🔮', 
        sourceUrl: '/operator/domain/ask-genai.js', 
        tag: "ask-genai", 
        onstartup: false 
    },
    { 
        id: 'generate-tdd', 
        name: 'Generate TDD', 
        icon: '📝', 
        sourceUrl: '/application_architect/generate-tdd/generate-tdd.js', 
        tag: "generate-tdd", 
        onstartup: false 
    },
    { 
        id: 'system-preferences', 
        name: 'System Preferences', 
        icon: '⚙️', 
        sourceUrl: '../apps/system-preferences-webapp.js', 
        tag: "system-preferences-webapp", 
        onstartup: true
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
        id: 'textedit', 
        name: 'TextEdit', 
        icon: '📝', 
        sourceUrl: '../apps/textedit-webapp.js', 
        tag: "textedit-webapp", 
        onstartup: false 
    },
    { 
        id: 'safari', 
        name: 'Safari', 
        icon: '🧭', 
        sourceUrl: '../apps/safari-webapp.js', 
        tag: "safari-webapp", 
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