export class BasePanel extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.desktopComponent = document.querySelector('desktop-component');
    }

    connectedCallback() {
        this.render();
        this.loadSettings();
        this.setupEventListeners();
    }

    getStyles() {
        return `
            :host {
                display: block;
                font-family: -apple-system, BlinkMacSystemFont, sans-serif;
            }

            h2 {
                margin: 0 0 20px 0;
                font-size: 18px;
                font-weight: 600;
            }

            h3 {
                margin: 20px 0 15px 0;
                font-size: 16px;
                font-weight: 600;
                color: #333;
            }

            .form-group {
                margin-bottom: 16px;
            }

            .form-group label {
                display: block;
                font-weight: 500;
                margin-bottom: 4px;
                font-size: 13px;
                color: #333;
            }

            .form-group select,
            .form-group input {
                width: 200px;
                padding: 6px 8px;
                border: 1px solid #ccc;
                border-radius: 4px;
                font-size: 13px;
            }

            .form-group input[type="checkbox"] {
                width: auto;
                margin-right: 8px;
            }

            .form-group input[type="color"] {
                width: 50px;
                height: 30px;
                border: none;
                border-radius: 4px;
                cursor: pointer;
            }
        `;
    }

    render() {
        this.shadowRoot.innerHTML = `<style>${this.getStyles()}</style>${this.getTemplate()}`;
    }

    getTemplate() {
        return '<div>Override getTemplate()</div>';
    }

    loadSettings() {
        // Override
    }

    setupEventListeners() {
        // Override
    }

    logEventFlow(level, event) {
        if (!window.eventFlowTest || !window.eventFlowTest.capture) return;

        const targetInfo = {
            id: event.target.id,
            tagName: event.target.tagName,
            dataset: { ...event.target.dataset }
        };

        const timestamp = new Date().toISOString();
        console.log(`🖱️ [${level}] Event received at ${timestamp}:`, {
            type: event.type,
            target: targetInfo,
            path: event.composedPath().map(el => el.tagName).join(' > ')
        });

        // Store event for analysis if needed
        if (!window.eventFlowTest.events) {
            window.eventFlowTest.events = [];
        }
        window.eventFlowTest.events.push({
            level,
            timestamp,
            type: event.type,
            target: targetInfo
        });
    }
}
