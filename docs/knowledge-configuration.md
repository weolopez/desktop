# Knowledge Configuration Guide

This guide explains how to configure additional knowledge sources for the WE-OS AI subsystem, building on both the built-in documentation knowledge and the external chat component knowledge system.

## Overview

The WE-OS AI subsystem supports multiple knowledge sources:

1. **Built-in Documentation Knowledge** - Automatically loads all `docs/` files
2. **External Knowledge Sources** - Configurable knowledge directories and files
3. **Chat Component Knowledge** - Vector-based knowledge from the chat component
4. **Custom Knowledge Loaders** - Custom knowledge loading implementations

## Knowledge Source Types

### 1. Built-in Documentation Knowledge

**Location**: `src/services/docs-knowledge-loader.js`
**Auto-loaded**: All files in `docs/` directory
**Format**: Markdown files with automatic indexing

```javascript
// Automatically loaded files (no configuration needed):
const autoLoadedDocs = [
    'README.md',
    'WE-OS-Architecture.md', 
    'ai-subsystem.md',
    'application-guide.md',
    'component-reference.md',
    'configuration-reference.md',
    'dynamic-component-system-integration.md',
    'event-system-api.md',
    'notification-system.md',
    'startup-optimization.md',
    'REQUIREMENTS.md'
];
```

**Configuration**: No additional configuration required - files are automatically indexed when the AI service starts.

### 2. Chat Component Knowledge System

**Location**: `chat-component/lib/knowledge-loader.js`
**Type**: Vector-based knowledge with embeddings
**Format**: Markdown files with metadata support

#### Current Chat Component Configuration

```javascript
// chat-worker.js - Hardcoded knowledge files
const knowledgeFiles = [
    './knowledge/website.md',
    './knowledge/chat-component.md', 
    './knowledge/projects.md'
];

// knowledge/index.json - Discoverable files
{
    "files": [
        "/chat-component/knowledge/example.md",
        "/chat-component/knowledge/resume.json"
    ]
}
```

#### Chat Component Knowledge Features

- **Vector Embeddings**: Uses `Xenova/all-MiniLM-L6-v2` for semantic search
- **Chunking**: Splits large documents into manageable chunks
- **Metadata Support**: Frontmatter parsing for document metadata
- **Semantic Search**: Query-based retrieval using vector similarity

## Configuring Additional Knowledge Sources

### Method 1: Extending Built-in Documentation Knowledge

Add new documentation files to the `docs/` directory:

```javascript
// src/services/docs-knowledge-loader.js
export class DocsKnowledgeLoader {
    constructor() {
        // Add new documentation files here
        this.docFiles = [
            'README.md',
            'WE-OS-Architecture.md',
            // ... existing files ...
            
            // Add your new files:
            'deployment-guide.md',
            'api-reference.md',
            'troubleshooting.md',
            'integrations/external-apis.md',
            'integrations/third-party-tools.md'
        ];
    }
    
    // Optionally customize the docs path
    setDocsPath(newPath) {
        this.docsPath = newPath;
    }
    
    // Add files from additional directories
    addAdditionalSources(additionalSources) {
        this.additionalSources = additionalSources || [];
    }
}
```

### Method 2: Creating Custom Knowledge Loaders

Create specialized knowledge loaders for different content types:

```javascript
// src/services/api-knowledge-loader.js
export class APIKnowledgeLoader {
    constructor(options = {}) {
        this.apiDocsPath = options.apiDocsPath || './api-docs/';
        this.includeOpenAPI = options.includeOpenAPI || true;
        this.includeExamples = options.includeExamples || true;
    }
    
    async loadAPIKnowledge() {
        const knowledge = {
            type: 'api-documentation',
            sources: {},
            endpoints: {},
            examples: {}
        };
        
        // Load OpenAPI specs
        if (this.includeOpenAPI) {
            knowledge.openapi = await this.loadOpenAPISpecs();
        }
        
        // Load API examples
        if (this.includeExamples) {
            knowledge.examples = await this.loadAPIExamples();
        }
        
        return knowledge;
    }
    
    async loadOpenAPISpecs() {
        const specs = {};
        const specFiles = ['openapi.yaml', 'swagger.json'];
        
        for (const specFile of specFiles) {
            try {
                const response = await fetch(`${this.apiDocsPath}${specFile}`);
                if (response.ok) {
                    const content = await response.text();
                    specs[specFile] = content;
                }
            } catch (error) {
                console.warn(`Failed to load API spec ${specFile}:`, error);
            }
        }
        
        return specs;
    }
}
```

### Method 3: Integrating External Knowledge Sources

Configure the AI service to load knowledge from external sources:

```javascript
// src/services/webllm-service.js - Enhanced version
export class WebLLMService {
    constructor(config = {}) {
        // ... existing config ...
        
        // Knowledge source configuration
        this.knowledgeSources = config.knowledgeSources || {
            docs: { enabled: true, loader: 'DocsKnowledgeLoader' },
            api: { enabled: false, loader: 'APIKnowledgeLoader' },
            external: { enabled: false, sources: [] }
        };
    }
    
    async loadAllKnowledge() {
        const knowledgeLoaders = [];
        
        // Load built-in docs knowledge
        if (this.knowledgeSources.docs.enabled) {
            const { docsKnowledgeLoader } = await import('./docs-knowledge-loader.js');
            knowledgeLoaders.push({
                name: 'docs',
                loader: docsKnowledgeLoader,
                weight: 1.0
            });
        }
        
        // Load API knowledge
        if (this.knowledgeSources.api.enabled) {
            const { APIKnowledgeLoader } = await import('./api-knowledge-loader.js');
            const apiLoader = new APIKnowledgeLoader(this.knowledgeSources.api.config);
            knowledgeLoaders.push({
                name: 'api',
                loader: apiLoader,
                weight: 0.8
            });
        }
        
        // Load external knowledge sources
        for (const source of this.knowledgeSources.external.sources) {
            const loader = await this.createExternalLoader(source);
            if (loader) {
                knowledgeLoaders.push({
                    name: source.name,
                    loader: loader,
                    weight: source.weight || 0.5
                });
            }
        }
        
        // Load all knowledge sources
        const results = await Promise.allSettled(
            knowledgeLoaders.map(({ name, loader }) => 
                loader.loadKnowledge ? loader.loadKnowledge() : loader.loadDocsKnowledge()
            )
        );
        
        // Process results and combine knowledge
        this.combinedKnowledge = this.combineKnowledgeSources(knowledgeLoaders, results);
        
        return this.combinedKnowledge;
    }
}
```

## Configuration Examples

### Example 1: Adding Project-Specific Documentation

```javascript
// config.json - Add custom knowledge configuration
{
    "features": {
        "ai": {
            "enableDocsKnowledge": true,
            "knowledgeSources": {
                "docs": {
                    "enabled": true,
                    "additionalPaths": [
                        "./project-docs/",
                        "./integration-guides/",
                        "./deployment/"
                    ],
                    "filePatterns": ["*.md", "*.txt", "*.json"]
                }
            }
        }
    }
}

// Enhanced docs knowledge loader usage
import { docsKnowledgeLoader } from './docs-knowledge-loader.js';

// Add additional knowledge sources
docsKnowledgeLoader.addAdditionalSources([
    {
        path: './project-docs/',
        pattern: '*.md',
        category: 'project-specific'
    },
    {
        path: './integration-guides/',
        pattern: '*.md', 
        category: 'integrations'
    }
]);

await docsKnowledgeLoader.loadDocsKnowledge();
```

### Example 2: Adding API Documentation

```javascript
// Create api-knowledge-loader.js
export class APIKnowledgeLoader {
    constructor(config) {
        this.apiPath = config.apiPath || './api/';
        this.loadExamples = config.loadExamples || true;
        this.loadSchemas = config.loadSchemas || true;
    }
    
    async loadKnowledge() {
        const knowledge = {
            type: 'api-documentation',
            apis: {},
            schemas: {},
            examples: {}
        };
        
        // Load API documentation files
        const apiFiles = [
            'rest-api.md',
            'websocket-api.md', 
            'event-api.md'
        ];
        
        for (const file of apiFiles) {
            const content = await this.loadFile(`${this.apiPath}${file}`);
            if (content) {
                knowledge.apis[file] = content;
            }
        }
        
        // Load schemas if enabled
        if (this.loadSchemas) {
            knowledge.schemas = await this.loadSchemas();
        }
        
        // Load examples if enabled  
        if (this.loadExamples) {
            knowledge.examples = await this.loadExamples();
        }
        
        return knowledge;
    }
}

// Register in WebLLM service
// config.json
{
    "features": {
        "ai": {
            "knowledgeSources": {
                "api": {
                    "enabled": true,
                    "loader": "APIKnowledgeLoader",
                    "config": {
                        "apiPath": "./api-docs/",
                        "loadExamples": true,
                        "loadSchemas": true
                    }
                }
            }
        }
    }
}
```

### Example 3: External Knowledge Sources

```javascript
// config.json - External knowledge configuration
{
    "features": {
        "ai": {
            "knowledgeSources": {
                "external": {
                    "enabled": true,
                    "sources": [
                        {
                            "name": "company-kb",
                            "type": "remote",
                            "url": "https://api.company.com/knowledge",
                            "apiKey": "${COMPANY_KB_API_KEY}",
                            "weight": 0.7,
                            "categories": ["company-info", "policies", "procedures"]
                        },
                        {
                            "name": "github-docs", 
                            "type": "github",
                            "repository": "company/documentation",
                            "path": "docs/",
                            "branch": "main",
                            "weight": 0.6
                        },
                        {
                            "name": "confluence",
                            "type": "confluence",
                            "baseUrl": "https://company.atlassian.net",
                            "spaceKey": "DEV",
                            "weight": 0.5
                        }
                    ]
                }
            }
        }
    }
}

// External knowledge loader implementation
export class ExternalKnowledgeLoader {
    constructor(config) {
        this.config = config;
        this.cache = new Map();
    }
    
    async loadKnowledge() {
        const knowledge = {
            type: 'external',
            source: this.config.name,
            content: {}
        };
        
        switch (this.config.type) {
            case 'remote':
                knowledge.content = await this.loadRemoteKnowledge();
                break;
            case 'github':
                knowledge.content = await this.loadGitHubKnowledge();
                break;
            case 'confluence':
                knowledge.content = await this.loadConfluenceKnowledge();
                break;
        }
        
        return knowledge;
    }
    
    async loadRemoteKnowledge() {
        const response = await fetch(this.config.url, {
            headers: {
                'Authorization': `Bearer ${this.config.apiKey}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`Failed to load remote knowledge: ${response.statusText}`);
        }
        
        return response.json();
    }
}
```

## Vector-Based Knowledge Integration

For advanced use cases, integrate with the chat component's vector-based knowledge system:

### Example 4: Vector Knowledge Integration

```javascript
// Enhanced knowledge loader with vector support
export class VectorKnowledgeLoader {
    constructor(config) {
        this.config = config;
        this.vectorDB = null;
        this.embeddingModel = config.embeddingModel || 'Xenova/all-MiniLM-L6-v2';
    }
    
    async initialize() {
        // Initialize vector database
        const { EntityDB } = await import('../chat-component/lib/entity-db.js');
        this.vectorDB = new EntityDB({
            vectorPath: 'custom_knowledge_vectors',
            model: this.embeddingModel
        });
    }
    
    async loadAndIndexKnowledge(knowledgeSources) {
        await this.initialize();
        
        for (const source of knowledgeSources) {
            await this.processKnowledgeSource(source);
        }
    }
    
    async processKnowledgeSource(source) {
        const content = await this.loadSourceContent(source);
        
        // Chunk the content
        const chunks = this.chunkContent(content, {
            maxChunkSize: 512,
            overlap: 100
        });
        
        // Create embeddings and store in vector DB
        for (const chunk of chunks) {
            await this.vectorDB.addEntity({
                content: chunk.text,
                metadata: {
                    source: source.name,
                    category: source.category,
                    chunkIndex: chunk.index
                }
            });
        }
    }
    
    async queryKnowledge(query, limit = 5) {
        if (!this.vectorDB) {
            await this.initialize();
        }
        
        // Perform semantic search
        const results = await this.vectorDB.searchSimilar(query, limit);
        
        return results.map(result => ({
            content: result.content,
            relevance: result.similarity,
            metadata: result.metadata
        }));
    }
}
```

## Configuration Best Practices

### 1. Knowledge Source Prioritization

```javascript
// Configure knowledge source weights
const knowledgeConfig = {
    sources: [
        { name: 'docs', weight: 1.0, priority: 'high' },      // Built-in docs
        { name: 'api', weight: 0.9, priority: 'high' },       // API documentation
        { name: 'examples', weight: 0.7, priority: 'medium' }, // Code examples
        { name: 'external', weight: 0.5, priority: 'low' }    // External sources
    ]
};
```

### 2. Caching and Performance

```javascript
// Configure knowledge caching
const cacheConfig = {
    enableCache: true,
    cacheTTL: 3600000, // 1 hour
    maxCacheSize: 100, // MB
    preloadSources: ['docs', 'api'], // Preload critical sources
    lazyLoadSources: ['external'] // Load on demand
};
```

### 3. Content Filtering and Processing

```javascript
// Configure content processing
const processingConfig = {
    filters: {
        minContentLength: 100,
        excludePatterns: [
            /^#\s*TODO/,        // Exclude TODO comments
            /^<!--.*-->$/,      // Exclude HTML comments
            /^\s*$/             // Exclude empty lines
        ]
    },
    preprocessing: {
        removeCodeBlocks: false,
        normalizePaths: true,
        extractMetadata: true
    }
};
```

### 4. Security Considerations

```javascript
// Secure knowledge loading
const securityConfig = {
    allowedDomains: [
        'company.com',
        'docs.company.com',
        'api.company.com'
    ],
    requireAuth: true,
    sanitizeContent: true,
    validateSources: true
};
```

## Integration with AI Subsystem

### Enhanced Message Processing

```javascript
// Enhanced AI request with multiple knowledge sources
async function enhanceWithAllKnowledge(messages, options = {}) {
    const knowledgeSources = [];
    
    // Get docs knowledge
    if (options.useDocsKnowledge !== false) {
        const docsKnowledge = await getDocsKnowledge(userQuery);
        knowledgeSources.push({
            type: 'documentation',
            content: docsKnowledge,
            weight: 1.0
        });
    }
    
    // Get vector knowledge
    if (options.useVectorKnowledge) {
        const vectorKnowledge = await getVectorKnowledge(userQuery);
        knowledgeSources.push({
            type: 'vector',
            content: vectorKnowledge,
            weight: 0.8
        });
    }
    
    // Get external knowledge
    if (options.useExternalKnowledge) {
        const externalKnowledge = await getExternalKnowledge(userQuery);
        knowledgeSources.push({
            type: 'external',
            content: externalKnowledge,
            weight: 0.6
        });
    }
    
    // Combine and create enhanced prompt
    const enhancedPrompt = createContextualPrompt(userQuery, knowledgeSources);
    
    return enhancedPrompt;
}
```

### Usage Examples

```javascript
// Example 1: Development question with docs knowledge
document.dispatchEvent(new CustomEvent(MESSAGES.WEBLLM_GENERATE_REQUEST, {
    detail: {
        messages: [{ role: 'user', content: 'How do I create a new service in WE-OS?' }],
        conversationId: 'dev-help',
        options: {
            useDocsKnowledge: true,
            maxDocsFiles: 3,
            includeAPIs: true
        }
    }
}));

// Example 2: Complex query with multiple knowledge sources
document.dispatchEvent(new CustomEvent(MESSAGES.WEBLLM_GENERATE_REQUEST, {
    detail: {
        messages: [{ role: 'user', content: 'Explain the complete deployment process' }],
        conversationId: 'deployment-help',
        options: {
            useDocsKnowledge: true,
            useVectorKnowledge: true,
            useExternalKnowledge: true,
            knowledgeSources: ['docs', 'deployment-guides', 'company-kb']
        }
    }
}));

// Example 3: API-specific question
document.dispatchEvent(new CustomEvent(MESSAGES.WEBLLM_GENERATE_REQUEST, {
    detail: {
        messages: [{ role: 'user', content: 'Show me examples of the notification API' }],
        conversationId: 'api-help',
        options: {
            useDocsKnowledge: true,
            forceDocsKnowledge: true,
            maxDocsFiles: 5,
            includeAPIs: true,
            includeExamples: true,
            focusCategories: ['apis', 'examples']
        }
    }
}));
```

This comprehensive knowledge configuration system allows WE-OS to provide context-aware AI assistance using multiple knowledge sources, from built-in documentation to external APIs and vector-based semantic search, creating a powerful and extensible AI knowledge system.