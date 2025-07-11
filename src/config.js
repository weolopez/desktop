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