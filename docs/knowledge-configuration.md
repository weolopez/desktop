# Knowledge Configuration Guide

This guide explains how to configure additional knowledge sources for the WE-OS AI subsystem using the chat component's vector-based knowledge system.

## Overview

The WE-OS AI subsystem uses the chat component's sophisticated knowledge system which supports:

1. **Vector-Based Knowledge** - Semantic search using embeddings
2. **Index-Based Discovery** - Files listed in `knowledge/index.json`
3. **Automatic Processing** - Markdown files with metadata support
4. **Semantic Search** - Query-based retrieval using vector similarity

**All WE-OS documentation is now integrated** into the chat component's knowledge base via `chat-component/knowledge/index.json`.

## Current Configuration

### WE-OS Documentation Integration

**Location**: `chat-component/knowledge/index.json`
**Type**: Vector-based knowledge with embeddings
**Format**: Markdown files with automatic processing

```json
{
  "files": [
    "/chat-component/knowledge/example.md",
    "/chat-component/knowledge/resume.json",
    "/desktop/docs/README.md",
    "/desktop/docs/REQUIREMENTS.md", 
    "/desktop/docs/WE-OS-Architecture.md",
    "/desktop/docs/ai-subsystem.md",
    "/desktop/docs/application-guide.md",
    "/desktop/docs/component-reference.md",
    "/desktop/docs/configuration-reference.md",
    "/desktop/docs/dynamic-component-system-integration.md",
    "/desktop/docs/event-system-api.md",
    "/desktop/docs/knowledge-configuration.md",
    "/desktop/docs/notification-system.md",
    "/desktop/docs/startup-optimization.md"
  ]
}
```

**All WE-OS documentation is now available** to the AI via the chat component's vector-based knowledge system.

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

## Adding Additional Knowledge Sources

### Method 1: Adding Files to knowledge/index.json

The simplest way to add new knowledge sources is to update the `chat-component/knowledge/index.json` file:

```json
{
  "files": [
    "/chat-component/knowledge/example.md",
    "/chat-component/knowledge/resume.json",
    
    // All WE-OS documentation (already included)
    "/desktop/docs/README.md",
    "/desktop/docs/WE-OS-Architecture.md",
    // ... other docs files ...
    
    // Add your new knowledge files:
    "/project/api-documentation.md",
    "/project/deployment-guide.md", 
    "/project/troubleshooting.md",
    "/external/company-policies.md",
    "/external/best-practices.md"
  ]
}
```

**Process**:
1. Add your markdown files to any accessible location
2. Add the file paths to `knowledge/index.json`
3. Restart the chat component - it will automatically process the new files
4. Files are chunked, embedded, and made searchable via vector similarity

### Method 2: Using Markdown with Metadata

Enhance your knowledge files with frontmatter metadata for better processing:

```markdown
---
title: API Documentation
category: development
tags: [api, rest, endpoints]
priority: high
last_updated: 2024-01-15
---

# API Documentation

This document describes the WE-OS API endpoints...

## Authentication

All API requests require authentication...
```

The chat component's knowledge loader automatically:
- Extracts metadata from frontmatter
- Processes and chunks the content
- Creates vector embeddings for semantic search
- Indexes by title, category, and tags

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

Simply add your project files to the knowledge index:

```json
// chat-component/knowledge/index.json
{
  "files": [
    // Existing files
    "/chat-component/knowledge/example.md",
    "/desktop/docs/README.md",
    "/desktop/docs/WE-OS-Architecture.md",
    
    // Add project-specific documentation
    "/project-docs/getting-started.md",
    "/project-docs/deployment-guide.md",
    "/project-docs/troubleshooting.md",
    "/integration-guides/api-integration.md",
    "/integration-guides/third-party-tools.md"
  ]
}
```

The chat component will automatically:
1. Load and process these files during initialization
2. Create vector embeddings for semantic search
3. Make them available for AI queries

### Example 2: Adding API Documentation

Create structured API documentation files and add them to the index:

```markdown
---
title: REST API Reference
category: api
tags: [rest, endpoints, authentication]
---

# REST API Reference

## Authentication
All API requests require a valid API key...

## Endpoints

### GET /api/components
Returns a list of all available components...
```

```json
// Add to chat-component/knowledge/index.json
{
  "files": [
    // ... existing files ...
    "/api-docs/rest-api.md",
    "/api-docs/websocket-api.md",
    "/api-docs/authentication.md",
    "/api-docs/examples.md"
  ]
}
```

### Example 3: Team Knowledge Base

Add team-specific knowledge files from different sources:

```json
// chat-component/knowledge/index.json
{
  "files": [
    // WE-OS documentation (already included)
    "/desktop/docs/README.md",
    // ... other docs files ...
    
    // Team documentation
    "/team-docs/coding-standards.md",
    "/team-docs/deployment-process.md",
    "/team-docs/incident-response.md",
    
    // Company policies
    "/company/security-guidelines.md",
    "/company/development-workflow.md",
    
    // External documentation (local copies)
    "/external-docs/framework-guide.md",
    "/external-docs/best-practices.md"
  ]
}
```

For remote or frequently updated sources, you can create scripts to fetch and update local copies that are then included in the knowledge base.

## How the Chat Component Knowledge System Works

The chat component automatically provides vector-based knowledge search:

### Automatic Processing

When the chat component initializes, it:

1. **Loads files** listed in `knowledge/index.json`
2. **Chunks content** into manageable pieces (512 chars with 100 char overlap)
3. **Creates embeddings** using `Xenova/all-MiniLM-L6-v2` model
4. **Stores in vector database** for semantic search

### Semantic Search

The AI can now find relevant information using:
- **Keyword matching** - Direct text matches
- **Semantic similarity** - Conceptually related content
- **Context awareness** - Understanding query intent

### Example Query Results

```javascript
// User asks: "How do I create a web component?"
// System finds relevant chunks from:
// - component-reference.md (web component patterns)
// - application-guide.md (component creation examples)  
// - WE-OS-Architecture.md (component architecture)

// User asks: "What are the notification APIs?"
// System finds relevant chunks from:
// - notification-system.md (notification service)
// - event-system-api.md (notification events)
// - component-reference.md (notification component)
```

## Best Practices

### 1. File Organization
- **Group related files** by topic or category
- **Use descriptive filenames** that indicate content
- **Add metadata** to files using frontmatter when helpful
- **Keep files focused** - one topic per file works better than large combined files

### 2. Content Structure
- **Use clear headings** - helps with chunking and retrieval
- **Write descriptive content** - AI searches work better with clear, descriptive text  
- **Include examples** - practical examples are highly valuable for AI responses
- **Add context** - explain not just what but why and when

### 3. Maintenance
- **Regular updates** - keep knowledge files current
- **Remove outdated info** - old information can confuse the AI
- **Test queries** - periodically test that AI finds the right information
- **Monitor performance** - large knowledge bases may need optimization

### 4. File Paths
- **Use absolute paths** in `index.json` starting with `/`
- **Ensure accessibility** - files must be reachable from the chat component
- **Check permissions** - verify files can be fetched over HTTP

## Using the Knowledge System

### Automatic Integration

The chat component automatically uses the knowledge base - no additional configuration needed! When you ask questions, the AI:

1. **Searches the knowledge base** for relevant information
2. **Finds semantically similar content** using vector embeddings  
3. **Includes relevant context** in the response
4. **Provides accurate, documentation-based answers**

### Examples

```javascript
// Ask about WE-OS development - AI automatically finds relevant docs
"How do I create a web component in WE-OS?"
// → Finds content from component-reference.md, application-guide.md

// Ask about APIs - AI searches API documentation  
"What notification events are available?"
// → Finds content from event-system-api.md, notification-system.md

// Ask about architecture - AI references architecture docs
"How does the startup system work?"
// → Finds content from WE-OS-Architecture.md, startup-optimization.md
```

### Benefits

- **Always up-to-date**: Add files to `index.json` and they're immediately searchable
- **Semantic search**: Finds conceptually related content, not just keyword matches
- **Context-aware**: AI understands the relationship between different documentation
- **No coding required**: Just add markdown files and update the index

## Summary

To add knowledge to the WE-OS AI system:

1. **Create markdown files** with your content
2. **Add file paths** to `chat-component/knowledge/index.json`
3. **Restart the chat component** to process new files
4. **Ask questions** - the AI automatically uses the knowledge base

The chat component's vector-based knowledge system provides powerful semantic search capabilities that make the AI truly knowledgeable about your documentation and processes.