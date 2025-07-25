// import eventBus from '../../src/events/event-bus.js';
// import { MESSAGES } from '../../src/events/message-types.js';
// import { Terminal } from 'xterm';
// import { FitAddon } from 'xterm-addon-fit';
// import { WebLinksAddon } from 'xterm-addon-web-links';
// import { SearchAddon } from 'xterm-addon-search';
// import { SerializeAddon } from 'xterm-addon-serialize';
// import { Unicode11Addon } from 'xterm-addon-unicode11';
// import { Readline } from '../../vendor/xterm-readline/xterm-readline.js';
// import { COMMANDS } from '../../src/config.js';

class TerminalWebapp extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.commandHistory = [];
        this.historyIndex = -1;
        this.currentPath = '/Users/desktop';
        this.fileSystem = this.initializeFileSystem();
        this.desktopComponent = null;
    }

    connectedCallback() {
        this.desktopComponent = document.querySelector('desktop-component');
        this.render();
        this.setupEventListeners();
        this.focusInput();
        this.addWelcomeMessage();
    }

    initializeFileSystem() {
        return {
            '/': {
                type: 'directory',
                children: {
                    'Users': {
                        type: 'directory',
                        children: {
                            'desktop': {
                                type: 'directory',
                                children: {
                                    'Documents': { type: 'directory', children: {} },
                                    'Downloads': { type: 'directory', children: {} },
                                    'Desktop': { type: 'directory', children: {} },
                                    'welcome.txt': { type: 'file', content: 'Welcome to the virtual desktop terminal!' }
                                }
                            }
                        }
                    },
                    'Applications': {
                        type: 'directory',
                        children: {
                            'System Preferences.app': { type: 'file', content: 'system-preferences-webapp' },
                            'Safari.app': { type: 'file', content: 'safari-webapp' },
                            'TextEdit.app': { type: 'file', content: 'textedit-webapp' }
                        }
                    }
                }
            }
        };
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    height: 100%;
                    background: #1d1f21;
                    color: #c5c8c6;
                    font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
                    font-size: 12px;
                    line-height: 1.4;
                    overflow: hidden;
                }

                .terminal-container {
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                    padding: 16px;
                    box-sizing: border-box;
                }

                .terminal-output {
                    flex: 1;
                    overflow-y: auto;
                    margin-bottom: 16px;
                    white-space: pre-wrap;
                    word-wrap: break-word;
                }

                .terminal-line {
                    display: block;
                    margin: 0;
                    padding: 2px 0;
                }

                .terminal-prompt {
                    color: #81a2be;
                }

                .terminal-command {
                    color: #c5c8c6;
                }

                .terminal-error {
                    color: #cc6666;
                }

                .terminal-success {
                    color: #b5bd68;
                }

                .terminal-info {
                    color: #8abeb7;
                }

                .terminal-input-line {
                    display: flex;
                    align-items: center;
                    flex-shrink: 0;
                }

                .terminal-prompt-current {
                    color: #81a2be;
                    margin-right: 8px;
                    white-space: nowrap;
                }

                .terminal-input {
                    flex: 1;
                    background: transparent;
                    border: none;
                    color: #c5c8c6;
                    font-family: inherit;
                    font-size: inherit;
                    outline: none;
                    caret-color: #c5c8c6;
                }

                .cursor {
                    animation: blink 1s infinite;
                }

                @keyframes blink {
                    0%, 50% { opacity: 1; }
                    51%, 100% { opacity: 0; }
                }

                .terminal-output::-webkit-scrollbar {
                    width: 8px;
                }

                .terminal-output::-webkit-scrollbar-track {
                    background: #373b41;
                }

                .terminal-output::-webkit-scrollbar-thumb {
                    background: #555;
                    border-radius: 4px;
                }

                .terminal-output::-webkit-scrollbar-thumb:hover {
                    background: #777;
                }

                .file-list {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
                    gap: 8px;
                    margin: 8px 0;
                }

                .file-item {
                    color: #c5c8c6;
                }

                .file-item.directory {
                    color: #81a2be;
                    font-weight: bold;
                }

                .file-item.executable {
                    color: #b5bd68;
                }
            </style>

            <div class="terminal-container">
                <div class="terminal-output" id="output"></div>
                <div class="terminal-input-line">
                    <span class="terminal-prompt-current" id="prompt">desktop@terminal:${this.currentPath}$</span>
                    <input type="text" class="terminal-input" id="input" autocomplete="off" spellcheck="false">
                </div>
            </div>
        `;
    }

    setupEventListeners() {
        const input = this.shadowRoot.getElementById('input');
        
        input.addEventListener('keydown', (e) => {
            switch (e.key) {
                case 'Enter':
                    e.preventDefault();
                    this.executeCommand(input.value.trim());
                    input.value = '';
                    break;
                    
                case 'ArrowUp':
                    e.preventDefault();
                    if (this.historyIndex < this.commandHistory.length - 1) {
                        this.historyIndex++;
                        input.value = this.commandHistory[this.commandHistory.length - 1 - this.historyIndex] || '';
                    }
                    break;
                    
                case 'ArrowDown':
                    e.preventDefault();
                    if (this.historyIndex > 0) {
                        this.historyIndex--;
                        input.value = this.commandHistory[this.commandHistory.length - 1 - this.historyIndex] || '';
                    } else if (this.historyIndex === 0) {
                        this.historyIndex = -1;
                        input.value = '';
                    }
                    break;
                    
                case 'Tab':
                    e.preventDefault();
                    this.autoComplete(input);
                    break;
            }
        });
    }

    focusInput() {
        const input = this.shadowRoot.getElementById('input');
        input.focus();
    }

    addWelcomeMessage() {
        this.addOutput('Virtual Desktop Terminal v1.0', 'terminal-info');
        this.addOutput('Type "help" for available commands.', 'terminal-info');
        this.addOutput('');
    }

    executeCommand(command) {
        if (!command) return;

        // Add to history
        if (this.commandHistory[this.commandHistory.length - 1] !== command) {
            this.commandHistory.push(command);
        }
        this.historyIndex = -1;

        // Display command
        this.addOutput(`${this.getPrompt()} ${command}`, 'terminal-command');

        // Parse and execute
        const [cmd, ...args] = command.split(/\s+/);
        
        try {
            this.runCommand(cmd.toLowerCase(), args);
        } catch (error) {
            this.addOutput(`Error: ${error.message}`, 'terminal-error');
        }

        this.updatePrompt();
        this.scrollToBottom();
    }

    runCommand(cmd, args) {
        switch (cmd) {
            case 'help':
                this.showHelp();
                break;
                
            case 'ls':
                this.listDirectory(args);
                break;
                
            case 'cd':
                this.changeDirectory(args[0] || '/Users/desktop');
                break;
                
            case 'pwd':
                this.addOutput(this.currentPath);
                break;
                
            case 'mkdir':
                this.makeDirectory(args[0]);
                break;
                
            case 'touch':
                this.createFile(args[0], args.slice(1).join(' '));
                break;
                
            case 'rm':
                this.removeItem(args[0]);
                break;
                
            case 'cat':
                this.displayFile(args[0]);
                break;
                
            case 'clear':
                this.clearOutput();
                break;
                
            case 'desktop':
                this.desktopCommand(args);
                break;
                
            case 'open':
                this.openApplication(args[0]);
                break;
                
            case 'ps':
                this.listProcesses();
                break;
                
            case 'kill':
                this.killProcess(args[0]);
                break;
                
            case 'echo':
                this.addOutput(args.join(' '));
                break;
                
            case 'whoami':
                this.addOutput('desktop');
                break;
                
            case 'date':
                this.addOutput(new Date().toString());
                break;
                
            default:
                this.addOutput(`Command not found: ${cmd}. Type "help" for available commands.`, 'terminal-error');
        }
    }

    showHelp() {
        const commands = [
            'File System Commands:',
            '  ls [path]          - List directory contents',
            '  cd <path>          - Change directory',
            '  pwd                - Print working directory',
            '  mkdir <name>       - Create directory',
            '  touch <name>       - Create file',
            '  rm <name>          - Remove file or directory',
            '  cat <file>         - Display file contents',
            '',
            'Desktop Commands:',
            '  desktop set wallpaper <name>     - Change wallpaper (gradient|monterey|big-sur)',
            '  desktop set dock-position <pos>  - Change dock position (bottom|left|right)',
            '  desktop set grid-snap <bool>     - Toggle grid snap (true|false)',
            '  desktop get <setting>            - Get current setting value',
            '',
            'Application Commands:',
            '  open <app>         - Launch application',
            '  ps                 - List running processes',
            '  kill <app>         - Close application',
            '',
            'Utility Commands:',
            '  clear              - Clear terminal',
            '  echo <text>        - Display text',
            '  whoami             - Display current user',
            '  date               - Display current date',
            '  help               - Show this help message'
        ];
        
        commands.forEach(line => this.addOutput(line, 'terminal-info'));
    }

    listDirectory(args) {
        const path = args[0] || this.currentPath;
        const node = this.getFileSystemNode(path);
        
        if (!node) {
            this.addOutput(`ls: ${path}: No such file or directory`, 'terminal-error');
            return;
        }
        
        if (node.type === 'file') {
            this.addOutput(path.split('/').pop());
            return;
        }
        
        const items = Object.entries(node.children || {});
        if (items.length === 0) {
            this.addOutput('(empty directory)', 'terminal-info');
            return;
        }
        
        items.forEach(([name, item]) => {
            const className = item.type === 'directory' ? 'directory' : 
                           name.endsWith('.app') ? 'executable' : '';
            this.addOutput(name, className);
        });
    }

    changeDirectory(path) {
        if (!path) {
            this.currentPath = '/Users/desktop';
            return;
        }
        
        const newPath = this.resolvePath(path);
        const node = this.getFileSystemNode(newPath);
        
        if (!node) {
            this.addOutput(`cd: ${path}: No such file or directory`, 'terminal-error');
            return;
        }
        
        if (node.type !== 'directory') {
            this.addOutput(`cd: ${path}: Not a directory`, 'terminal-error');
            return;
        }
        
        this.currentPath = newPath;
    }

    makeDirectory(name) {
        if (!name) {
            this.addOutput('mkdir: missing directory name', 'terminal-error');
            return;
        }
        
        const currentNode = this.getFileSystemNode(this.currentPath);
        if (currentNode && currentNode.children) {
            if (currentNode.children[name]) {
                this.addOutput(`mkdir: ${name}: File exists`, 'terminal-error');
                return;
            }
            
            currentNode.children[name] = { type: 'directory', children: {} };
            this.addOutput(`Directory created: ${name}`, 'terminal-success');
        }
    }

    createFile(name, content = '') {
        if (!name) {
            this.addOutput('touch: missing file name', 'terminal-error');
            return;
        }
        
        const currentNode = this.getFileSystemNode(this.currentPath);
        if (currentNode && currentNode.children) {
            currentNode.children[name] = { type: 'file', content };
            this.addOutput(`File created: ${name}`, 'terminal-success');
        }
    }

    removeItem(name) {
        if (!name) {
            this.addOutput('rm: missing file or directory name', 'terminal-error');
            return;
        }
        
        const currentNode = this.getFileSystemNode(this.currentPath);
        if (currentNode && currentNode.children && currentNode.children[name]) {
            delete currentNode.children[name];
            this.addOutput(`Removed: ${name}`, 'terminal-success');
        } else {
            this.addOutput(`rm: ${name}: No such file or directory`, 'terminal-error');
        }
    }

    displayFile(name) {
        if (!name) {
            this.addOutput('cat: missing file name', 'terminal-error');
            return;
        }
        
        const currentNode = this.getFileSystemNode(this.currentPath);
        if (currentNode && currentNode.children && currentNode.children[name]) {
            const file = currentNode.children[name];
            if (file.type === 'file') {
                this.addOutput(file.content || '(empty file)');
            } else {
                this.addOutput(`cat: ${name}: Is a directory`, 'terminal-error');
            }
        } else {
            this.addOutput(`cat: ${name}: No such file or directory`, 'terminal-error');
        }
    }

    desktopCommand(args) {
        if (args.length < 2) {
            this.addOutput('Usage: desktop <action> <setting> [value]', 'terminal-error');
            this.addOutput('Actions: set, get', 'terminal-info');
            return;
        }
        
        const [action, setting, ...values] = args;
        const value = values.join(' ');
        
        if (action === 'set') {
            this.setDesktopSetting(setting, value);
        } else if (action === 'get') {
            this.getDesktopSetting(setting);
        } else {
            this.addOutput(`Unknown action: ${action}`, 'terminal-error');
        }
    }

    setDesktopSetting(setting, value) {
        if (!this.desktopComponent) {
            this.addOutput('Desktop component not found', 'terminal-error');
            return;
        }
        
        switch (setting) {
            case 'wallpaper':
                if (['gradient', 'monterey', 'big-sur'].includes(value)) {
                    this.desktopComponent.setAttribute('wallpaper', value);
                    this.addOutput(`Wallpaper set to: ${value}`, 'terminal-success');
                } else {
                    this.addOutput('Invalid wallpaper. Options: gradient, monterey, big-sur', 'terminal-error');
                }
                break;
                
            case 'dock-position':
                if (['bottom', 'left', 'right'].includes(value)) {
                    this.desktopComponent.setAttribute('dock-position', value);
                    this.addOutput(`Dock position set to: ${value}`, 'terminal-success');
                } else {
                    this.addOutput('Invalid dock position. Options: bottom, left, right', 'terminal-error');
                }
                break;
                
            case 'grid-snap':
                if (['true', 'false'].includes(value)) {
                    this.desktopComponent.setAttribute('grid-snap', value);
                    this.addOutput(`Grid snap set to: ${value}`, 'terminal-success');
                } else {
                    this.addOutput('Invalid value. Options: true, false', 'terminal-error');
                }
                break;
                
            case 'accent-color':
                this.desktopComponent.setAttribute('accent-color', value);
                this.addOutput(`Accent color set to: ${value}`, 'terminal-success');
                break;
                
            default:
                this.addOutput(`Unknown setting: ${setting}`, 'terminal-error');
        }
    }

    getDesktopSetting(setting) {
        if (!this.desktopComponent) {
            this.addOutput('Desktop component not found', 'terminal-error');
            return;
        }
        
        const value = this.desktopComponent.getAttribute(setting);
        if (value !== null) {
            this.addOutput(`${setting}: ${value}`);
        } else {
            this.addOutput(`Setting not found: ${setting}`, 'terminal-error');
        }
    }

    openApplication(appName) {
        if (!appName) {
            this.addOutput('open: missing application name', 'terminal-error');
            return;
        }
        
        // Dispatch event to launch app via EventBus
        eventBus.publish(MESSAGES.LAUNCH_APP, { id: appName });
        this.addOutput(`Launching: ${appName}`, 'terminal-success');
    }

    listProcesses() {
        // Get all window components as running processes
        const windows = document.querySelectorAll('window-component');
        if (windows.length === 0) {
            this.addOutput('No running processes', 'terminal-info');
            return;
        }
        
        this.addOutput('PID  Name', 'terminal-info');
        windows.forEach((window, index) => {
            const appName = window.getAttribute('app-name') || 'Unknown';
            this.addOutput(`${index + 1}    ${appName}`);
        });
    }

    killProcess(processName) {
        if (!processName) {
            this.addOutput('kill: missing process name', 'terminal-error');
            return;
        }
        
        // Find and close the window
        const windows = document.querySelectorAll('window-component');
        let found = false;
        
        windows.forEach(window => {
            const appName = window.getAttribute('app-name');
            if (appName && appName.toLowerCase().includes(processName.toLowerCase())) {
                window.remove();
                found = true;
                this.addOutput(`Process killed: ${appName}`, 'terminal-success');
            }
        });
        
        if (!found) {
            this.addOutput(`Process not found: ${processName}`, 'terminal-error');
        }
    }

    autoComplete(input) {
        const value = input.value;
        const [cmd, ...args] = value.split(/\s+/);
        
        if (args.length === 0) {
            // Complete command names
            const commands = ['help', 'ls', 'cd', 'pwd', 'mkdir', 'touch', 'rm', 'cat', 'clear', 'desktop', 'open', 'ps', 'kill', 'echo', 'whoami', 'date'];
            const matches = commands.filter(c => c.startsWith(cmd));
            
            if (matches.length === 1) {
                input.value = matches[0] + ' ';
            }
        } else {
            // Complete file/directory names
            const currentNode = this.getFileSystemNode(this.currentPath);
            if (currentNode && currentNode.children) {
                const lastArg = args[args.length - 1];
                const matches = Object.keys(currentNode.children).filter(name => 
                    name.startsWith(lastArg)
                );
                
                if (matches.length === 1) {
                    const newArgs = [...args.slice(0, -1), matches[0]];
                    input.value = cmd + ' ' + newArgs.join(' ');
                }
            }
        }
    }

    // Utility methods
    resolvePath(path) {
        if (path.startsWith('/')) {
            return path;
        }
        
        if (path === '..') {
            const parts = this.currentPath.split('/').filter(p => p);
            parts.pop();
            return '/' + parts.join('/');
        }
        
        if (path === '.') {
            return this.currentPath;
        }
        
        return this.currentPath + (this.currentPath.endsWith('/') ? '' : '/') + path;
    }

    getFileSystemNode(path) {
        const parts = path.split('/').filter(p => p);
        let current = this.fileSystem['/'];
        
        for (const part of parts) {
            if (current && current.children && current.children[part]) {
                current = current.children[part];
            } else {
                return null;
            }
        }
        
        return current;
    }

    getPrompt() {
        return `desktop@terminal:${this.currentPath}$`;
    }

    updatePrompt() {
        const prompt = this.shadowRoot.getElementById('prompt');
        if (prompt) {
            prompt.textContent = this.getPrompt();
        }
    }

    addOutput(text, className = '') {
        const output = this.shadowRoot.getElementById('output');
        const line = document.createElement('div');
        line.className = `terminal-line ${className}`;
        line.textContent = text;
        output.appendChild(line);
    }

    clearOutput() {
        const output = this.shadowRoot.getElementById('output');
        output.innerHTML = '';
    }

    scrollToBottom() {
        const output = this.shadowRoot.getElementById('output');
        output.scrollTop = output.scrollHeight;
    }
}

customElements.define('terminal-webapp', TerminalWebapp);