class SafariWebapp extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        this.shadowRoot.innerHTML = `
            <div style="padding: 0; height: 100%; display: flex; flex-direction: column;">
                <div style="padding: 10px; border-bottom: 1px solid #ddd; background: #f6f6f6; display: flex; align-items: center; gap: 10px;">
                    <button>←</button>
                    <button>→</button>
                    <input type="text" value="https://claude.ai" style="flex: 1; padding: 6px 12px; border: 1px solid #ddd; border-radius: 6px;">
                    <button>Go</button>
                </div>
                <div style="flex: 1; padding: 40px; text-align: center; color: #666;">
                    <h2>Welcome to Safari</h2>
                    <p>This is a demo web browser interface.</p>
                </div>
            </div>
        `;
    }
}

customElements.define('safari-webapp', SafariWebapp);