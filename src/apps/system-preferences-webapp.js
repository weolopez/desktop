class SystemPreferencesWebapp extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        this.shadowRoot.innerHTML = `
            <div style="padding: 20px; height: 100%; background: #f6f6f6;">
                <h2>System Preferences</h2>
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 20px; margin-top: 20px;">
                    <div style="text-align: center; cursor: pointer; padding: 15px; background: white; border-radius: 8px;">
                        <div style="font-size: 32px;">🖥️</div>
                        <div style="margin-top: 8px; font-size: 12px;">Displays</div>
                    </div>
                    <div style="text-align: center; cursor: pointer; padding: 15px; background: white; border-radius: 8px;">
                        <div style="font-size: 32px;">🔊</div>
                        <div style="margin-top: 8px; font-size: 12px;">Sound</div>
                    </div>
                    <div style="text-align: center; cursor: pointer; padding: 15px; background: white; border-radius: 8px;">
                        <div style="font-size: 32px;">⌨️</div>
                        <div style="margin-top: 8px; font-size: 12px;">Keyboard</div>
                    </div>
                    <div style="text-align: center; cursor: pointer; padding: 15px; background: white; border-radius: 8px;">
                        <div style="font-size: 32px;">🖱️</div>
                        <div style="margin-top: 8px; font-size: 12px;">Mouse</div>
                    </div>
                    <div style="text-align: center; cursor: pointer; padding: 15px; background: white; border-radius: 8px;">
                        <div style="font-size: 32px;">🌐</div>
                        <div style="margin-top: 8px; font-size: 12px;">Network</div>
                    </div>
                    <div style="text-align: center; cursor: pointer; padding: 15px; background: white; border-radius: 8px;">
                        <div style="font-size: 32px;">🔒</div>
                        <div style="margin-top: 8px; font-size: 12px;">Security</div>
                    </div>
                </div>
            </div>
        `;
    }
}

customElements.define('system-preferences-webapp', SystemPreferencesWebapp);