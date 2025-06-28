class TexteditWebapp extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        this.shadowRoot.innerHTML = `
            <div style="padding: 0; height: 100%; display: flex; flex-direction: column;">
                <div style="padding: 10px; border-bottom: 1px solid #ddd; background: #f6f6f6;">
                    <button style="margin-right: 8px;">Bold</button>
                    <button style="margin-right: 8px;">Italic</button>
                    <button style="margin-right: 8px;">Underline</button>
                </div>
                <textarea style="flex: 1; border: none; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, sans-serif; font-size: 14px; resize: none; outline: none;" placeholder="Start typing..."></textarea>
            </div>
        `;
    }
}

customElements.define('textedit-webapp', TexteditWebapp);