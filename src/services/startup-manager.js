/**
 * StartupManager - Orchestrates configurable component loading with dependency management
 * Provides phased, prioritized loading with graceful fallbacks for optional components
 */
export class StartupManager {
  constructor() {
    this.config = null;
    this.loadedComponents = new Map();
    this.loadingPhases = new Map();
    this.dependencies = new Map();
    this.startTime = performance.now();
  }

  async init() {
    // First check for localStorage override (highest priority)
    try {
      const localConfig = localStorage.getItem('startup-config-override');
      if (localConfig) {
        this.config = JSON.parse(localConfig);
        console.log('📦 Startup config loaded from localStorage:', this.config.startup.phases.length, 'phases');
        return;
      }
    } catch (error) {
      console.warn('⚠️ Failed to load config from localStorage:', error);
    }

    // Fall back to config.json
    try {
      const response = await fetch('./config.json');
      this.config = await response.json();
      console.log('📄 Startup config loaded from config.json:', this.config.startup.phases.length, 'phases');
    } catch (error) {
      console.warn('⚠️ Failed to load config.json, using defaults:', error);
      this.config = this.getDefaultConfig();
      console.log('⚙️ Using default startup config:', this.config.startup.phases.length, 'phases');
    }
  }

  getDefaultConfig() {
    return {
      startup: {
        phases: [
          {
            name: "critical",
            parallel: true,
            components: [
              { name: "AppService", path: "./src/services/app-service.js", required: true, priority: 1 },
              { name: "WallpaperManager", path: "./src/services/wallpaper-manager.js", required: true, priority: 1 },
              { name: "WindowManager", path: "./src/services/window-manager.js", required: true, priority: 1, dependencies: ["AppService"] }
            ]
          },
          {
            name: "ui",
            parallel: true,
            waitFor: "critical",
            components: [
              { name: "ContextMenuManager", path: "./src/services/context-menu-manager.js", required: true, priority: 2, dependencies: ["WallpaperManager"] }
            ]
          },
          {
            name: "optional",
            parallel: true,
            waitFor: "ui",
            defer: true,
            components: [
              { name: "NotificationService", path: "./src/services/notification-service.js", required: false, priority: 3, enabled: true, fallbackGraceful: true }
            ]
          }
        ],
        performance: { enableLazyLoading: true, maxConcurrentLoads: 3, timeoutMs: 5000, retryAttempts: 2 }
      }
    };
  }

  async startupSequence(desktopComponent) {
    const phases = this.config.startup.phases;
    
    console.log(`🚀 Starting ${phases.length} phase startup sequence`);
    
    for (const phase of phases) {
      const enabledCount = phase.components.filter(c => c.enabled !== false).length;
      const totalCount = phase.components.length;
      console.log(`📦 Phase "${phase.name}" - ${enabledCount}/${totalCount} components enabled`);
      
      if (phase.waitFor) {
        await this.waitForPhase(phase.waitFor);
      }

      if (phase.defer && this.shouldDeferPhase(phase)) {
        this.deferPhase(phase, desktopComponent);
        continue;
      }

      if (phase.parallel) {
        await this.loadPhaseParallel(phase, desktopComponent);
      } else {
        await this.loadPhaseSequential(phase, desktopComponent);
      }
    }

    const totalTime = performance.now() - this.startTime;
    console.log(`✅ Startup complete in ${totalTime.toFixed(2)}ms`);
  }

  async loadPhaseParallel(phase, desktopComponent) {
    const { maxConcurrentLoads = 3 } = this.config.startup.performance;
    // Filter enabled components only
    const components = [...phase.components]
      .filter(component => component.enabled !== false)
      .sort((a, b) => a.priority - b.priority);
    
    if (components.length === 0) {
      console.log(`⏭️ Phase "${phase.name}" - all components disabled, skipping`);
      this.loadingPhases.set(phase.name, 'completed');
      return;
    }
    
    const loadPromises = [];
    for (let i = 0; i < Math.min(components.length, maxConcurrentLoads); i++) {
      loadPromises.push(this.loadComponentsFromQueue(components, desktopComponent));
    }
    
    await Promise.all(loadPromises);
    this.loadingPhases.set(phase.name, 'completed');
  }

  async loadPhaseSequential(phase, desktopComponent) {
    // Filter enabled components only
    const enabledComponents = phase.components
      .filter(component => component.enabled !== false)
      .sort((a, b) => a.priority - b.priority);
    
    if (enabledComponents.length === 0) {
      console.log(`⏭️ Phase "${phase.name}" - all components disabled, skipping`);
      this.loadingPhases.set(phase.name, 'completed');
      return;
    }
    
    for (const component of enabledComponents) {
      await this.loadComponent(component, desktopComponent);
    }
    this.loadingPhases.set(phase.name, 'completed');
  }

  async loadComponentsFromQueue(queue, desktopComponent) {
    const pendingComponents = [];
    
    while (queue.length > 0) {
      const component = queue.shift();
      if (component && component.enabled !== false) {
        if (await this.checkDependencies(component)) {
          await this.loadComponent(component, desktopComponent);
          // After loading a component, check if any pending components can now be loaded
          for (let i = pendingComponents.length - 1; i >= 0; i--) {
            const pendingComponent = pendingComponents[i];
            if (await this.checkDependencies(pendingComponent)) {
              await this.loadComponent(pendingComponent, desktopComponent);
              pendingComponents.splice(i, 1); // Remove from pending list
            }
          }
        } else {
          // Dependencies not met, add to pending list
          pendingComponents.push(component);
          console.log(`⏳ ${component.name} waiting for dependencies: ${component.dependencies.join(', ')}`);
        }
      }
    }
    
    // Process any remaining pending components (retry logic)
    let retryCount = 0;
    const maxRetries = 5;
    while (pendingComponents.length > 0 && retryCount < maxRetries) {
      const remainingComponents = [...pendingComponents];
      pendingComponents.length = 0; // Clear the array
      
      for (const component of remainingComponents) {
        if (await this.checkDependencies(component)) {
          await this.loadComponent(component, desktopComponent);
        } else {
          pendingComponents.push(component); // Still pending
        }
      }
      retryCount++;
    }
    
    // Log any components that couldn't be loaded due to unmet dependencies
    if (pendingComponents.length > 0) {
      console.warn('⚠️ Some components could not be loaded due to unmet dependencies:');
      pendingComponents.forEach(comp => {
        console.warn(`  - ${comp.name} requires: ${comp.dependencies.join(', ')}`);
      });
    }
  }

  async checkDependencies(component) {
    if (!component.dependencies) return true;
    
    const unmetDependencies = [];
    for (const depName of component.dependencies) {
      if (!this.loadedComponents.has(depName)) {
        unmetDependencies.push(depName);
      }
    }
    
    if (unmetDependencies.length > 0) {
      console.log(`🔗 ${component.name} missing dependencies: ${unmetDependencies.join(', ')}`);
      return false;
    }
    
    console.log(`✅ ${component.name} dependencies satisfied: ${component.dependencies.join(', ')}`);
    return true;
  }

  resolveDependencies(component) {
    const deps = {};
    if (component.dependencies) {
      for (const depName of component.dependencies) {
        deps[depName] = this.loadedComponents.get(depName);
      }
    }
    return deps;
  }

  shouldDeferPhase(phase) {
    return phase.defer && (performance.now() - this.startTime) > 1000;
  }

  deferPhase(phase, desktopComponent) {
    console.log(`⏰ Deferring phase "${phase.name}" for lazy loading`);
    
    setTimeout(() => {
      console.log(`🔄 Loading deferred phase "${phase.name}"`);
      this.loadPhaseParallel(phase, desktopComponent);
    }, 2000);
  }

  async waitForPhase(phaseName) {
    return new Promise((resolve) => {
      const checkPhase = () => {
        if (this.loadingPhases.get(phaseName) === 'completed') {
          resolve();
        } else {
          setTimeout(checkPhase, 50);
        }
      };
      checkPhase();
    });
  }

  async loadComponent(component, desktopComponent) {
    if (this.loadedComponents.has(component.name)) {
      return this.loadedComponents.get(component.name);
    }

    // Check if component is disabled
    if (component.enabled === false) {
      console.log(`⏭️ ${component.name} disabled, skipping`);
      return null;
    }

    const startTime = performance.now();
    
    try {
      console.log(`⏳ Loading ${component.name}...`);
      console.log(`🔍 DIAGNOSTIC: Attempting to import from path: "${component.path}"`);
      console.log(`🔍 DIAGNOSTIC: Resolved URL will be: ${new URL(component.path, window.location.href).href}`);
      
      const loadPromise = import(component.path);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), this.config.startup.performance.timeoutMs)
      );

      const moduleResult = await Promise.race([loadPromise, timeoutPromise]);
      const instance = await this.instantiateComponent(component, moduleResult, desktopComponent);
      
      this.loadedComponents.set(component.name, instance);
      
      const loadTime = performance.now() - startTime;
      console.log(`✅ ${component.name} loaded in ${loadTime.toFixed(2)}ms (${this.loadedComponents.size} total loaded)`);
      
      return instance;
    } catch (error) {
      const loadTime = performance.now() - startTime;
      
      if (component.required) {
        console.error(`❌ Critical component ${component.name} failed to load:`, error);
        throw new Error(`Critical startup failure: ${component.name}`);
      } else {
        console.warn(`⚠️ Optional component ${component.name} failed to load in ${loadTime.toFixed(2)}ms:`, error.message);
        if (component.fallbackGraceful) {
          const fallback = this.createGracefulFallback(component);
          this.loadedComponents.set(component.name, fallback);
          return fallback;
        }
      }
    }
  }

  async instantiateComponent(config, moduleResult, desktopComponent) {
    // Handle web components differently from service classes
    if (config.isWebComponent) {
      return this.instantiateWebComponent(config, moduleResult, desktopComponent);
    }

    const ComponentClass = moduleResult.default || 
                           moduleResult[config.name] || 
                           Object.values(moduleResult)[0];

    if (!ComponentClass) {
      throw new Error(`No suitable class found in ${config.path}`);
    }

    const deps = this.resolveDependencies(config);
    
    // Handle service instantiation with proper dependencies
    if (config.name === 'WindowManager') {
      return new ComponentClass(desktopComponent, deps.AppService);
    } else if (config.name === 'ContextMenuManager') {
      return new ComponentClass(desktopComponent, deps.WallpaperManager);
    } else if (config.name === 'AppService') {
      const instance = new ComponentClass();
      instance.init(desktopComponent);
      return instance;
    } else if (config.name === 'NotificationService') {
      const instance = new ComponentClass(desktopComponent);
      
      // Dynamically load notification display component if specified
      if (config.includeDisplayComponent) {
        this.loadNotificationDisplayComponent(instance, desktopComponent);
      }
      
      return instance;
    } else {
      return new ComponentClass(desktopComponent);
    }
  }

  async instantiateWebComponent(config, moduleResult, desktopComponent) {
    console.log(`🧩 Setting up web component: ${config.name}`);
    
    // Web component modules register themselves when imported
    // We just need to create and insert the DOM element
    
    if (config.name === 'DockComponent') {
      // Wait for the custom element to be defined
      await customElements.whenDefined('dock-component');
      
      // Create the dock component element
      const dockElement = document.createElement('dock-component');
      
      // Apply current dock position if set
      const currentDockPosition = desktopComponent.getAttribute('dock-position') || 'bottom';
      dockElement.setAttribute('position', currentDockPosition);
      console.log(`📍 Setting dock position to: ${currentDockPosition}`);
      
      // Insert it into the dock container
      const dockContainer = desktopComponent.shadowRoot.getElementById('dock-container');
      if (dockContainer) {
        dockContainer.appendChild(dockElement);
        console.log(`✅ DockComponent inserted into dock-container`);
      } else {
        console.error(`❌ dock-container not found in desktop template`);
      }
      
      return dockElement;
    }
    
    // Default web component handling for future components
    return null;
  }

  async loadNotificationDisplayComponent(notificationService, desktopComponent) {
    try {
      console.log('⏳ Loading notification display component...');
      
      // Dynamically import the notification display component
      await import('./notification-display-component.js');
      
      // Wait for the next frame to ensure the component is registered
      await new Promise(resolve => requestAnimationFrame(resolve));
      
      // Find or create the notification display element
      let notificationDisplay = desktopComponent.shadowRoot.querySelector('notification-display-component');
      if (!notificationDisplay) {
        notificationDisplay = document.createElement('notification-display-component');
        notificationDisplay.id = 'notification-display';
        desktopComponent.shadowRoot.appendChild(notificationDisplay);
      }
      
      // Connect the notification service to the display component
      notificationService.setDisplayComponent(notificationDisplay);
      
      console.log('✅ Notification display component loaded and connected');
    } catch (error) {
      console.warn('⚠️ Failed to load notification display component:', error);
    }
  }

  createGracefulFallback(component) {
    console.log(`🛡️ Creating graceful fallback for ${component.name}`);
    
    return new Proxy({}, {
      get(target, prop) {
        if (prop === 'init' || typeof prop === 'string') {
          return () => Promise.resolve();
        }
        return undefined;
      }
    });
  }

  getComponent(name) {
    return this.loadedComponents.get(name);
  }

  isComponentLoaded(name) {
    return this.loadedComponents.has(name);
  }

  getStartupMetrics() {
    return {
      totalTime: performance.now() - this.startTime,
      componentsLoaded: this.loadedComponents.size,
      phasesCompleted: Array.from(this.loadingPhases.keys())
    };
  }
}