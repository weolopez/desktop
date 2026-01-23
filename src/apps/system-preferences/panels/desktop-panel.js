import { BasePanel } from './base-panel.js';

class DesktopPanel extends BasePanel {
    getStyles() {
        return `
            ${super.getStyles()}
            
            .wallpaper-preview {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 10px;
                margin-top: 10px;
            }

            .wallpaper-option {
                width: 80px;
                height: 50px;
                border-radius: 4px;
                cursor: pointer;
                border: 2px solid transparent;
                position: relative;
            }

            .wallpaper-option.selected {
                border-color: #007AFF;
            }

            .wallpaper-option.gradient {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            }

            .wallpaper-option.monterey {
                background: linear-gradient(135deg, #1e3c72 0%, #2a5298 50%, #764ba2 100%);
            }

            .wallpaper-option.big-sur {
                background: linear-gradient(180deg, #ff9a9e 0%, #fecfef 50%, #fecfef 100%);
            }

            .wallpaper-option.ice-blue {
                background: linear-gradient(to bottom, #dff3ff 0%, #0088ff 100%);
            }
        `;
    }

    getTemplate() {
        return `
            <h2>Desktop & Dock</h2>
            
            <h3>Wallpaper</h3>
            <div class="wallpaper-preview">
                <div class="wallpaper-option gradient" data-wallpaper="gradient"></div>
                <div class="wallpaper-option monterey" data-wallpaper="monterey"></div>
                <div class="wallpaper-option big-sur" data-wallpaper="big-sur"></div>
                <div class="wallpaper-option ice-blue" data-wallpaper="ice-blue"></div>
            </div>

            <h3>Dock</h3>
            <div class="form-group">
                <label for="dock-position">Position:</label>
                <select id="dock-position">
                    <option value="bottom">Bottom</option>
                    <option value="left">Left</option>
                    <option value="right">Right</option>
                </select>
            </div>

            <h3>Desktop</h3>
            <div class="form-group">
                <label>
                    <input type="checkbox" id="grid-snap">
                    Snap to grid
                </label>
            </div>
            
            <div class="form-group">
                <label>
                    <input type="checkbox" id="show-desktop-icons">
                    Show desktop icons
                </label>
            </div>
        `;
    }

    loadSettings() {
        if (!this.desktopComponent) return;

        // Load wallpaper
        const currentWallpaper = this.desktopComponent.getAttribute('wallpaper') || 'gradient';
        this.shadowRoot.querySelectorAll('.wallpaper-option').forEach(option => {
            option.classList.toggle('selected', option.dataset.wallpaper === currentWallpaper);
        });

        // Load dock position
        const dockPosition = this.desktopComponent.getAttribute('dock-position') || 'bottom';
        this.shadowRoot.getElementById('dock-position').value = dockPosition;

        // Load checkboxes
        const gridSnap = this.desktopComponent.getAttribute('grid-snap') !== 'false';
        this.shadowRoot.getElementById('grid-snap').checked = gridSnap;

        const showIcons = this.desktopComponent.getAttribute('show-desktop-icons') !== 'false';
        this.shadowRoot.getElementById('show-desktop-icons').checked = showIcons;
    }

    setupEventListeners() {
        // Wallpaper selection
        this.shadowRoot.querySelectorAll('.wallpaper-option').forEach(option => {
            option.addEventListener('click', (e) => {
                this.logEventFlow("APP", e);
                const wallpaper = e.target.dataset.wallpaper;
                this.updateWallpaper(wallpaper);
            });
        });

        // Form controls
        this.shadowRoot.getElementById('dock-position').addEventListener('change', (e) => {
            this.logEventFlow("APP", e);
            if (this.desktopComponent) {
                this.desktopComponent.setAttribute('dock-position', e.target.value);
            }
        });

        this.shadowRoot.getElementById('grid-snap').addEventListener('change', (e) => {
            this.logEventFlow("APP", e);
            if (this.desktopComponent) {
                this.desktopComponent.setAttribute('grid-snap', e.target.checked);
            }
        });

        this.shadowRoot.getElementById('show-desktop-icons').addEventListener('change', (e) => {
            this.logEventFlow("APP", e);
            if (this.desktopComponent) {
                this.desktopComponent.setAttribute('show-desktop-icons', e.target.checked);
            }
        });
    }

    updateWallpaper(wallpaper) {
        if (this.desktopComponent) {
            this.desktopComponent.setAttribute('wallpaper', wallpaper);
        }
        this.shadowRoot.querySelectorAll('.wallpaper-option').forEach(option => {
            option.classList.toggle('selected', option.dataset.wallpaper === wallpaper);
        });
    }
}

customElements.define('sys-pref-desktop-panel', DesktopPanel);
