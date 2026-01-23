import { BasePanel } from './base-panel.js';

class AppearancePanel extends BasePanel {
    getTemplate() {
        return `
            <h2>Appearance</h2>
            
            <div class="form-group">
                <label for="accent-color">Accent Color:</label>
                <input type="color" id="accent-color" value="#007AFF">
            </div>
        `;
    }

    loadSettings() {
        if (!this.desktopComponent) return;

        // Load accent color
        const accentColor = this.desktopComponent.getAttribute('accent-color') || '#007AFF';
        this.shadowRoot.getElementById('accent-color').value = accentColor;
    }

    setupEventListeners() {
        this.shadowRoot.getElementById('accent-color').addEventListener('change', (e) => {
            this.logEventFlow("APP", e);
            if (this.desktopComponent) {
                this.desktopComponent.setAttribute('accent-color', e.target.value);
            }
        });
    }
}

customElements.define('sys-pref-appearance-panel', AppearancePanel);
