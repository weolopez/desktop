import { BasePanel } from './base-panel.js';

class NotificationsPanel extends BasePanel {
    getTemplate() {
        return `
            <h2>Notifications</h2>
            
            <div class="form-group">
                <label>
                    <input type="checkbox" id="notification-sounds" checked>
                    Play notification sounds
                </label>
            </div>
        `;
    }

    loadSettings() {
        if (!this.desktopComponent) return;

        const notificationSounds = this.desktopComponent.getAttribute('notification-sounds') !== 'false';
        this.shadowRoot.getElementById('notification-sounds').checked = notificationSounds;
    }

    setupEventListeners() {
        this.shadowRoot.getElementById('notification-sounds').addEventListener('change', (e) => {
            this.logEventFlow("APP", e);
            if (this.desktopComponent) {
                this.desktopComponent.setAttribute('notification-sounds', e.target.checked);
            }
        });
    }
}

customElements.define('sys-pref-notifications-panel', NotificationsPanel);
