// Terminal Webapp Integration Tests
// Tests the terminal component with filesystem integration

import { TerminalWebapp } from './terminal-webapp.js';

export function runTerminalWebappTests() {
    describe('TerminalWebapp', () => {
        let terminal;
        let container;
        let setupComplete = false;

        beforeEach(async () => {
            console.log('🔧 Setting up terminal test...');

            // Create container for the terminal
            container = document.createElement('div');
            container.id = 'terminal-test-container-' + Date.now();
            document.body.appendChild(container);
            console.log('✅ Container created');

            // Create terminal instance with unique filesystem for isolation
            try {
                terminal = new TerminalWebapp();
                // Override filesystem with unique document name for test isolation
                const uniqueDocName = `terminal-test-${Date.now()}-${Math.random()}`;
                terminal.fileSystem = new (await import('/js/filesystem-provider.js')).FilesystemProvider(uniqueDocName, (await import('/js/filesystem-provider.js')).DEFAULT_FILESYSTEM_STRUCTURE);
                console.log('✅ Terminal instance created');
            } catch (error) {
                console.error('❌ Terminal constructor failed:', error);
                throw error;
            }

            container.appendChild(terminal);
            console.log('✅ Terminal appended to DOM');

            // Wait for component connectedCallback to complete
            await new Promise(resolve => {
                const checkReady = () => {
                    if (terminal.ready) {
                        resolve();
                    } else {
                        setTimeout(checkReady, 10);
                    }
                };
                checkReady();
            });
            setupComplete = true;
            console.log('✅ Terminal setup complete, terminal =', terminal);
        });

        afterEach(() => {
            if (terminal && terminal.fileSystem) {
                terminal.fileSystem.destroy();
            }
            if (container && container.parentNode) {
                container.parentNode.removeChild(container);
            }
        });

    test('should initialize with default filesystem', () => {
        if (!setupComplete) {
            throw new Error('Terminal setup not complete');
        }
        expect(terminal.currentPath).toBe('/Users/desktop');
        expect(terminal.fileSystem).toBeDefined();
    });

    test('should execute ls command', async () => {
        if (!setupComplete) {
            throw new Error('Terminal setup not complete');
        }
        await terminal.executeCommand('ls');

        // Check that output was added
        const output = terminal._root.getElementById('output');
        expect(output.children.length).toBeGreaterThan(0);

        // Check for expected directories in /Users/desktop
        const outputText = Array.from(output.children).map(child => child.textContent).join('\n');
        expect(outputText).toContain('Documents');
        expect(outputText).toContain('Downloads');
        expect(outputText).toContain('Desktop');
        expect(outputText).toContain('welcome.txt');
    });

    test('should change directory', async () => {
        if (!setupComplete) {
            throw new Error('Terminal setup not complete');
        }
        await terminal.executeCommand('cd Documents');

        expect(terminal.currentPath).toBe('/Users/desktop/Documents');
    });

    test('should create directory', async () => {
        if (!setupComplete) {
            throw new Error('Terminal setup not complete');
        }
        await terminal.executeCommand('mkdir testdir');

        // Verify directory was created
        const node = terminal.fileSystem.getNode('/Users/desktop/testdir');
        expect(node).toBeDefined();
        expect(node.type).toBe('directory');
    });

    test('should create file', async () => {
        if (!setupComplete) {
            throw new Error('Terminal setup not complete');
        }
        await terminal.executeCommand('touch testfile.txt');

        // Verify file was created
        const node = terminal.fileSystem.getNode('/Users/desktop/testfile.txt');
        expect(node).toBeDefined();
        expect(node.type).toBe('file');
    });

    test('should display file contents', async () => {
        if (!setupComplete) {
            throw new Error('Terminal setup not complete');
        }
        await terminal.executeCommand('touch testfile.txt Hello World');
        await terminal.executeCommand('cat testfile.txt');

        // Check output contains file content
        const output = terminal._root.getElementById('output');
        const outputText = Array.from(output.children).map(child => child.textContent).join('\n');
        expect(outputText).toContain('Hello World');
    });

    test('should remove file', async () => {
        if (!setupComplete) {
            throw new Error('Terminal setup not complete');
        }
        await terminal.executeCommand('touch testfile.txt');
        await terminal.executeCommand('rm testfile.txt');

        // Verify file was removed
        const node = terminal.fileSystem.getNode('/Users/desktop/testfile.txt');
        expect(node).toBeNull();
    });

    test('should handle command history', async () => {
        if (!setupComplete) {
            throw new Error('Terminal setup not complete');
        }
        terminal.commandHistory = [];
        await terminal.executeCommand('echo test1');
        await terminal.executeCommand('echo test2');
        await terminal.executeCommand('echo test3');

        expect(terminal.commandHistory).toEqual(['echo test1', 'echo test2', 'echo test3']);
    });

    test('should update prompt with current path', async () => {
        if (!setupComplete) {
            throw new Error('Terminal setup not complete');
        }
        await terminal.executeCommand('cd Documents');

        const prompt = terminal._root.getElementById('prompt');
        expect(prompt.textContent).toBe('desktop@terminal:/Users/desktop/Documents$');
    });

    test('should autocomplete commands', () => {
        if (!setupComplete) {
            throw new Error('Terminal setup not complete');
        }
        const input = terminal._root.getElementById('input');
        input.value = 'l';

        terminal.autoComplete(input);

        expect(input.value).toBe('ls ');
    });

    test('should autocomplete file names', () => {
        if (!setupComplete) {
            throw new Error('Terminal setup not complete');
        }
        terminal.executeCommand('touch testfile.txt');

        const input = terminal._root.getElementById('input');
        input.value = 'cat testf';

        terminal.autoComplete(input);

        expect(input.value).toBe('cat testfile.txt');
    });

    test('should show ls command output demonstrating runCommand', async () => {
        if (!setupComplete) {
            throw new Error('Terminal setup not complete');
        }
        // Create some test files and directories
        await terminal.executeCommand('mkdir testdir');
        await terminal.executeCommand('touch testfile1.txt');
        await terminal.executeCommand('touch testfile2.txt');

        // Execute ls command
        await terminal.executeCommand('ls');

        // Check the terminal output shows the command and results
        const output = terminal._root.getElementById('output');
        const outputLines = Array.from(output.children).map(child => child.textContent);

        // Should contain the command echo
        expect(outputLines.some(line => line.includes('ls'))).toBe(true);

        // Should contain the directory listing
        const outputText = outputLines.join('\n');
        expect(outputText).toContain('testdir');
        expect(outputText).toContain('testfile1.txt');
        expect(outputText).toContain('testfile2.txt');
        expect(outputText).toContain('Documents');
        expect(outputText).toContain('welcome.txt');
    });
  });
}