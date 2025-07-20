import "https://weolopez.com/chat/chat-component.js"

class TexteditWebapp extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.fileContent = null;
    }

    connectedCallback() {
        this.render();
        this.handleInitialState();
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: flex;
                    flex-direction: column;
                    height: 100%;
                    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
                }
                .file-header {
                    background: #f5f5f5;
                    border-bottom: 1px solid #ddd;
                    padding: 10px 15px;
                    font-size: 12px;
                    color: #666;
                    display: none; /* Hidden by default, shown when file is loaded */
                }
                .file-header.visible {
                    display: block;
                }
                .file-info {
                    font-weight: 500;
                    color: #333;
                }
                .content-area {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                }
                .text-editor {
                    flex: 1;
                    padding: 15px;
                    border: none;
                    outline: none;
                    font-family: 'SF Mono', 'Monaco', 'Cascadia Code', monospace;
                    font-size: 13px;
                    line-height: 1.5;
                    resize: none;
                    background: white;
                }
                .chat-container {
                    flex: 1;
                }
            </style>
            
            <div class="file-header" id="fileHeader">
                <div class="file-info" id="fileInfo">No file loaded</div>
                <div id="fileDetails"></div>
            </div>
            
            <div class="content-area">
                <textarea class="text-editor" id="textEditor" placeholder="Open a file from Finder or start typing..."></textarea>
                <div class="chat-container" id="chatContainer" style="display: none;">
                    <chat-component></chat-component>
                </div>
            </div>
        `;
    }

    handleInitialState() {
        // Check if we received file content from the app launcher
        const windowElement = this.closest('we-window-component');
        if (windowElement && windowElement.initialState && windowElement.initialState.fileContent) {
            this.loadFileContent(windowElement.initialState.fileContent);
        }
    }

    loadFileContent(fileData) {
        console.log('📄 TextEdit: Loading file content:', fileData);
        
        this.fileContent = fileData;
        
        const fileHeader = this.shadowRoot.getElementById('fileHeader');
        const fileInfo = this.shadowRoot.getElementById('fileInfo');
        const fileDetails = this.shadowRoot.getElementById('fileDetails');
        const textEditor = this.shadowRoot.getElementById('textEditor');
        
        // Show file header with info
        fileHeader.classList.add('visible');
        fileInfo.textContent = `📄 ${fileData.name}`;
        fileDetails.innerHTML = `
            <div>Path: ${fileData.path}</div>
            <div>Type: ${fileData.mimeType} (${fileData.category})</div>
            <div>Size: ${this.formatBytes(fileData.size)} • Encoding: ${fileData.encoding}</div>
        `;
        
        // Load content into text editor
        if (fileData.content) {
            textEditor.value = fileData.content;
            textEditor.placeholder = '';
        } else {
            textEditor.placeholder = 'File content could not be loaded';
        }
        
        // For code files, we could add syntax highlighting here in the future
        if (this.isCodeFile(fileData.extension)) {
            textEditor.style.fontFamily = "'SF Mono', 'Monaco', 'Cascadia Code', monospace";
        }
    }

    formatBytes(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }

    isCodeFile(extension) {
        const codeExtensions = ['.js', '.html', '.css', '.json', '.xml', '.yaml', '.yml'];
        return codeExtensions.includes(extension.toLowerCase());
    }
}

customElements.define('textedit-webapp', TexteditWebapp);
