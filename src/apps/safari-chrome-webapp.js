class SafariChromeWebapp extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.sessionId = null;
        this.currentUrl = '';
        this.isLoading = false;
    }

    connectedCallback() {
        this.render();
        this.setupEventListeners();
        this.initializeSession();
    }

    disconnectedCallback() {
        this.closeSession();
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    height: 100%;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                }
                
                .browser-container {
                    display: flex;
                    flex-direction: column;
                    height: 100%;
                    background: white;
                }
                
                .toolbar {
                    padding: 8px 12px;
                    border-bottom: 1px solid #e0e0e0;
                    background: #f8f8f8;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    min-height: 44px;
                }
                
                .nav-button {
                    width: 32px;
                    height: 32px;
                    border: 1px solid #ccc;
                    background: white;
                    border-radius: 4px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 16px;
                    transition: background-color 0.2s;
                }
                
                .nav-button:hover:not(:disabled) {
                    background: #f0f0f0;
                }
                
                .nav-button:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }
                
                .address-bar {
                    flex: 1;
                    padding: 8px 12px;
                    border: 1px solid #ccc;
                    border-radius: 6px;
                    font-size: 14px;
                    outline: none;
                }
                
                .address-bar:focus {
                    border-color: #007AFF;
                    box-shadow: 0 0 0 2px rgba(0, 122, 255, 0.2);
                }
                
                .go-button {
                    padding: 8px 16px;
                    background: #007AFF;
                    color: white;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: 500;
                }
                
                .go-button:hover {
                    background: #0056CC;
                }
                
                .go-button:disabled {
                    background: #ccc;
                    cursor: not-allowed;
                }
                
                .content-area {
                    flex: 1;
                    position: relative;
                    overflow: hidden;
                    background: #f5f5f5;
                }
                
                .loading-indicator {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 3px;
                    background: #007AFF;
                    transform: translateX(-100%);
                    transition: transform 0.3s ease;
                    z-index: 10;
                }
                
                .loading-indicator.active {
                    animation: loading 1.5s infinite;
                }
                
                @keyframes loading {
                    0% { transform: translateX(-100%); }
                    50% { transform: translateX(0%); }
                    100% { transform: translateX(100%); }
                }
                
                .screenshot-container {
                    width: 100%;
                    height: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    overflow: hidden;
                }
                
                .screenshot {
                    max-width: 100%;
                    max-height: 100%;
                    object-fit: contain;
                    cursor: pointer;
                }
                
                .welcome-screen {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    height: 100%;
                    text-align: center;
                    color: #666;
                    background: #fafafa;
                }
                
                .welcome-screen h2 {
                    margin: 0 0 16px 0;
                    font-size: 24px;
                    font-weight: 300;
                }
                
                .welcome-screen p {
                    margin: 0 0 24px 0;
                    font-size: 16px;
                }
                
                .quick-links {
                    display: flex;
                    gap: 16px;
                    flex-wrap: wrap;
                }
                
                .quick-link {
                    padding: 8px 16px;
                    background: white;
                    border: 1px solid #ddd;
                    border-radius: 6px;
                    text-decoration: none;
                    color: #007AFF;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                
                .quick-link:hover {
                    background: #f0f8ff;
                    border-color: #007AFF;
                }
                
                .error-screen {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    height: 100%;
                    text-align: center;
                    color: #d32f2f;
                    background: #fafafa;
                    padding: 20px;
                }
                
                .error-screen h3 {
                    margin: 0 0 16px 0;
                    font-size: 20px;
                }
                
                .error-screen p {
                    margin: 0;
                    font-size: 14px;
                    max-width: 400px;
                }
                
                .status-bar {
                    padding: 4px 12px;
                    background: #f0f0f0;
                    border-top: 1px solid #e0e0e0;
                    font-size: 12px;
                    color: #666;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                
                .chrome-badge {
                    background: #4285f4;
                    color: white;
                    padding: 2px 6px;
                    border-radius: 3px;
                    font-size: 10px;
                    font-weight: bold;
                }
            </style>
            
            <div class="browser-container">
                <div class="toolbar">
                    <button class="nav-button" id="back-btn" title="Back">←</button>
                    <button class="nav-button" id="forward-btn" title="Forward">→</button>
                    <button class="nav-button" id="refresh-btn" title="Refresh">⟳</button>
                    <input type="text" class="address-bar" id="address-bar" placeholder="Enter URL or search term">
                    <button class="go-button" id="go-btn">Go</button>
                </div>
                
                <div class="content-area">
                    <div class="loading-indicator" id="loading-indicator"></div>
                    <div class="welcome-screen" id="welcome-screen">
                        <h2>Safari with Chrome Engine</h2>
                        <p>Powered by headless Chrome for full website compatibility</p>
                        <div class="quick-links">
                            <a class="quick-link" data-url="https://example.com">Example.com</a>
                            <a class="quick-link" data-url="https://github.com">GitHub</a>
                            <a class="quick-link" data-url="https://stackoverflow.com">Stack Overflow</a>
                            <a class="quick-link" data-url="https://news.ycombinator.com">Hacker News</a>
                        </div>
                    </div>
                    <div class="screenshot-container" id="screenshot-container" style="display: none;">
                        <img class="screenshot" id="screenshot" alt="Website screenshot">
                    </div>
                    <div class="error-screen" id="error-screen" style="display: none;">
                        <h3>Unable to load page</h3>
                        <p id="error-message">There was a problem loading this page.</p>
                    </div>
                </div>
                
                <div class="status-bar">
                    <span id="status-text">Ready</span>
                    <span class="chrome-badge">CHROME</span>
                </div>
            </div>
        `;
    }

    setupEventListeners() {
        const backBtn = this.shadowRoot.getElementById('back-btn');
        const forwardBtn = this.shadowRoot.getElementById('forward-btn');
        const refreshBtn = this.shadowRoot.getElementById('refresh-btn');
        const addressBar = this.shadowRoot.getElementById('address-bar');
        const goBtn = this.shadowRoot.getElementById('go-btn');
        const quickLinks = this.shadowRoot.querySelectorAll('.quick-link');
        const screenshot = this.shadowRoot.getElementById('screenshot');

        backBtn.addEventListener('click', () => this.goBack());
        forwardBtn.addEventListener('click', () => this.goForward());
        refreshBtn.addEventListener('click', () => this.refresh());
        goBtn.addEventListener('click', () => this.navigate());
        
        addressBar.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.navigate();
            }
        });

        addressBar.addEventListener('focus', (e) => {
            setTimeout(() => {
                e.target.select();
            }, 0);
        });

        quickLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const url = link.getAttribute('data-url');
                this.loadUrl(url);
            });
        });

        // Handle clicks on screenshot
        screenshot.addEventListener('click', (e) => {
            if (!this.sessionId) return;
            
            const rect = screenshot.getBoundingClientRect();
            const scaleX = 1200 / rect.width; // Chrome viewport width / displayed width
            const scaleY = 800 / rect.height;  // Chrome viewport height / displayed height
            
            const x = (e.clientX - rect.left) * scaleX;
            const y = (e.clientY - rect.top) * scaleY;
            
            this.clickAt(x, y);
        });
    }

    async initializeSession() {
        try {
            this.updateStatus('Initializing Chrome session...');
            const response = await fetch('/api/chrome/new-session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            
            if (!response.ok) {
                throw new Error('Failed to create Chrome session');
            }
            
            const data = await response.json();
            this.sessionId = data.sessionId;
            this.updateStatus('Ready');
            console.log('Chrome session initialized:', this.sessionId);
        } catch (error) {
            console.error('Failed to initialize Chrome session:', error);
            this.showError('Failed to initialize Chrome browser. Please make sure the Chrome server is running.');
        }
    }

    async closeSession() {
        if (this.sessionId) {
            try {
                await fetch('/api/chrome/close-session', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ sessionId: this.sessionId })
                });
            } catch (error) {
                console.error('Error closing session:', error);
            }
        }
    }

    navigate() {
        const addressBar = this.shadowRoot.getElementById('address-bar');
        let url = addressBar.value.trim();
        
        if (!url) return;
        
        this.loadUrl(url);
    }

    async loadUrl(url) {
        if (this.isLoading || !this.sessionId) return;
        
        this.isLoading = true;
        this.showLoading(true);
        this.updateStatus('Loading...');
        
        const addressBar = this.shadowRoot.getElementById('address-bar');
        addressBar.value = url;
        
        try {
            const response = await fetch('/api/chrome/navigate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId: this.sessionId, url })
            });
            
            if (!response.ok) {
                throw new Error('Navigation failed');
            }
            
            const data = await response.json();
            this.displayPage(data);
            this.currentUrl = data.url;
            addressBar.value = data.url;
            this.updateStatus(`Loaded: ${data.title || data.url}`);
            
        } catch (error) {
            console.error('Failed to load URL:', error);
            this.showError(error.message);
            this.updateStatus('Error loading page');
        } finally {
            this.isLoading = false;
            this.showLoading(false);
        }
    }

    async goBack() {
        if (!this.sessionId || this.isLoading) return;
        
        this.isLoading = true;
        this.showLoading(true);
        this.updateStatus('Going back...');
        
        try {
            const response = await fetch('/api/chrome/back', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId: this.sessionId })
            });
            
            if (response.ok) {
                const data = await response.json();
                this.displayPage(data);
                this.currentUrl = data.url;
                const addressBar = this.shadowRoot.getElementById('address-bar');
                addressBar.value = data.url;
                this.updateStatus(`Loaded: ${data.title || data.url}`);
            }
        } catch (error) {
            console.error('Back navigation failed:', error);
            this.updateStatus('Back navigation failed');
        } finally {
            this.isLoading = false;
            this.showLoading(false);
        }
    }

    async goForward() {
        if (!this.sessionId || this.isLoading) return;
        
        this.isLoading = true;
        this.showLoading(true);
        this.updateStatus('Going forward...');
        
        try {
            const response = await fetch('/api/chrome/forward', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId: this.sessionId })
            });
            
            if (response.ok) {
                const data = await response.json();
                this.displayPage(data);
                this.currentUrl = data.url;
                const addressBar = this.shadowRoot.getElementById('address-bar');
                addressBar.value = data.url;
                this.updateStatus(`Loaded: ${data.title || data.url}`);
            }
        } catch (error) {
            console.error('Forward navigation failed:', error);
            this.updateStatus('Forward navigation failed');
        } finally {
            this.isLoading = false;
            this.showLoading(false);
        }
    }

    async refresh() {
        if (!this.sessionId || this.isLoading) return;
        
        this.isLoading = true;
        this.showLoading(true);
        this.updateStatus('Refreshing...');
        
        try {
            const response = await fetch('/api/chrome/refresh', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId: this.sessionId })
            });
            
            if (response.ok) {
                const data = await response.json();
                this.displayPage(data);
                this.updateStatus(`Refreshed: ${data.title || data.url}`);
            }
        } catch (error) {
            console.error('Refresh failed:', error);
            this.updateStatus('Refresh failed');
        } finally {
            this.isLoading = false;
            this.showLoading(false);
        }
    }

    async clickAt(x, y) {
        if (!this.sessionId || this.isLoading) return;
        
        this.updateStatus('Processing click...');
        
        try {
            const response = await fetch('/api/chrome/click', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId: this.sessionId, x, y })
            });
            
            if (response.ok) {
                const data = await response.json();
                this.displayPage(data);
                this.currentUrl = data.url;
                const addressBar = this.shadowRoot.getElementById('address-bar');
                addressBar.value = data.url;
                this.updateStatus(`Loaded: ${data.title || data.url}`);
            }
        } catch (error) {
            console.error('Click failed:', error);
            this.updateStatus('Click failed');
        }
    }

    displayPage(data) {
        const welcomeScreen = this.shadowRoot.getElementById('welcome-screen');
        const screenshotContainer = this.shadowRoot.getElementById('screenshot-container');
        const errorScreen = this.shadowRoot.getElementById('error-screen');
        const screenshot = this.shadowRoot.getElementById('screenshot');
        
        welcomeScreen.style.display = 'none';
        errorScreen.style.display = 'none';
        screenshotContainer.style.display = 'flex';
        
        screenshot.src = data.screenshot;
    }

    showLoading(show) {
        const loadingIndicator = this.shadowRoot.getElementById('loading-indicator');
        if (show) {
            loadingIndicator.classList.add('active');
        } else {
            loadingIndicator.classList.remove('active');
        }
    }

    showError(message) {
        const welcomeScreen = this.shadowRoot.getElementById('welcome-screen');
        const screenshotContainer = this.shadowRoot.getElementById('screenshot-container');
        const errorScreen = this.shadowRoot.getElementById('error-screen');
        const errorMessage = this.shadowRoot.getElementById('error-message');
        
        errorMessage.textContent = message;
        
        welcomeScreen.style.display = 'none';
        screenshotContainer.style.display = 'none';
        errorScreen.style.display = 'flex';
    }

    updateStatus(text) {
        const statusText = this.shadowRoot.getElementById('status-text');
        statusText.textContent = text;
    }
}

customElements.define('safari-chrome-webapp', SafariChromeWebapp);