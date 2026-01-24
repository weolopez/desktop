// This file is now a wrapper around the new modular system preferences
import '/desktop/src/apps/system-preferences/system-preferences-shell.js';

class SystemPreferencesWebapp extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    min-width: 510px;
                    min-height: 525px;
                }
                system-preferences-shell {
                    height: 100%;
                    width: 100%;
                }
            </style>
            <system-preferences-shell></system-preferences-shell>
        `;
    }
}

// Re-defining the same custom element name to maintain compatibility with existing usages
customElements.define('system-preferences-webapp', SystemPreferencesWebapp);