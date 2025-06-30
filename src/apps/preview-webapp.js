class PreviewWebapp extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.imageData = null;
    }

    connectedCallback() {
        this.render();
    }

    setImageData(imageData) {
        this.imageData = imageData;
        this.render();
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    width: 100%;
                    height: 100%;
                    background: #f5f5f5;
                    overflow: auto;
                }

                .preview-container {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    min-height: 100%;
                    padding: 20px;
                    box-sizing: border-box;
                }

                .image-wrapper {
                    max-width: 100%;
                    max-height: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: white;
                    border-radius: 8px;
                    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                    padding: 10px;
                }

                .preview-image {
                    max-width: 100%;
                    max-height: 100%;
                    object-fit: contain;
                    border-radius: 4px;
                }

                .placeholder {
                    text-align: center;
                    color: #666;
                    font-size: 16px;
                    padding: 40px;
                }

                .placeholder-icon {
                    font-size: 48px;
                    margin-bottom: 16px;
                    opacity: 0.5;
                }
            </style>
            
            <div class="preview-container">
                ${this.imageData ? `
                    <div class="image-wrapper">
                        <img class="preview-image" src="${this.imageData}" alt="Preview Image" />
                    </div>
                ` : `
                    <div class="placeholder">
                        <div class="placeholder-icon">🖼️</div>
                        <div>No image to preview</div>
                    </div>
                `}
            </div>
        `;
    }
}

customElements.define('preview-webapp', PreviewWebapp);