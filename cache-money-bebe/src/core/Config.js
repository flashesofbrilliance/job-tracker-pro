/**
 * Configuration Management for cache-money-bebe
 * Provides flexible, validated configuration with environment-specific defaults
 */

import { AdaptiveConfig } from '../utils/SafetyUtils.js';

/**
 * Default configuration for different environments
 */
const DEFAULT_CONFIGS = {
  browser: {
    // Revolving Door Cache
    revolvingDoor: {
      conveyorBeltCycle: 3000,
      cacheWindowWidth: 500,
      phaseOffset: 0.25,
      revolvingCycles: 4,
      maxLocalCacheSize: 50,
      preloadLookahead: 3,
      cdnSyncInterval: 1000
    },
    
    // Payload Cache Strap
    payloadCache: {
      fplPayloadTimeout: 2000,
      payloadBatchSize: 10,
      cronInterval: 30000,
      maxConcurrentPayloads: 5,
      payloadRetryAttempts: 3,
      syncStateThreshold: 0.95
    },
    
    // Cache Integration
    integration: {
      syncMode: 'adaptive',
      performanceThreshold: 0.8,
      enablePredictivePrefetch: true,
      maxPrefetchDistance: 5
    },
    
    // Safety & Performance
    safety: {
      maxRecursionDepth: 10,
      circuitBreakerThreshold: 5,
      circuitBreakerTimeout: 30000,
      requestDeduplicationTTL: 10000,
      memoryWarningThreshold: 0.7,
      memoryCriticalThreshold: 0.85,
      memoryEmergencyThreshold: 0.95
    },
    
    // General
    enableLogging: true,
    syncInterval: 1000,
    environment: 'browser'
  },
  
  node: {
    // Node.js optimized settings
    revolvingDoor: {
      conveyorBeltCycle: 2000,
      cacheWindowWidth: 300,
      phaseOffset: 0.2,
      revolvingCycles: 6,
      maxLocalCacheSize: 100,
      preloadLookahead: 5,
      cdnSyncInterval: 500
    },
    
    payloadCache: {
      fplPayloadTimeout: 5000,
      payloadBatchSize: 20,
      cronInterval: 15000,
      maxConcurrentPayloads: 10,
      payloadRetryAttempts: 5,
      syncStateThreshold: 0.98
    },
    
    integration: {
      syncMode: 'aggressive',
      performanceThreshold: 0.9,
      enablePredictivePrefetch: true,
      maxPrefetchDistance: 8
    },
    
    safety: {
      maxRecursionDepth: 15,
      circuitBreakerThreshold: 10,
      circuitBreakerTimeout: 20000,
      requestDeduplicationTTL: 5000,
      memoryWarningThreshold: 0.8,
      memoryCriticalThreshold: 0.9,
      memoryEmergencyThreshold: 0.95
    },
    
    enableLogging: true,
    syncInterval: 500,
    environment: 'node'
  },
  
  worker: {
    // Web Worker optimized settings
    revolvingDoor: {
      conveyorBeltCycle: 4000,
      cacheWindowWidth: 200,
      phaseOffset: 0.3,
      revolvingCycles: 3,
      maxLocalCacheSize: 25,
      preloadLookahead: 2,
      cdnSyncInterval: 2000
    },
    
    payloadCache: {
      fplPayloadTimeout: 1500,
      payloadBatchSize: 5,
      cronInterval: 45000,
      maxConcurrentPayloads: 3,
      payloadRetryAttempts: 2,
      syncStateThreshold: 0.9
    },
    
    integration: {
      syncMode: 'conservative',
      performanceThreshold: 0.7,
      enablePredictivePrefetch: false,
      maxPrefetchDistance: 2
    },
    
    safety: {
      maxRecursionDepth: 8,
      circuitBreakerThreshold: 3,
      circuitBreakerTimeout: 45000,
      requestDeduplicationTTL: 15000,
      memoryWarningThreshold: 0.6,
      memoryCriticalThreshold: 0.8,
      memoryEmergencyThreshold: 0.9
    },
    
    enableLogging: false,
    syncInterval: 2000,
    environment: 'worker'
  }
};

/**
 * Configuration validation schemas
 */
const VALIDATION_SCHEMA = {
  revolvingDoor: {
    conveyorBeltCycle: { type: 'number', min: 1000, max: 10000 },
    cacheWindowWidth: { type: 'number', min: 100, max: 2000 },
    phaseOffset: { type: 'number', min: 0, max: 1 },
    revolvingCycles: { type: 'number', min: 2, max: 10 },
    maxLocalCacheSize: { type: 'number', min: 10, max: 1000 },
    preloadLookahead: { type: 'number', min: 0, max: 20 },
    cdnSyncInterval: { type: 'number', min: 100, max: 5000 }
  },
  
  payloadCache: {
    fplPayloadTimeout: { type: 'number', min: 500, max: 30000 },
    payloadBatchSize: { type: 'number', min: 1, max: 100 },
    cronInterval: { type: 'number', min: 5000, max: 300000 },
    maxConcurrentPayloads: { type: 'number', min: 1, max: 50 },
    payloadRetryAttempts: { type: 'number', min: 1, max: 10 },
    syncStateThreshold: { type: 'number', min: 0.5, max: 1 }
  },
  
  integration: {
    syncMode: { type: 'string', enum: ['aggressive', 'adaptive', 'conservative'] },
    performanceThreshold: { type: 'number', min: 0.1, max: 1 },
    enablePredictivePrefetch: { type: 'boolean' },
    maxPrefetchDistance: { type: 'number', min: 0, max: 50 }
  },
  
  safety: {
    maxRecursionDepth: { type: 'number', min: 3, max: 50 },
    circuitBreakerThreshold: { type: 'number', min: 1, max: 100 },
    circuitBreakerTimeout: { type: 'number', min: 1000, max: 300000 },
    requestDeduplicationTTL: { type: 'number', min: 100, max: 60000 }
  },
  
  enableLogging: { type: 'boolean' },
  syncInterval: { type: 'number', min: 100, max: 10000 },
  environment: { type: 'string', enum: ['browser', 'node', 'worker'] }
};

/**
 * Main Configuration Manager
 */
export class ConfigManager {
  constructor(userConfig = {}) {
    this.environment = this.detectEnvironment();
    this.baseConfig = this.getDefaultConfig();
    this.userConfig = userConfig;
    this.finalConfig = null;
    this.adaptiveConfig = null;
    this.validationErrors = [];
    
    this.initialize();
  }
  
  /**
   * Detect the runtime environment
   */
  detectEnvironment() {
    // Node.js
    if (typeof process !== 'undefined' && process.versions && process.versions.node) {
      return 'node';
    }
    
    // Web Worker
    if (typeof importScripts === 'function' && typeof WorkerGlobalScope !== 'undefined') {
      return 'worker';
    }
    
    // Browser (default)
    return 'browser';
  }
  
  /**
   * Get default configuration for detected environment
   */
  getDefaultConfig() {
    return JSON.parse(JSON.stringify(DEFAULT_CONFIGS[this.environment]));
  }
  
  /**
   * Initialize configuration with validation and merging
   */
  initialize() {
    console.log(`💰 Initializing cache-money-bebe config for ${this.environment} environment`);
    
    // Override environment if specified by user
    if (this.userConfig.environment && 
        DEFAULT_CONFIGS[this.userConfig.environment]) {
      this.environment = this.userConfig.environment;
      this.baseConfig = this.getDefaultConfig();
    }
    
    // Merge configurations
    this.finalConfig = this.deepMerge(this.baseConfig, this.userConfig);
    
    // Validate final configuration
    this.validate();
    
    if (this.validationErrors.length > 0) {
      console.warn('⚠️ Configuration validation warnings:', this.validationErrors);
    }
    
    // Setup adaptive configuration
    this.adaptiveConfig = new AdaptiveConfig(this.finalConfig);
    
    // Log final config in development
    if (this.finalConfig.enableLogging) {
      console.log('📋 Final cache configuration:', this.getPublicConfig());
    }
  }
  
  /**
   * Deep merge two configuration objects
   */
  deepMerge(target, source) {
    const result = { ...target };
    
    for (const key in source) {
      if (source.hasOwnProperty(key)) {
        if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
          result[key] = this.deepMerge(result[key] || {}, source[key]);
        } else {
          result[key] = source[key];
        }
      }
    }
    
    return result;
  }
  
  /**
   * Validate configuration against schema
   */
  validate() {
    this.validationErrors = [];
    
    for (const section in VALIDATION_SCHEMA) {
      if (this.finalConfig[section]) {
        this.validateSection(section, this.finalConfig[section], VALIDATION_SCHEMA[section]);
      }
    }
    
    // Cross-validation rules
    this.crossValidate();
  }
  
  /**
   * Validate a configuration section
   */
  validateSection(sectionName, config, schema) {
    for (const key in schema) {
      if (config.hasOwnProperty(key)) {
        const value = config[key];
        const rules = schema[key];
        
        // Type validation
        if (rules.type && typeof value !== rules.type) {
          this.validationErrors.push(
            `${sectionName}.${key}: Expected ${rules.type}, got ${typeof value}`
          );
          continue;
        }
        
        // Enum validation
        if (rules.enum && !rules.enum.includes(value)) {
          this.validationErrors.push(
            `${sectionName}.${key}: Must be one of [${rules.enum.join(', ')}]`
          );
        }
        
        // Range validation
        if (rules.min !== undefined && value < rules.min) {
          this.validationErrors.push(
            `${sectionName}.${key}: Must be >= ${rules.min}`
          );
        }
        
        if (rules.max !== undefined && value > rules.max) {
          this.validationErrors.push(
            `${sectionName}.${key}: Must be <= ${rules.max}`
          );
        }
      }
    }
  }
  
  /**
   * Cross-validation between different config sections
   */
  crossValidate() {
    const config = this.finalConfig;
    
    // Phase offset should align with conveyor cycle
    if (config.revolvingDoor) {
      const phaseWindow = config.revolvingDoor.conveyorBeltCycle * config.revolvingDoor.phaseOffset;
      if (phaseWindow < config.revolvingDoor.cacheWindowWidth) {
        this.validationErrors.push(
          'Phase window smaller than cache window - may cause timing issues'
        );
      }
    }
    
    // Payload timeout should be reasonable for batch size
    if (config.payloadCache) {
      const timePerItem = config.payloadCache.fplPayloadTimeout / config.payloadCache.payloadBatchSize;
      if (timePerItem < 100) {
        this.validationErrors.push(
          'Payload timeout may be too aggressive for batch size'
        );
      }
    }
    
    // Sync interval should be reasonable compared to cache cycles
    if (config.syncInterval > config.revolvingDoor?.conveyorBeltCycle) {
      this.validationErrors.push(
        'Sync interval longer than conveyor cycle - may cause desync'
      );
    }
  }
  
  /**
   * Get the current configuration (adaptive)
   */
  get() {
    return this.adaptiveConfig ? this.adaptiveConfig.get() : this.finalConfig;
  }
  
  /**
   * Get configuration for a specific section
   */
  getSection(sectionName) {
    const config = this.get();
    return config[sectionName] || {};
  }
  
  /**
   * Update configuration at runtime
   */
  update(updates) {
    if (this.adaptiveConfig) {
      this.adaptiveConfig.update(updates);
    } else {
      Object.assign(this.finalConfig, updates);
    }
    
    console.log('⚙️ Configuration updated:', updates);
  }
  
  /**
   * Reset to base configuration
   */
  reset() {
    if (this.adaptiveConfig) {
      this.adaptiveConfig.reset();
    } else {
      this.finalConfig = this.deepMerge(this.baseConfig, this.userConfig);
    }
    
    console.log('🔄 Configuration reset to defaults');
  }
  
  /**
   * Get public configuration (without sensitive data)
   */
  getPublicConfig() {
    const config = this.get();
    const publicConfig = { ...config };
    
    // Remove sensitive information
    if (publicConfig.apiKeys) delete publicConfig.apiKeys;
    if (publicConfig.secrets) delete publicConfig.secrets;
    
    return publicConfig;
  }
  
  /**
   * Get configuration summary for debugging
   */
  getSummary() {
    const config = this.get();
    
    return {
      environment: this.environment,
      cacheSize: config.revolvingDoor?.maxLocalCacheSize || 0,
      syncMode: config.integration?.syncMode || 'unknown',
      enabledFeatures: {
        predictivePrefetch: config.integration?.enablePredictivePrefetch || false,
        memoryMonitoring: !!config.safety,
        adaptiveConfig: !!this.adaptiveConfig
      },
      performance: {
        conveyorCycle: config.revolvingDoor?.conveyorBeltCycle || 0,
        payloadTimeout: config.payloadCache?.fplPayloadTimeout || 0,
        recursionDepth: config.safety?.maxRecursionDepth || 0
      },
      validationErrors: this.validationErrors.length
    };
  }
  
  /**
   * Export configuration for sharing/backup
   */
  export() {
    return {
      version: '1.0.0',
      timestamp: Date.now(),
      environment: this.environment,
      config: this.getPublicConfig()
    };
  }
  
  /**
   * Import configuration from export
   */
  import(exportData) {
    if (exportData.version !== '1.0.0') {
      console.warn('⚠️ Configuration version mismatch, proceeding with caution');
    }
    
    this.update(exportData.config);
    console.log('📥 Configuration imported successfully');
  }
  
  /**
   * Validate a configuration object without applying it
   */
  static validate(config) {
    const manager = new ConfigManager();
    manager.finalConfig = manager.deepMerge(manager.baseConfig, config);
    manager.validate();
    
    return {
      isValid: manager.validationErrors.length === 0,
      errors: manager.validationErrors,
      warnings: manager.validationErrors.filter(e => e.includes('may'))
    };
  }
  
  /**
   * Create a configuration for a specific use case
   */
  static createPreset(preset) {
    const presets = {
      'high-performance': {
        revolvingDoor: {
          conveyorBeltCycle: 1500,
          maxLocalCacheSize: 100,
          preloadLookahead: 8
        },
        integration: {
          syncMode: 'aggressive',
          maxPrefetchDistance: 10
        }
      },
      
      'low-memory': {
        revolvingDoor: {
          maxLocalCacheSize: 20,
          preloadLookahead: 1
        },
        payloadCache: {
          payloadBatchSize: 3
        },
        integration: {
          syncMode: 'conservative',
          enablePredictivePrefetch: false
        }
      },
      
      'balanced': {
        // Uses defaults
      }
    };
    
    if (!presets[preset]) {
      throw new Error(`Unknown preset: ${preset}. Available: ${Object.keys(presets).join(', ')}`);
    }
    
    return new ConfigManager(presets[preset]);
  }
  
  /**
   * Get adaptation history if using adaptive config
   */
  getAdaptationHistory() {
    return this.adaptiveConfig ? this.adaptiveConfig.getAdaptationHistory() : [];
  }
  
  /**
   * Clean up resources
   */
  destroy() {
    if (this.adaptiveConfig) {
      this.adaptiveConfig.destroy();
    }
  }
}

/**
 * Create a configuration manager with environment detection
 * @param {Object} userConfig - User configuration overrides
 */
export function createConfig(userConfig = {}) {
  return new ConfigManager(userConfig);
}

/**
 * Utility function to get default config for environment
 * @param {string} environment - Target environment
 */
export function getDefaultConfig(environment = null) {
  if (!environment) {
    const manager = new ConfigManager();
    return manager.getDefaultConfig();
  }
  
  if (!DEFAULT_CONFIGS[environment]) {
    throw new Error(`Unknown environment: ${environment}`);
  }
  
  return JSON.parse(JSON.stringify(DEFAULT_CONFIGS[environment]));
}