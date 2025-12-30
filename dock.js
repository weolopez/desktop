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
        sourceUrl: '/chat-component/chat-component.js', 
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
        id: 'resume-component', 
        name: 'Resume Component', 
        icon: '🔮', 
        sourceUrl: '/resume-component.js', 
        tag: "resume-component", 
        onstartup: true 
    },
    { 
        id: 'system-preferences', 
        name: 'System Preferences', 
        icon: '⚙️', 
        sourceUrl: '../apps/system-preferences-webapp.js', 
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
        id: 'soccer-prediction',
        name: 'EPL Prediction',
        icon: '⚽',
        sourceUrl: '/wc/prediction-table.js',
        tag: "prediction-table",
        onstartup: false
    },
    { 
        id: 'safari', 
        name: 'Safari', 
        icon: '🧭', 
        sourceUrl: '../apps/safari-webapp.js', 
        tag: "safari-webapp", 
        onstartup: false 
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