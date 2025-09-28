/**
 * WebLLM Service for Desktop Environment
 * 
 * This service integrates the WebLLM worker component with the desktop environment,
 * providing a centralized AI service that can be used by any desktop application.
 * 
 * Features:
 * - Manages WebLLM worker lifecycle
 * - Provides event-driven API through desktop event bus
 * - Handles model initialization and switching
 * - Manages conversation contexts
 * - Provides service health monitoring
 */

import { eventBus } from '../events/event-bus.js';
import { MESSAGES } from '../events/message-types.js';

// Simple logger implementation until shared logger is available
class SimpleLogger {
  constructor(component) {
    this.component = component;
  }
  
  log(message, level = 'info', data = null) {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${this.component}] [${level.toUpperCase()}]`;
    
  //  if (data) {
  //    console.log(`${prefix} ${message}`, data);
  //  } else {
  //    console.log(`${prefix} ${message}`);
  //  }
  }
  
  error(message, level = 'error', data = null) {
    this.log(message, 'error', data);
  }
}

export class WebLLMService {
  constructor(config = {}) {
    this.config = {
      workerPath: '../chat-component/chat-worker.js',
      defaultModel: 'Qwen2.5-0.5B-Instruct-q0f16-MLC',
      autoInitialize: false,
      serviceVersion: '1.0.0',
      ...config
    };
    
    this.logger = new SimpleLogger('WebLLMService');
    this.workerComponent = null;
    this.isServiceReady = false;
    this.currentModel = null;
    this.activeConversations = new Map();
    this.serviceId = `webllm-service-${Date.now()}`;
    this.serviceStartTime = Date.now();
    
    // Service capabilities
    this.capabilities = {
      streaming: true,
      modelSwitching: true,
      conversationManagement: true,
      knowledgeBase: true,
      contextMemory: false // Depends on memory manager integration
    };
    
    this.logger.log('WebLLM Service initialized', 'init', { 
      config: this.config,
      serviceId: this.serviceId 
    });
  }
  
  /**
   * Initialize the WebLLM service
   */
  async initialize() {
    try {
      this.logger.log('Starting WebLLM service initialization', 'init');
      
      // Create and configure the WebLLM worker component
      await this.createWorkerComponent();
      
      // Set up event listeners
      this.setupEventListeners();
      
      // Register service event handlers
      this.registerServiceHandlers();
      
      // Mark service as ready
      this.isServiceReady = true;
      
      // Dispatch service ready event
      eventBus.publish(MESSAGES.WEBLLM_SERVICE_READY, {
        serviceVersion: this.config.serviceVersion,
        supportedModels: this.getSupportedModels(),
        capabilities: this.capabilities,
        serviceId: this.serviceId
      });
      
      this.logger.log('WebLLM service ready', 'init', {
        autoInitialize: this.config.autoInitialize,
        defaultModel: this.config.defaultModel
      });
      
      // Auto-initialize model if configured
      if (this.config.autoInitialize) {
        await this.initializeModel(this.config.defaultModel);
      }
      
      return true;
    } catch (error) {
      this.logger.error('Failed to initialize WebLLM service', 'init', { error: error.message });
      
      eventBus.publish(MESSAGES.WEBLLM_SERVICE_UNAVAILABLE, {
        error: error.message,
        serviceId: this.serviceId
      });
      
      throw error;
    }
  }
  
  /**
   * Create the WebLLM worker component
   */
  async createWorkerComponent() {
    try {
      // Dynamically import the WebLLM worker component
      const { WebLLMWorkerComponent } = await import('/chat-component/webllm-worker-component.js');
      
      // Create a hidden worker component instance
      this.workerComponent = document.createElement('webllm-worker-component');
      this.workerComponent.setAttribute('worker-path', this.config.workerPath);
      this.workerComponent.style.display = 'none';
      
      // Add to DOM (required for Web Components to function)
      document.body.appendChild(this.workerComponent);
      
      this.logger.log('WebLLM worker component created', 'worker');
    } catch (error) {
      throw new Error(`Failed to create worker component: ${error.message}`);
    }
  }
  
  /**
   * Set up event listeners for worker component events
   */
  setupEventListeners() {
    if (!this.workerComponent) return;
    
    // Map worker component events to desktop events
    const eventMappings = [
      { workerEvent: 'llm-init-start', desktopEvent: MESSAGES.WEBLLM_INIT_START },
      { workerEvent: 'llm-init-progress', desktopEvent: MESSAGES.WEBLLM_INIT_PROGRESS },
      { workerEvent: 'llm-init-complete', desktopEvent: MESSAGES.WEBLLM_INIT_COMPLETE },
      { workerEvent: 'llm-error', desktopEvent: MESSAGES.WEBLLM_INIT_ERROR },
      { workerEvent: 'llm-generation-start', desktopEvent: MESSAGES.WEBLLM_GENERATION_START },
      { workerEvent: 'llm-response-chunk', desktopEvent: MESSAGES.WEBLLM_RESPONSE_CHUNK },
      { workerEvent: 'llm-response-complete', desktopEvent: MESSAGES.WEBLLM_RESPONSE_COMPLETE },
      { workerEvent: 'llm-warning', desktopEvent: MESSAGES.WEBLLM_WARNING },
      { workerEvent: 'llm-worker-terminated', desktopEvent: MESSAGES.WEBLLM_WORKER_TERMINATED }
    ];
    
    eventMappings.forEach(({ workerEvent, desktopEvent }) => {
      this.workerComponent.addEventListener(workerEvent, (event) => {
        const payload = { 
          ...event.detail,
          serviceId: this.serviceId,
          timestamp: Date.now()
        };
        
        this.logger.log(`Relaying event: ${workerEvent} -> ${desktopEvent}`, 'event', payload);
        eventBus.publish(desktopEvent, payload);
      });
    });
    
    // Handle initialization completion
    this.workerComponent.addEventListener('llm-init-complete', (event) => {
      this.currentModel = event.detail.modelId;
      this.updateServiceStatus();

      // Trigger notification
      eventBus.publish(MESSAGES.CREATE_NOTIFICATION, {
        sourceAppId: 'webllm-service',
        title: 'Model Initialization Complete',
        body: `The model ${event.detail.modelId} has been successfully initialized.`,
        icon: '🤖',
        category: 'system',
        duration: 5000
      });
    });
    
    // Handle errors
    this.workerComponent.addEventListener('llm-error', (event) => {
      this.logger.error('Worker error', 'worker', event.detail);
    });
    
    this.logger.log('Event listeners configured', 'setup');
  }
  
  /**
   * Register service request handlers
   */
  registerServiceHandlers() {
    // Listen for service requests
    eventBus.subscribe(MESSAGES.WEBLLM_INITIALIZE_REQUEST, this.handleInitializeRequest.bind(this));
    eventBus.subscribe(MESSAGES.WEBLLM_GENERATE_REQUEST, this.handleGenerateRequest.bind(this));
    eventBus.subscribe(MESSAGES.WEBLLM_TERMINATE_REQUEST, this.handleTerminateRequest.bind(this));
    
    this.logger.log('Service request handlers registered', 'setup');
  }
  
  /**
   * Handle model initialization requests
   */
  async handleInitializeRequest(payload) {
    try {
      this.logger.log('Handling initialize request', 'request', payload);
      
      if (!this.isServiceReady) {
        throw new Error('WebLLM service not ready');
      }
      
      const { modelId, force = false } = payload;
      
      // Check if model is already loaded
      if (this.currentModel === modelId && !force) {
        this.logger.log('Model already loaded', 'model', { modelId });
        return;
      }
      
      await this.initializeModel(modelId);
    } catch (error) {
      this.logger.error('Initialize request failed', 'request', { error: error.message });
      eventBus.publish(MESSAGES.WEBLLM_INIT_ERROR, {
        error: error.message,
        serviceId: this.serviceId
      });
    }
  }
  
  /**
   * Handle text generation requests
   */
  async handleGenerateRequest(payload) {
    try {
      this.logger.log('Handling generate request', 'request', { 
        conversationId: payload.conversationId,
        messageCount: payload.messages?.length 
      });
      
      if (!this.isServiceReady || !this.workerComponent?.isReady()) {
        throw new Error('WebLLM service not ready for generation');
      }
      
      const { messages, conversationId, options = {} } = payload;
      
      // Track conversation
      if (conversationId) {
        this.activeConversations.set(conversationId, {
          id: conversationId,
          startTime: Date.now(),
          messageCount: messages.length,
          lastActivity: Date.now()
        });
      }
      
      // Generate response using worker
      await this.workerComponent.generateResponse(messages);
      
    } catch (error) {
      this.logger.error('Generate request failed', 'request', { error: error.message });
      eventBus.publish(MESSAGES.WEBLLM_GENERATION_ERROR, {
        error: error.message,
        conversationId: payload.conversationId,
        serviceId: this.serviceId
      });
    }
  }
  
  /**
   * Handle worker termination requests
   */
  async handleTerminateRequest(payload) {
    try {
      this.logger.log('Handling terminate request', 'request', payload);
      
      const { reason = 'Manual termination', cleanup = true } = payload;
      
      if (this.workerComponent) {
        this.workerComponent.terminateWorker();
      }
      
      if (cleanup) {
        this.activeConversations.clear();
        this.currentModel = null;
      }
      
      this.updateServiceStatus();
      
    } catch (error) {
      this.logger.error('Terminate request failed', 'request', { error: error.message });
    }
  }
  
  /**
   * Initialize a specific model
   */
  async initializeModel(modelId) {
    if (!this.workerComponent) {
      throw new Error('Worker component not available');
    }
    
    this.logger.log('Initializing model', 'model', { modelId });
    
    // Track model change
    const oldModel = this.currentModel;
    
    try {
      await this.workerComponent.initializeWorker(modelId);
      
      if (oldModel && oldModel !== modelId) {
        eventBus.publish(MESSAGES.WEBLLM_MODEL_CHANGED, {
          oldModelId: oldModel,
          newModelId: modelId,
          reason: 'Manual model switch',
          serviceId: this.serviceId
        });
      }
      
    } catch (error) {
      this.logger.error('Model initialization failed', 'model', { modelId, error: error.message });
      throw error;
    }
  }
  
  /**
   * Update service status and broadcast changes
   */
  updateServiceStatus() {
    const status = this.getServiceStatus();
    
    eventBus.publish(MESSAGES.WEBLLM_STATUS_CHANGED, {
      ...status,
      serviceId: this.serviceId
    });
    
    this.logger.log('Service status updated', 'status', status);
  }
  
  /**
   * Get current service status
   */
  getServiceStatus() {
    const workerStatus = this.workerComponent?.getStatus() || {};
    
    return {
      isInitialized: workerStatus.isInitialized || false,
      isProcessing: workerStatus.isProcessing || false,
      currentModel: this.currentModel,
      hasWorker: !!this.workerComponent,
      isServiceReady: this.isServiceReady,
      activeConversations: this.activeConversations.size,
      uptime: Date.now() - this.serviceStartTime,
      status: this.isServiceReady 
        ? (workerStatus.isInitialized ? 'Ready' : 'Initialized') 
        : 'Starting'
    };
  }
  
  /**
   * Get supported models configuration
   */
  getSupportedModels() {
    return this.workerComponent?.getAvailableModels() || [
      { id: "Qwen2.5-0.5B-Instruct-q0f16-MLC", name: "Qwen 0.5B (Fast)" },
      { id: "DeepSeek-R1-Distill-Qwen-7B-q4f16_1-MLC", name: "DeepSeek 7B (Smart)" }
    ];
  }
  
  /**
   * Get service health information
   */
  getHealthInfo() {
    return {
      serviceId: this.serviceId,
      version: this.config.serviceVersion,
      status: this.getServiceStatus(),
      capabilities: this.capabilities,
      uptime: Date.now() - this.serviceStartTime,
      activeConversations: Array.from(this.activeConversations.values()),
      supportedModels: this.getSupportedModels()
    };
  }
  
  /**
   * Cleanup service resources
   */
  async cleanup() {
    this.logger.log('Cleaning up WebLLM service', 'cleanup');
    
    try {
      // Clean up event listeners
      eventBus.unsubscribeAll(MESSAGES.WEBLLM_INITIALIZE_REQUEST);
      eventBus.unsubscribeAll(MESSAGES.WEBLLM_GENERATE_REQUEST);
      eventBus.unsubscribeAll(MESSAGES.WEBLLM_TERMINATE_REQUEST);
      
      // Terminate worker
      if (this.workerComponent) {
        this.workerComponent.terminateWorker();
        
        // Remove from DOM
        if (this.workerComponent.parentNode) {
          this.workerComponent.parentNode.removeChild(this.workerComponent);
        }
      }
      
      // Clear conversations
      this.activeConversations.clear();
      
      // Mark service as unavailable
      this.isServiceReady = false;
      
      eventBus.publish(MESSAGES.WEBLLM_SERVICE_UNAVAILABLE, {
        reason: 'Service cleanup',
        serviceId: this.serviceId
      });
      
      this.logger.log('WebLLM service cleanup completed', 'cleanup');
      
    } catch (error) {
      this.logger.error('Error during service cleanup', 'cleanup', { error: error.message });
    }
  }
}

// Export for desktop environment startup manager
export default WebLLMService;