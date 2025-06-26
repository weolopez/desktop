class FinderWebapp extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        this.shadowRoot.innerHTML = `
            <div style="padding: 20px; height: 100%; background: #f6f6f6;">
                <h2>Finder</h2>
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 20px; margin-top: 20px;">
                    <div style="text-align: center; cursor: pointer;">
                        <div style="font-size: 48px;">📁</div>
                        <div>Documents</div>
                    </div>
                    <div style="text-align: center; cursor: pointer;">
                        <div style="font-size: 48px;">📁</div>
                        <div>Downloads</div>
                    </div>
                    <div style="text-align: center; cursor: pointer;">
                        <div style="font-size: 48px;">📁</div>
                        <div>Desktop</div>
                    </div>
                    <div style="text-align: center; cursor: pointer;">
                        <div style="font-size: 48px;">🖼️</div>
                        <div>Pictures</div>
                    </div>
                </div>
            </div>
        `;
    }
}

customElements.define('finder-webapp', FinderWebapp);