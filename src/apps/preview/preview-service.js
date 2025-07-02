export class PreviewService {
    constructor(shadowRoot) {
        this.shadowRoot = shadowRoot;
    }

    async launchPreview(imageData) {
        // Create a new window for the Preview app
        const window = document.createElement('window-component');
        window.setAttribute('app-name', 'Preview');
        window.setAttribute('app-icon', '🖼️');
        window.setAttribute('x', 150 + (Math.random() * 200));
        window.setAttribute('y', 150 + (Math.random() * 100));
        window.setAttribute('width', '800');
        window.setAttribute('height', '600');
        
        // Load the preview webapp component
        await this.loadPreviewComponent(window, imageData);
        
        // Add to desktop
        const desktopContent = this.shadowRoot.querySelector('.desktop-content');
        desktopContent.appendChild(window);
        
        // Update menu bar
        const menuBar = this.shadowRoot.querySelector('menu-bar-component');
        if (menuBar) {
            menuBar.setActiveApp('Preview');
        }
    }

    async loadPreviewComponent(windowElement, imageData) {
        try {
            // Import the preview webapp component dynamically
            await import('./preview-webapp.js');
            
            // Create and append the preview component
            const previewComponent = document.createElement('preview-webapp');
            windowElement.appendChild(previewComponent);
            
            // Set the image data after the component is added to DOM
            setTimeout(() => {
                previewComponent.setImageData(imageData);
            }, 0);
        } catch (error) {
            console.warn('Failed to load preview component:', error);
            // Fallback to placeholder content
            windowElement.innerHTML = `
                <div style="padding: 40px; text-align: center; color: #666;">
                    <h2>Preview</h2>
                    <p>Failed to load image preview.</p>
                </div>
            `;
        }
    }
}