/**
 * StartupManager - Orchestrates configurable component loading with dependency management
 * Provides phased, prioritized loading with graceful fallbacks for optional components
 */
export class StartupManager {
  constructor() {
    this.loadedComponents = new Map();
    this.loadingPhases = new Map();
    this.dependencies = new Map();
    this.startTime = performance.now();
    const scriptWithConfig = document.querySelector('script[data-config]');
    if (scriptWithConfig) {
      this.init(scriptWithConfig.dataset.config);
    }
  }

  async init(config) {
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

      const configURL = config || '/desktop/config.json';
      console.log(`🔍 Attempting to load startup config from: ${configURL}`);

      const response = await fetch(configURL);
      this.config = await response.json();
      console.log('📄 Startup config loaded from config.json:', this.config.startup.phases.length, 'phases');
    } catch (error) {
      console.warn('⚠️ Failed to load config.json, using defaults:', error);
      alert('⚙️ Using default startup config:', this.config.startup.phases.length, 'phases');
    }
    await this.startupSequence();
  }

  async startupSequence() {
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
        this.deferPhase(phase);
        continue;
      }

      if (phase.parallel) {
        await this.loadPhaseParallel(phase);
      } else {
        await this.loadPhaseSequential(phase);
      }
    }

    const totalTime = performance.now() - this.startTime;
    console.log(`✅ Startup complete in ${totalTime.toFixed(2)}ms`);
  }

  async loadPhaseParallel(phase) {
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
      loadPromises.push(this.loadComponentsFromQueue(components));
    }
    
    await Promise.all(loadPromises);
    this.loadingPhases.set(phase.name, 'completed');
  }

  async loadPhaseSequential(phase) { 
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
      await this.loadComponent(component);
    }
    this.loadingPhases.set(phase.name, 'completed');
  }

  async loadComponentsFromQueue(queue) {
    const pendingComponents = [];
    
    while (queue.length > 0) {
      const component = queue.shift();
      if (component && component.enabled !== false) {
        if (await this.checkDependencies(component)) {
          await this.loadComponent(component)
          // After loading a component, check if any pending components can now be loaded
          for (let i = pendingComponents.length - 1; i >= 0; i--) {
            const pendingComponent = pendingComponents[i];
            if (await this.checkDependencies(pendingComponent)) {
              await this.loadComponent(pendingComponent)
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
          await this.loadComponent(component);
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

  deferPhase(phase) {
    console.log(`⏰ Deferring phase "${phase.name}" for lazy loading`);
    
    setTimeout(() => {
      console.log(`🔄 Loading deferred phase "${phase.name}"`);
      this.loadPhaseParallel(phase);
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

  async loadComponent(component) {
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
      const instance = await this.instantiateComponent(component, moduleResult);
      
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

  resolveConstructorArgs(args, context) {
    return args.map(arg => {
      if (typeof arg !== 'string') return arg;
      
      // Handle dot notation for dependencies
      if (arg.startsWith('deps.')) {
        const depName = arg.substring(5);
        return context.deps[depName];
      }
      
      // Handle config references
      if (arg.startsWith('config.')) {
        const configPath = arg.substring(7);
        return this.getNestedProperty(context.config, configPath);
      }
      
      // Handle direct context properties
      if (context.hasOwnProperty(arg)) {
        return context[arg];
      }
      
      // Return as literal string if no resolution found
      return arg;
    });
  }

  getNestedProperty(obj, path) {
    return path.split('.').reduce((current, key) => current && current[key], obj);
  }

  async instantiateComponent(config, moduleResult) {
    // Handle web components differently from service classes
    if (config.isWebComponent) {
      return this.instantiateWebComponent(config, moduleResult);
    }

    const ComponentClass = moduleResult.default ||
                           moduleResult[config.name] ||
                           Object.values(moduleResult)[0];

    if (!ComponentClass) {
      throw new Error(`No suitable class found in ${config.path}`);
    }

    const deps = this.resolveDependencies(config);
    
    // Get instantiation configuration from component's config section
    const instantiationConfig = config.config || {
      constructorArgs: [],
      postInit: null
    };
    
    // Resolve constructor arguments
    const constructorArgs = this.resolveConstructorArgs(instantiationConfig.constructorArgs, {
      deps,
      config
    });
    
    // Create instance
    const instance = new ComponentClass(...constructorArgs);
    
    // Handle post-initialization
    if (instantiationConfig.postInit) {
      const postInitArgs = this.resolveConstructorArgs(
        instantiationConfig.postInitArgs || [],
        { deps, config }
      );
      
      if (instantiationConfig.async) {
        await instance[instantiationConfig.postInit](...postInitArgs);
      } else {
        instance[instantiationConfig.postInit](...postInitArgs);
      }
    }
    
    
    return instance;
  }

  async instantiateWebComponent(config, moduleResult) {
    await customElements.whenDefined(config.tagName);
    
    const customElement = document.createElement(config.tagName);
    
    // Set element ID if specified
    if (config.elementId) {
      customElement.id = config.elementId;
    }
    // for Object.keys(config.attributes) setAttribute
    Object.keys(config.config.attributes || {}).forEach(attr => {
      customElement.setAttribute(attr, config.config.attributes[attr]);
    });
    
    // Determine where to append the element
    let appendTarget;
    if (config.appendTo === 'shadowRoot') {
      appendTarget = document.querySelector('desktop-component').shadowRoot;
    } else {
      // Default to desktop surface for most components
      appendTarget = document.querySelector('desktop-component').children[2];
    }
    
    appendTarget.appendChild(customElement);
    
    // Handle service connections if specified
    if (config.connectTo && config.connectMethod) {
      const targetService = this.loadedComponents.get(config.connectTo);
      if (targetService && typeof targetService[config.connectMethod] === 'function') {
        targetService[config.connectMethod](customElement);
      }
    }
    
    return customElement;
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

// Read config from script data attributes and initialize desktop
const script = document.currentScript;
if (script) {
  window.startupConfig = script.dataset.config || '/desktop/config.json';
}

if (!document.querySelector('desktop-component')) {
  // Import and create desktop component
  import('../components/desktop-component.js').then(() => {
      const desktop = document.createElement('desktop-component');
      document.body.appendChild(desktop);
  });
}

new StartupManager();