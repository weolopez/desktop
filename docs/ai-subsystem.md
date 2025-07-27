# AI Subsystem Documentation

WE-OS includes a comprehensive AI subsystem that provides local AI capabilities through multiple integrated components, enabling desktop applications to integrate intelligent features without external dependencies.

## Subsystem Overview

### Architecture Components
The AI subsystem consists of four main integrated components:

1. **WebLLM Service** (`src/services/webllm-service.js`) - Core AI engine with Web Worker processing
2. **Chat Component** (`weolopez.github.io/chat-component/`) - Standalone AI chat interface with knowledge integration
3. **Spotlight Component** (`weolopez.github.io/apps/spotlight/`) - System-wide AI search and assistance
4. **Knowledge System** - Resume data, project information, and contextual information management

### Integration Architecture
```
WE-OS AI Subsystem
├── WebLLM Service (Core Engine)
│   ├── Web Worker Processing (webllm-worker-component.js)
│   ├── Chat Worker (chat-worker.js)
│   ├── Model Management (Multiple AI Models)
│   └── Event Integration (WE-OS Event System)
├── Chat Component (User Interface)
│   ├── Chat UI Component (chat-component.js)
│   ├── Chat UI Interface (chat-ui-component.js)
│   ├── Knowledge Integration (resume, website data)
│   └── Memory Management (persistent conversations)
├── Spotlight Integration (Global Access)
│   ├── Global Search (Cmd+K shortcut)
│   ├── AI Assistant Interface
│   └── System-wide AI Features
└── Knowledge Base
    ├── Resume Data Integration
    ├── Project Information
    ├── Website Context
    ├── Documentation Knowledge (docs/ directory)
    └── Memory Manager (lib/memory-manager.js)
```

### Key Features
- **Local AI Inference**: Runs AI models entirely in the browser with WebLLM
- **Web Worker Architecture**: Background processing without blocking the UI
- **Event-Driven Integration**: Seamless integration with WE-OS event system
- **Knowledge-Aware AI**: Contextual responses using resume, project data, and complete WE-OS documentation
- **Multiple Interfaces**: Chat component, Spotlight search, and API integration
- **Persistent Memory**: Cross-session conversation and context management
- **Multi-Model Support**: Support for different AI models with performance optimization

## WebLLM Service (Core Engine)

### Service Configuration
```javascript
// config.json
{
    "name": "WebLLMService",
    "path": "./webllm-service.js",
    "required": false,
    "priority": 3,
    "enabled": true,
    "fallbackGraceful": true,
    "config": {
        "workerPath": "../chat-component/chat-worker.js",
        "defaultModel": "Qwen2.5-0.5B-Instruct-q0f16-MLC",
        "autoInitialize": false,
        "serviceVersion": "1.0.0"
    }
}
```

### Supported Models
```javascript
"supportedModels": [
    {
        "id": "Qwen2.5-0.5B-Instruct-q0f16-MLC",
        "name": "Qwen 0.5B (Fast)",
        "size": "small",
        "use_case": "chat, quick responses"
    },
    {
        "id": "DeepSeek-R1-Distill-Qwen-7B-q4f16_1-MLC", 
        "name": "DeepSeek 7B (Smart)",
        "size": "large",
        "use_case": "analysis, complex reasoning"
    }
]
```

### Service Initialization
```javascript
// Check for service availability
document.addEventListener(MESSAGES.WEBLLM_SERVICE_READY, (event) => {
    const { serviceVersion, supportedModels, capabilities } = event.detail;
    console.log('AI subsystem available:', serviceVersion);
    enableAIFeatures();
});

// Initialize with specific model
document.dispatchEvent(new CustomEvent(MESSAGES.WEBLLM_INITIALIZE_REQUEST, {
    detail: {
        modelId: 'Qwen2.5-0.5B-Instruct-q0f16-MLC',
        config: {
            temperature: 0.7,
            maxTokens: 1024
        }
    }
}));
```

### AI Generation API
```javascript
// Generate AI response
document.dispatchEvent(new CustomEvent(MESSAGES.WEBLLM_GENERATE_REQUEST, {
    detail: {
        messages: [
            { role: 'user', content: 'Hello, how are you?' }
        ],
        conversationId: `conversation-${Date.now()}`,
        options: {
            temperature: 0.7,
            maxTokens: 1024,
            stream: true
        }
    }
}));

// Handle streaming responses
document.addEventListener(MESSAGES.WEBLLM_RESPONSE_CHUNK, (event) => {
    const { text, delta, conversationId } = event.detail;
    updateStreamingResponse(text);
});

// Handle complete responses
document.addEventListener(MESSAGES.WEBLLM_RESPONSE_COMPLETE, (event) => {
    const { message, conversationId } = event.detail;
    finalizeResponse(message.content);
});
```

## Chat Component Integration

### Component Architecture
The chat component provides a complete AI chat interface with knowledge integration:

**Core Components:**
- **chat-component.js** - Main web component with chat interface
- **chat-ui-component.js** - UI component for chat display
- **webllm-worker-component.js** - Web Worker for AI processing
- **chat-worker.js** - Background worker for model management

### Chat Component Features
- **Native Web Component**: No framework dependencies, runs anywhere
- **WebLLM Integration**: Direct browser-based AI processing
- **Knowledge Integration**: Contextual responses using resume and project data
- **Themeable Interface**: Customizable colors and styling
- **Responsive Design**: Mobile and desktop compatibility
- **Persistent History**: localStorage-based conversation management

### Usage Integration
```html
<!-- Embed chat component in WE-OS application -->
<chat-component 
  brand="WE-OS Assistant" 
  primary-color="#00A9E0" 
  accent-color="#FF7F32">
</chat-component>
```

### Chat Component API
```javascript
// Custom attributes
const chatComponent = document.querySelector('chat-component');
chatComponent.setAttribute('brand', 'My Application');
chatComponent.setAttribute('primary-color', '#4285f4');
chatComponent.setAttribute('border-radius', '12px');

// Programmatic interaction
chatComponent.sendMessage('Hello, how can you help me?');
chatComponent.clearHistory();
chatComponent.loadKnowledgeBase(knowledgeData);
```

### Knowledge System Integration
The chat component integrates with a sophisticated knowledge base:

```javascript
// Knowledge structure from chat-component/knowledge/
knowledge/
├── chat-component.md     // Component documentation
├── projects.md          // Project information
├── resume.json         // Resume data
├── website.md          // Website information
├── index.json          // Knowledge index
└── example.md          // Usage examples
```

### Memory Management
```javascript
// From lib/memory-manager.js pattern
class AIMemoryManager {
    constructor() {
        this.conversations = new Map();
        this.knowledgeBase = new Map();
        this.contextWindow = 4096; // tokens
    }

    saveConversation(conversationId, messages) {
        localStorage.setItem(`ai-conversation-${conversationId}`, 
            JSON.stringify(messages));
    }

    loadConversation(conversationId) {
        const stored = localStorage.getItem(`ai-conversation-${conversationId}`);
        return stored ? JSON.parse(stored) : [];
    }

    addKnowledge(key, data) {
        this.knowledgeBase.set(key, data);
    }

    getContextualPrompt(userMessage, conversationId) {
        const history = this.loadConversation(conversationId);
        const relevantKnowledge = this.findRelevantKnowledge(userMessage);
        
        return {
            system: `You are a helpful AI assistant with access to knowledge about the user's projects and experience. ${relevantKnowledge}`,
            messages: [...history, { role: 'user', content: userMessage }]
        };
    }
}
```

## Spotlight Integration

### Global AI Search
Spotlight provides system-wide AI assistance through a global search interface:

**File:** `/weolopez.github.io/apps/spotlight/spotlight-component.js`

### Features
- **Global Shortcut**: Cmd+K to access from anywhere in WE-OS
- **AI-Powered Search**: Natural language queries processed by AI
- **Glassmorphism UI**: Modern interface with backdrop blur effects
- **Event Integration**: Connected to WE-OS event system and WebLLM service
- **Contextual Responses**: Leverages AI subsystem for intelligent answers

### Usage
```javascript
// Spotlight automatically integrates with WebLLM service
class SpotlightComponent extends HTMLElement {
    setupEventListeners() {
        // Listen for AI responses
        eventBus.subscribe(MESSAGES.WEBLLM_RESPONSE_COMPLETE, (payload) => {
            if (payload.message) {
                this.displayResponse(payload.message.content);
            }
        });
    }

    handleSubmit(event) {
        const query = this.shadowRoot.querySelector('#search-input').value;
        
        // Send to AI subsystem
        eventBus.publish(MESSAGES.WEBLLM_GENERATE_REQUEST, {
            messages: [{ role: 'user', content: query }],
            conversationId: this.conversationId,
            options: {
                temperature: 0.7,
                maxTokens: 512,
                stream: false
            }
        });
    }
}
```

### Keyboard Integration
```javascript
// Global keyboard handling
document.addEventListener('keydown', (event) => {
    // Cmd+K or Ctrl+K to open Spotlight
    if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        openSpotlight();
    }
    
    // Escape to close
    if (event.key === 'Escape' && spotlightVisible) {
        closeSpotlight();
    }
});
```

## Application Integration Patterns

### 1. Chat Application Integration
```javascript
class ChatWebApp extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.conversationId = `chat-${Date.now()}`;
        this.aiMemory = new AIMemoryManager();
    }

    connectedCallback() {
        this.render();
        this.setupAIIntegration();
        this.loadKnowledgeBase();
    }

    setupAIIntegration() {
        // Check AI subsystem availability
        document.addEventListener(MESSAGES.WEBLLM_SERVICE_READY, () => {
            this.enableAIFeatures();
        });

        // Handle AI responses
        document.addEventListener(MESSAGES.WEBLLM_RESPONSE_CHUNK, (event) => {
            if (event.detail.conversationId === this.conversationId) {
                this.updateStreamingResponse(event.detail.text);
            }
        });

        document.addEventListener(MESSAGES.WEBLLM_RESPONSE_COMPLETE, (event) => {
            if (event.detail.conversationId === this.conversationId) {
                this.finalizeResponse(event.detail.message);
                this.aiMemory.saveConversation(this.conversationId, this.messages);
            }
        });
    }

    async sendMessage(userMessage) {
        // Add to conversation
        this.messages.push({ role: 'user', content: userMessage });
        
        // Get contextual prompt with knowledge
        const contextualData = this.aiMemory.getContextualPrompt(
            userMessage, 
            this.conversationId
        );

        // Request AI response with context and docs knowledge
        document.dispatchEvent(new CustomEvent(MESSAGES.WEBLLM_GENERATE_REQUEST, {
            detail: {
                messages: contextualData.messages,
                conversationId: this.conversationId,
                options: {
                    temperature: 0.7,
                    maxTokens: 1024,
                    stream: true,
                    useDocsKnowledge: true,  // Enable docs knowledge integration
                    maxDocsFiles: 3,         // Limit relevant docs
                    maxDocsContent: 2000     // Limit content length
                }
            }
        }));
    }
}
```

### 2. Smart Text Editor Integration
```javascript
class SmartTextEditor extends HTMLElement {
    async processWithAI(text, task) {
        const prompts = {
            summarize: `Summarize this text concisely:\n\n${text}`,
            proofread: `Proofread and improve this text:\n\n${text}`,
            translate: `Translate this text to Spanish:\n\n${text}`,
            analyze: `Analyze the sentiment and key themes:\n\n${text}`
        };

        return new Promise((resolve, reject) => {
            const requestId = `editor-${Date.now()}`;
            
            const handleComplete = (event) => {
                if (event.detail.conversationId === requestId) {
                    cleanup();
                    resolve(event.detail.message.content);
                }
            };

            const handleError = (event) => {
                if (event.detail.conversationId === requestId) {
                    cleanup();
                    reject(new Error(event.detail.error));
                }
            };

            const cleanup = () => {
                document.removeEventListener(MESSAGES.WEBLLM_RESPONSE_COMPLETE, handleComplete);
                document.removeEventListener(MESSAGES.WEBLLM_GENERATION_ERROR, handleError);
            };

            document.addEventListener(MESSAGES.WEBLLM_RESPONSE_COMPLETE, handleComplete);
            document.addEventListener(MESSAGES.WEBLLM_GENERATION_ERROR, handleError);

            document.dispatchEvent(new CustomEvent(MESSAGES.WEBLLM_GENERATE_REQUEST, {
                detail: {
                    messages: [{ role: 'user', content: prompts[task] }],
                    conversationId: requestId,
                    options: {
                        temperature: 0.3, // Lower for text processing
                        maxTokens: 2048,
                        stream: false
                    }
                }
            }));
        });
    }
}
```

### 3. AI-Enhanced Terminal
```javascript
class AITerminal extends HTMLElement {
    constructor() {
        super();
        this.aiAssistant = new TerminalAIAssistant();
    }

    async handleCommand(command) {
        // Regular command processing
        const result = await this.executeCommand(command);
        
        // If command failed, ask AI for help
        if (result.exitCode !== 0) {
            const aiSuggestion = await this.aiAssistant.suggestFix(command, result.error);
            this.displayAISuggestion(aiSuggestion);
        }
        
        return result;
    }

    async explainCommand(command) {
        const explanation = await this.aiAssistant.explainCommand(command);
        this.displayExplanation(explanation);
    }
}

class TerminalAIAssistant {
    async suggestFix(command, error) {
        const prompt = `The terminal command "${command}" failed with error: ${error}. Suggest a corrected command and explain the issue.`;
        
        return this.requestAIResponse(prompt, {
            temperature: 0.3,
            maxTokens: 512
        });
    }

    async explainCommand(command) {
        const prompt = `Explain what this terminal command does: ${command}`;
        
        return this.requestAIResponse(prompt, {
            temperature: 0.2,
            maxTokens: 256
        });
    }
}
```

## Knowledge Base Integration

### Complete Documentation Knowledge
The AI subsystem automatically loads all documentation from the `docs/` directory, providing comprehensive knowledge about WE-OS architecture, APIs, and development patterns:

**Loaded Documentation Files:**
- `README.md` - WE-OS documentation index and overview
- `WE-OS-Architecture.md` - Complete system architecture
- `ai-subsystem.md` - AI subsystem integration (self-referential)
- `application-guide.md` - Application development patterns
- `component-reference.md` - Core component APIs
- `configuration-reference.md` - System configuration
- `dynamic-component-system-integration.md` - Dynamic loading system
- `event-system-api.md` - Complete event API reference
- `notification-system.md` - Notification service
- `startup-optimization.md` - Startup system design
- `REQUIREMENTS.md` - Project requirements

### Knowledge Structure
The AI subsystem includes a comprehensive knowledge base for contextual responses:

```javascript
// Knowledge base structure
const knowledgeBase = {
    system: {
        documentation: './docs/',          // Complete WE-OS documentation
        architecture: './docs/WE-OS-Architecture.md',
        apis: './docs/event-system-api.md',
        components: './docs/component-reference.md',
        configuration: './docs/configuration-reference.md'
    },
    personal: {
        resume: './knowledge/resume.json',
        projects: './knowledge/projects.md',
        skills: './knowledge/skills.json'
    },
    technical: {
        components: './knowledge/chat-component.md',
        examples: './knowledge/example.md',
        chatKnowledge: './knowledge/'
    },
    context: {
        website: './knowledge/website.md',
        brand: 'Mauricio Lopez',
        domain: 'AI/ML, Web Development, System Architecture'
    }
};
```

### Automatic Documentation Loading
The AI subsystem includes a dedicated `DocsKnowledgeLoader` that automatically loads all documentation files from the `docs/` directory:

```javascript
// Documentation knowledge loader
import { docsKnowledgeLoader } from './docs-knowledge-loader.js';

// Automatic loading during service initialization
class WebLLMService {
    async initialize() {
        // ... other initialization
        
        // Load documentation knowledge base
        await this.loadDocsKnowledge();
        
        // Service ready with full knowledge
    }
    
    async loadDocsKnowledge() {
        const knowledge = await docsKnowledgeLoader.loadDocsKnowledge();
        const stats = docsKnowledgeLoader.getKnowledgeStats();
        
        console.log(`Loaded ${stats.fileCount} documentation files`);
        console.log(`Total ${stats.totalWords} words of documentation`);
    }
    
    // Enhance user queries with relevant documentation
    async enhanceWithDocsKnowledge(messages, options = {}) {
        const userMessage = messages.find(msg => msg.role === 'user')?.content || '';
        
        // Check if query is system-related
        if (this.isSystemRelatedQuery(userMessage)) {
            // Get contextual prompt with relevant docs
            const contextualPrompt = docsKnowledgeLoader.getContextualPrompt(userMessage);
            
            // Update user message with documentation context
            const enhancedMessages = [...messages];
            const userIndex = enhancedMessages.findLastIndex(msg => msg.role === 'user');
            enhancedMessages[userIndex].content = contextualPrompt;
            
            return enhancedMessages;
        }
        
        return messages;
    }
}
```

### Smart Context Integration
The system intelligently determines when to include documentation context:

```javascript
// Keywords that trigger docs knowledge integration
const systemKeywords = [
    // WE-OS specific
    'weos', 'we-os', 'desktop', 'component', 'service', 'application',
    
    // Development terms
    'api', 'event', 'message', 'integration', 'development', 'build',
    
    // Architecture terms
    'architecture', 'system', 'startup', 'configuration', 'window',
    
    // Web technologies
    'web component', 'shadow dom', 'javascript', 'worker', 'module',
    
    // Generic help terms
    'how', 'what', 'explain', 'help', 'guide', 'documentation'
];

// Examples of queries that will use docs knowledge:
// ✅ "How do I create a web component in WE-OS?"
// ✅ "What is the event system API?"
// ✅ "Explain the startup configuration"
// ✅ "How does the AI subsystem work?"
// ❌ "What's the weather like?" (no docs context needed)
```

### Knowledge Statistics and Management
```javascript
// Get documentation knowledge statistics
const stats = docsKnowledgeLoader.getKnowledgeStats();
console.log(stats);
// Output:
{
    loaded: true,
    fileCount: 11,
    totalWords: 45000,
    lastLoadTime: 1640995200000,
    summary: {
        categories: {
            architecture: ['WE-OS-Architecture.md', 'component-reference.md'],
            development: ['application-guide.md', 'event-system-api.md'],
            services: ['ai-subsystem.md', 'notification-system.md']
        }
    },
    availableFiles: ['README.md', 'WE-OS-Architecture.md', ...]
}

// Search for specific documentation
const relevantDocs = docsKnowledgeLoader.findRelevantDocs('web components', 3);
console.log(relevantDocs);
// Returns top 3 most relevant documentation files

// Refresh documentation (reload all files)
await docsKnowledgeLoader.refreshKnowledge();
```

### Chat Knowledge Loading (External)
```javascript
class KnowledgeLoader {
    constructor() {
        this.knowledgeCache = new Map();
    }

    async loadKnowledgeBase() {
        try {
            // Load structured knowledge files
            const resume = await this.loadJSON('./knowledge/resume.json');
            const projects = await this.loadMarkdown('./knowledge/projects.md');
            const website = await this.loadMarkdown('./knowledge/website.md');
            
            // Cache for quick access
            this.knowledgeCache.set('resume', resume);
            this.knowledgeCache.set('projects', projects);
            this.knowledgeCache.set('website', website);
            
            return {
                personal: resume,
                projects: projects,
                website: website
            };
        } catch (error) {
            console.warn('Failed to load knowledge base:', error);
            return {};
        }
    }

    getContextualPrompt(userQuery, knowledge) {
        // Extract relevant knowledge based on query
        const relevantInfo = this.extractRelevantKnowledge(userQuery, knowledge);
        
        return `You are an AI assistant with knowledge about Mauricio Lopez's work and projects. 
Context: ${relevantInfo}

User query: ${userQuery}

Provide a helpful response using the context when relevant.`;
    }

    extractRelevantKnowledge(query, knowledge) {
        // Simple keyword matching - could be enhanced with embeddings
        const keywords = query.toLowerCase().split(/\s+/);
        let relevantInfo = '';

        // Check against resume data
        if (knowledge.resume) {
            for (const keyword of keywords) {
                if (JSON.stringify(knowledge.resume).toLowerCase().includes(keyword)) {
                    relevantInfo += `Resume info related to ${keyword}. `;
                }
            }
        }

        // Check against project data
        if (knowledge.projects && keywords.some(k => ['project', 'work', 'build', 'create'].includes(k))) {
            relevantInfo += `Project information: ${knowledge.projects.substring(0, 500)}...`;
        }

        return relevantInfo;
    }
}
```

## Configuration and Optimization

### Model Selection Strategy
```javascript
class ModelManager {
    selectOptimalModel(taskType, priority = 'balanced') {
        const modelProfiles = {
            'fast': {
                id: 'Qwen2.5-0.5B-Instruct-q0f16-MLC',
                use_cases: ['chat', 'quick-response', 'real-time'],
                performance: 'high',
                quality: 'good'
            },
            'smart': {
                id: 'DeepSeek-R1-Distill-Qwen-7B-q4f16_1-MLC',
                use_cases: ['analysis', 'reasoning', 'complex-tasks'],
                performance: 'medium',
                quality: 'excellent'
            }
        };

        // Selection logic based on task requirements
        switch (taskType) {
            case 'chat':
            case 'spotlight':
            case 'quick-help':
                return priority === 'speed' ? modelProfiles.fast : modelProfiles.smart;
            
            case 'analysis':
            case 'code-review':
            case 'complex-reasoning':
                return modelProfiles.smart;
            
            case 'real-time':
            case 'streaming':
                return modelProfiles.fast;
            
            default:
                return modelProfiles.fast; // Default to fast model
        }
    }
}
```

### Performance Configuration Presets
```javascript
const AI_CONFIG_PRESETS = {
    // Fast chat responses
    chat: {
        temperature: 0.7,
        maxTokens: 512,
        stream: true,
        model: 'fast'
    },
    
    // High-quality analysis
    analysis: {
        temperature: 0.3,
        maxTokens: 2048,
        stream: false,
        model: 'smart'
    },
    
    // Creative writing
    creative: {
        temperature: 0.9,
        maxTokens: 1024,
        stream: true,
        model: 'smart'
    },
    
    // Code assistance
    code: {
        temperature: 0.2,
        maxTokens: 1536,
        stream: false,
        model: 'smart'
    },
    
    // Quick help/search
    search: {
        temperature: 0.5,
        maxTokens: 256,
        stream: false,
        model: 'fast'
    }
};
```

### Feature Configuration
```javascript
// config.json AI subsystem configuration
{
    "features": {
        "ai": {
            "enabled": true,
            "autoInitialize": false,
            "defaultModel": "Qwen2.5-0.5B-Instruct-q0f16-MLC",
            "fallbackModel": "Qwen2.5-0.5B-Instruct-q0f16-MLC",
            "enableKnowledge": true,
            "enableDocsKnowledge": true,
            "enableMemory": true,
            "maxConversationHistory": 50,
            "knowledgeUpdateInterval": 3600000,
            "docsKnowledge": {
                "autoLoad": true,
                "maxFiles": 3,
                "maxContentLength": 2000,
                "refreshInterval": 300000,
                "smartFiltering": true
            },
            "performance": {
                "maxConcurrentRequests": 3,
                "requestTimeout": 30000,
                "retryAttempts": 2
            }
        },
        "spotlight": {
            "enabled": true,
            "globalShortcut": "Cmd+K",
            "aiIntegration": true,
            "maxResults": 10
        },
        "chatComponent": {
            "enabled": true,
            "defaultTheme": "system",
            "persistHistory": true,
            "knowledgeIntegration": true
        }
    }
}
```

## Error Handling and Fallbacks

### Graceful Degradation
```javascript
class AISubsystem {
    constructor() {
        this.fallbackMode = false;
        this.setupFallbacks();
    }

    setupFallbacks() {
        // Handle service unavailability
        document.addEventListener(MESSAGES.WEBLLM_SERVICE_UNAVAILABLE, () => {
            this.enableFallbackMode();
        });

        // Handle model loading failures
        document.addEventListener(MESSAGES.WEBLLM_INIT_ERROR, (event) => {
            this.handleModelFailure(event.detail);
        });
    }

    enableFallbackMode() {
        this.fallbackMode = true;
        
        // Disable AI features gracefully
        this.disableAIComponents();
        
        // Show user notification
        this.showFallbackNotification();
        
        // Enable basic functionality without AI
        this.enableBasicFeatures();
    }

    async processWithFallback(input, taskType) {
        if (this.fallbackMode) {
            return this.basicProcessing(input, taskType);
        }

        try {
            return await this.processWithAI(input, taskType);
        } catch (error) {
            console.warn('AI processing failed, using fallback:', error);
            return this.basicProcessing(input, taskType);
        }
    }

    basicProcessing(input, taskType) {
        // Provide basic functionality without AI
        switch (taskType) {
            case 'search':
                return this.basicSearch(input);
            case 'help':
                return this.staticHelp(input);
            case 'summarize':
                return this.basicSummary(input);
            default:
                return `Processed: ${input} (AI unavailable)`;
        }
    }
}
```

### Retry Logic and Error Recovery
```javascript
class RobustAIIntegration {
    constructor() {
        this.retryConfig = {
            maxRetries: 3,
            baseDelay: 1000,
            maxDelay: 10000,
            backoffFactor: 2
        };
    }

    async generateWithRetry(messages, options = {}) {
        return new Promise((resolve, reject) => {
            let retryCount = 0;

            const attempt = () => {
                const requestId = `retry-${Date.now()}-${retryCount}`;
                const delay = Math.min(
                    this.retryConfig.baseDelay * Math.pow(this.retryConfig.backoffFactor, retryCount),
                    this.retryConfig.maxDelay
                );

                const handleSuccess = (event) => {
                    if (event.detail.conversationId === requestId) {
                        cleanup();
                        resolve(event.detail.message.content);
                    }
                };

                const handleError = (event) => {
                    if (event.detail.conversationId === requestId) {
                        cleanup();
                        
                        if (retryCount < this.retryConfig.maxRetries) {
                            retryCount++;
                            console.log(`AI request failed, retrying (${retryCount}/${this.retryConfig.maxRetries}) in ${delay}ms`);
                            setTimeout(attempt, delay);
                        } else {
                            reject(new Error(`AI generation failed after ${this.retryConfig.maxRetries} retries: ${event.detail.error}`));
                        }
                    }
                };

                const cleanup = () => {
                    document.removeEventListener(MESSAGES.WEBLLM_RESPONSE_COMPLETE, handleSuccess);
                    document.removeEventListener(MESSAGES.WEBLLM_GENERATION_ERROR, handleError);
                };

                document.addEventListener(MESSAGES.WEBLLM_RESPONSE_COMPLETE, handleSuccess);
                document.addEventListener(MESSAGES.WEBLLM_GENERATION_ERROR, handleError);

                document.dispatchEvent(new CustomEvent(MESSAGES.WEBLLM_GENERATE_REQUEST, {
                    detail: {
                        messages: messages,
                        conversationId: requestId,
                        options: options
                    }
                }));
            };

            attempt();
        });
    }
}
```

## Development Guide

### Building AI-Enabled Applications

#### 1. Basic AI Integration
```javascript
class MyAIApp extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.aiEnabled = false;
        this.setupAIIntegration();
    }

    setupAIIntegration() {
        // Wait for AI subsystem
        document.addEventListener(MESSAGES.WEBLLM_SERVICE_READY, () => {
            this.aiEnabled = true;
            this.onAIReady();
        });

        // Handle unavailability
        document.addEventListener(MESSAGES.WEBLLM_SERVICE_UNAVAILABLE, () => {
            this.onAIUnavailable();
        });
    }

    onAIReady() {
        // Enable AI features in your app
        this.enableAIFeatures();
        this.showAIStatus('AI assistant ready');
    }

    onAIUnavailable() {
        // Disable AI features gracefully
        this.disableAIFeatures();
        this.showAIStatus('AI assistant unavailable');
    }

    async askAI(prompt, config = {}) {
        if (!this.aiEnabled) {
            throw new Error('AI subsystem not available');
        }

        const options = {
            temperature: 0.7,
            maxTokens: 1024,
            stream: false,
            ...config
        };

        return new Promise((resolve, reject) => {
            const requestId = `app-${Date.now()}`;

            const handleResponse = (event) => {
                if (event.detail.conversationId === requestId) {
                    cleanup();
                    resolve(event.detail.message.content);
                }
            };

            const handleError = (event) => {
                if (event.detail.conversationId === requestId) {
                    cleanup();
                    reject(new Error(event.detail.error));
                }
            };

            const cleanup = () => {
                document.removeEventListener(MESSAGES.WEBLLM_RESPONSE_COMPLETE, handleResponse);
                document.removeEventListener(MESSAGES.WEBLLM_GENERATION_ERROR, handleError);
            };

            document.addEventListener(MESSAGES.WEBLLM_RESPONSE_COMPLETE, handleResponse);
            document.addEventListener(MESSAGES.WEBLLM_GENERATION_ERROR, handleError);

            document.dispatchEvent(new CustomEvent(MESSAGES.WEBLLM_GENERATE_REQUEST, {
                detail: {
                    messages: [{ role: 'user', content: prompt }],
                    conversationId: requestId,
                    options: options
                }
            }));
        });
    }
}
```

#### 2. Streaming Response Handling
```javascript
class StreamingAIApp extends HTMLElement {
    async askAIStreaming(prompt, onChunk, onComplete) {
        const requestId = `stream-${Date.now()}`;
        let fullResponse = '';

        const handleChunk = (event) => {
            if (event.detail.conversationId === requestId) {
                fullResponse = event.detail.text;
                onChunk(event.detail.delta, fullResponse);
            }
        };

        const handleComplete = (event) => {
            if (event.detail.conversationId === requestId) {
                cleanup();
                onComplete(event.detail.message.content);
            }
        };

        const handleError = (event) => {
            if (event.detail.conversationId === requestId) {
                cleanup();
                throw new Error(event.detail.error);
            }
        };

        const cleanup = () => {
            document.removeEventListener(MESSAGES.WEBLLM_RESPONSE_CHUNK, handleChunk);
            document.removeEventListener(MESSAGES.WEBLLM_RESPONSE_COMPLETE, handleComplete);
            document.removeEventListener(MESSAGES.WEBLLM_GENERATION_ERROR, handleError);
        };

        document.addEventListener(MESSAGES.WEBLLM_RESPONSE_CHUNK, handleChunk);
        document.addEventListener(MESSAGES.WEBLLM_RESPONSE_COMPLETE, handleComplete);
        document.addEventListener(MESSAGES.WEBLLM_GENERATION_ERROR, handleError);

        document.dispatchEvent(new CustomEvent(MESSAGES.WEBLLM_GENERATE_REQUEST, {
            detail: {
                messages: [{ role: 'user', content: prompt }],
                conversationId: requestId,
                options: {
                    temperature: 0.7,
                    maxTokens: 1024,
                    stream: true
                }
            }
        }));
    }

    // Usage example
    async demonstrateStreaming() {
        await this.askAIStreaming(
            'Tell me about artificial intelligence',
            (delta, fullText) => {
                // Update UI with each chunk
                this.updateResponseDisplay(fullText);
            },
            (finalResponse) => {
                // Finalize the response
                this.finalizeResponse(finalResponse);
            }
        );
    }
}
```

#### 3. Knowledge-Aware Applications
```javascript
class KnowledgeAwareApp extends HTMLElement {
    constructor() {
        super();
        this.knowledgeLoader = new KnowledgeLoader();
        this.knowledge = null;
    }

    async connectedCallback() {
        // Load knowledge base
        this.knowledge = await this.knowledgeLoader.loadKnowledgeBase();
        this.setupAIWithKnowledge();
    }

    async askWithContext(userQuery) {
        const contextualPrompt = this.createContextualPrompt(userQuery);
        
        return this.askAI(contextualPrompt, {
            temperature: 0.7,
            maxTokens: 1024
        });
    }

    createContextualPrompt(userQuery) {
        const relevantKnowledge = this.findRelevantKnowledge(userQuery);
        
        return `You are an AI assistant with access to specific knowledge about the user.

Available context:
${relevantKnowledge}

User query: ${userQuery}

Please provide a helpful response using the context when relevant.`;
    }

    findRelevantKnowledge(query) {
        if (!this.knowledge) return '';

        let context = '';
        const queryLower = query.toLowerCase();

        // Check for project-related queries
        if (queryLower.includes('project') || queryLower.includes('work')) {
            context += `Projects: ${this.knowledge.projects}\n\n`;
        }

        // Check for personal/resume queries
        if (queryLower.includes('experience') || queryLower.includes('skill')) {
            context += `Professional background: ${JSON.stringify(this.knowledge.personal, null, 2)}\n\n`;
        }

        return context;
    }
}
```

## Best Practices

### 1. Initialization and Availability
- Always check for AI subsystem availability before using features
- Handle initialization failures gracefully with meaningful fallbacks
- Monitor service status changes and update UI accordingly
- Provide clear feedback about AI availability to users

### 2. Performance Optimization
- Choose appropriate models for different tasks (fast vs. smart)
- Use streaming for interactive applications like chat
- Implement proper conversation management to avoid memory bloat
- Cache responses when appropriate to reduce API calls

### 3. User Experience
- Show loading indicators during AI processing
- Implement progressive loading for better perceived performance
- Provide cancel functionality for long-running requests
- Handle errors gracefully with user-friendly messages

### 4. Knowledge Integration
- Keep knowledge base current and relevant
- Implement smart context selection to avoid token limits
- Use structured knowledge formats for better processing
- Provide fallbacks when knowledge is unavailable

### 5. Error Handling and Resilience
- Implement retry logic with exponential backoff
- Provide meaningful error messages to users
- Have fallback functionality when AI is completely unavailable
- Monitor AI subsystem health and performance

### 6. Security and Privacy
- All processing happens locally in the browser
- No external API calls or data transmission
- Knowledge base and conversations stored locally
- User data never leaves the browser environment

## Event Reference

### Core AI Events
```javascript
// Service lifecycle
MESSAGES.WEBLLM_SERVICE_READY          // AI subsystem available
MESSAGES.WEBLLM_SERVICE_UNAVAILABLE    // AI subsystem not available
MESSAGES.WEBLLM_STATUS_CHANGED         // Service status update

// Model management
MESSAGES.WEBLLM_INITIALIZE_REQUEST     // Request model initialization
MESSAGES.WEBLLM_INIT_START             // Initialization started
MESSAGES.WEBLLM_INIT_PROGRESS          // Initialization progress
MESSAGES.WEBLLM_INIT_COMPLETE          // Initialization complete
MESSAGES.WEBLLM_INIT_ERROR             // Initialization failed
MESSAGES.WEBLLM_MODEL_CHANGED          // Model switched

// Generation
MESSAGES.WEBLLM_GENERATE_REQUEST       // Request AI generation
MESSAGES.WEBLLM_GENERATION_START       // Generation started
MESSAGES.WEBLLM_RESPONSE_CHUNK         // Streaming response chunk
MESSAGES.WEBLLM_RESPONSE_COMPLETE      // Complete response
MESSAGES.WEBLLM_GENERATION_ERROR       // Generation failed

// Service management
MESSAGES.WEBLLM_WARNING                // Service warning
MESSAGES.WEBLLM_WORKER_TERMINATED      // Worker terminated
MESSAGES.WEBLLM_TERMINATE_REQUEST      // Request termination
```

## Documentation Knowledge in Action

### Example: WE-OS Development Assistant
With the docs knowledge integration, the AI assistant can now provide comprehensive help about WE-OS development:

```javascript
// User asks: "How do I create a new web component in WE-OS?"
// System automatically:
// 1. Detects this is a system-related query
// 2. Loads relevant documentation (component-reference.md, application-guide.md)
// 3. Enhances the prompt with contextual information
// 4. AI responds with accurate, documentation-based guidance

// Example enhanced prompt sent to AI:
`You are an AI assistant with comprehensive knowledge about WE-OS, a web-based operating system.

WE-OS Overview:
- A sophisticated web-based operating system built with vanilla HTML, CSS, and JavaScript
- Uses Web Components architecture with Shadow DOM
- Features configurable startup system, AI integration, window management, and virtual file system
- No build process required - runs directly in browser

Relevant Documentation:
**component-reference.md** (relevance: 3):
Component Reference - Core component documentation and APIs
Content excerpt: WE-OS is built using a component-based architecture with core components handling different aspects of the desktop environment...

**application-guide.md** (relevance: 2):  
Application Guide - Building applications using existing patterns
Content excerpt: This guide provides comprehensive patterns and examples for building applications in WE-OS...

Available Documentation Categories:
- architecture: WE-OS-Architecture.md, component-reference.md, startup-optimization.md
- development: application-guide.md, event-system-api.md, dynamic-component-system-integration.md
- services: ai-subsystem.md, notification-system.md

User Question: How do I create a new web component in WE-OS?

Please provide a helpful and accurate response based on the WE-OS documentation...`

// AI now responds with accurate, contextual information from the actual docs!
```

### Benefits of Docs Knowledge Integration

1. **Always Up-to-Date**: AI knowledge automatically reflects current documentation
2. **Accurate Information**: Responses based on actual WE-OS documentation, not generic knowledge
3. **Contextual Awareness**: Understands WE-OS architecture, patterns, and best practices
4. **Self-Documenting**: AI can explain its own integration and capabilities
5. **Developer Support**: Provides accurate guidance for WE-OS development
6. **Smart Filtering**: Only adds docs context when relevant to the query

### Configuration Options

```javascript
// Fine-tune docs knowledge behavior
const options = {
    useDocsKnowledge: true,        // Enable/disable docs integration
    forceDocsKnowledge: false,     // Force docs context even for non-system queries
    maxDocsFiles: 3,               // Maximum documentation files to include
    maxDocsContent: 2000,          // Maximum content length per file
    includeArchitecture: true,     // Include architecture documentation
    includeAPIs: true              // Include API documentation
};

// Example: Development-focused query
document.dispatchEvent(new CustomEvent(MESSAGES.WEBLLM_GENERATE_REQUEST, {
    detail: {
        messages: [{ role: 'user', content: 'Explain the WE-OS event system' }],
        conversationId: 'dev-help',
        options: {
            ...options,
            maxDocsFiles: 5,           // Include more files for complex topics
            includeAPIs: true          // Ensure API docs are included
        }
    }
}));
```

The AI subsystem provides a comprehensive foundation for building intelligent applications within WE-OS, combining local AI processing, complete documentation knowledge integration, and multiple user interfaces to create a powerful and privacy-focused AI experience that truly understands the system it operates within.