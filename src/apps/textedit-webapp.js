import "https://weolopez.com/chat/chat-component.js"
class TexteditWebapp extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        this.shadowRoot.innerHTML = `
            <chat-component></chat-component>
        `;
    }
}

customElements.define('textedit-webapp', TexteditWebapp);
