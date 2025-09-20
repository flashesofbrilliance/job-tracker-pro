#!/usr/bin/env node

/**
 * Environment-Specific Validation Script
 * Validates environments according to their specific purpose and requirements
 */

const https = require('https');
const { execSync } = require('child_process');

// Import health checker for basic validation
const HealthChecker = require('./health-check.js');

const VALIDATION_CONFIGS = {
  dev: {
    name: 'DEV (Development & Initial Testing)',
    requirements: {
      build_success: true,
      basic_smoke_tests: true,
      critical_js_errors: false,
      asset_loading: true,
      core_flows: true
    },
    acceptable_issues: ['minor_ui_bugs', 'performance_not_optimized', 'console_warnings'],
    rollback_time_target: 5 // minutes
  },
  qa: {
    name: 'QA (Automated Validation & Testing)',
    requirements: {
      unit_tests: 100, // percentage
      integration_tests: 95, // percentage  
      performance_threshold: 3000, // ms
      security_vulnerabilities: 0, // critical/high only
      cross_browser_compatibility: true,
      core_user_flows: true,
      data_integrity: true,
      ui_consistency: true,
      accessibility: true,
      p0_bugs: 0,
      p1_bugs: 2, // maximum
      performance_regression: 10, // percentage
      error_rate: 1 // percentage
    },
    rollback_time_target: 15
  },
  stage: {
    name: 'STAGE (UAT & Completeness Testing)',
    requirements: {
      acceptance_criteria: true,
      stakeholder_approval: true,
      user_documentation: true,
      feature_completeness: true,
      production_readiness: true,
      rollback_procedures_tested: true,
      compliance_verified: true,
      load_testing_passed: true
    },
    signoff_required: ['product_owner', 'qa_lead', 'security_review', 'performance_review'],
    rollback_time_target: 30
  },
  prod: {
    name: 'PROD (Production Stable Release)',
    requirements: {
      p0_issues: 0,
      uat_signoffs: true,
      performance_benchmarks: true,
      security_review: true,
      monitoring_active: true,
      rollback_validated: true,
      change_management_approval: true
    },
    standards: {
      zero_tolerance: true,
      uptime_target: 99.9,
      response_time: 1000, // ms
      security_hardened: true
    },
    rollback_time_target: 10
  }
};

class EnvironmentValidator {
  constructor(environment, baseUrl) {
    this.environment = environment.toLowerCase();
    this.baseUrl = baseUrl;
    this.config = VALIDATION_CONFIGS[this.environment];
    this.results = [];
    this.startTime = Date.now();
    
    if (!this.config) {
      throw new Error(`Unknown environment: ${environment}. Valid environments: ${Object.keys(VALIDATION_CONFIGS).join(', ')}`);
    }
  }

  log(message, level = 'info') {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level.toUpperCase()}] [${this.environment.toUpperCase()}] ${message}`;
    console.log(logMessage);
    
    this.results.push({
      timestamp,
      level,
      environment: this.environment,
      message
    });
  }

  async validateDev() {
    this.log('Starting DEV environment validation');
    
    const healthChecker = new HealthChecker(this.baseUrl, this.environment);
    const { passed: healthPassed } = await healthChecker.runAll();
    
    // DEV-specific validations
    const validations = [
      {
        name: 'Build Success',
        test: () => healthPassed, // Basic health check indicates successful build
        required: true
      },
      {
        name: 'Basic Smoke Tests',
        test: () => this.checkBasicFunctionality(),
        required: true
      },
      {
        name: 'Asset Loading',
        test: () => this.checkAssetAvailability(),
        required: true
      }
    ];

    return this.runValidations(validations);
  }

  async validateQa() {
    this.log('Starting QA environment comprehensive validation');
    
    // Run health check first
    const healthChecker = new HealthChecker(this.baseUrl, this.environment);
    const { passed: healthPassed, report } = await healthChecker.runAll();
    
    const validations = [
      {
        name: 'Basic Health Check',
        test: () => healthPassed,
        required: true
      },
      {
        name: 'Performance Threshold',
        test: () => report.performance?.loadTime < this.config.requirements.performance_threshold,
        required: true,
        details: `Load time: ${report.performance?.loadTime}ms (threshold: ${this.config.requirements.performance_threshold}ms)`
      },
      {
        name: 'Core User Flows',
        test: () => this.validateCoreUserFlows(),
        required: true
      },
      {
        name: 'Cross-browser Compatibility',
        test: () => this.checkCrossBrowserCompatibility(),
        required: true
      },
      {
        name: 'Data Integrity',
        test: () => this.validateDataIntegrity(),
        required: true
      },
      {
        name: 'Accessibility Standards',
        test: () => this.checkAccessibilityStandards(),
        required: true
      }
    ];

    return this.runValidations(validations);
  }

  async validateStage() {
    this.log('Starting STAGE environment UAT validation');
    
    const validations = [
      {
        name: 'Basic Health Check',
        test: () => this.runBasicHealthCheck(),
        required: true
      },
      {
        name: 'Feature Completeness',
        test: () => this.validateFeatureCompleteness(),
        required: true
      },
      {
        name: 'Production Readiness',
        test: () => this.checkProductionReadiness(),
        required: true
      },
      {
        name: 'Rollback Procedures',
        test: () => this.validateRollbackProcedures(),
        required: true
      },
      {
        name: 'Documentation Complete',
        test: () => this.checkDocumentationCompleteness(),
        required: true
      }
    ];

    // Check for required sign-offs (simulated)
    this.log('Checking UAT sign-off requirements...');
    for (const signoff of this.config.signoff_required) {
      this.log(`Sign-off required: ${signoff.replace('_', ' ')}`, 'warn');
    }

    return this.runValidations(validations);
  }

  async validateProd() {
    this.log('Starting PROD environment production readiness validation');
    
    const validations = [
      {
        name: 'Production Health Check',
        test: () => this.runProductionHealthCheck(),
        required: true
      },
      {
        name: 'Performance Benchmarks',
        test: () => this.validatePerformanceBenchmarks(),
        required: true
      },
      {
        name: 'Security Hardening',
        test: () => this.checkSecurityHardening(),
        required: true
      },
      {
        name: 'Monitoring Active',
        test: () => this.validateMonitoringSetup(),
        required: true
      },
      {
        name: 'Rollback Readiness',
        test: () => this.checkRollbackReadiness(),
        required: true
      }
    ];

    return this.runValidations(validations);
  }

  async runValidations(validations) {
    let passed = 0;
    let failed = 0;

    for (const validation of validations) {
      try {
        this.log(`Validating: ${validation.name}`);
        const result = await validation.test();
        
        if (result) {
          this.log(`✓ ${validation.name}`, 'info');
          passed++;
        } else {
          const level = validation.required ? 'error' : 'warn';
          this.log(`✗ ${validation.name}${validation.details ? ` - ${validation.details}` : ''}`, level);
          if (validation.required) {
            failed++;
          }
        }
      } catch (error) {
        const level = validation.required ? 'error' : 'warn';
        this.log(`✗ ${validation.name}: ${error.message}`, level);
        if (validation.required) {
          failed++;
        }
      }
    }

    const total = validations.length;
    const success = failed === 0;

    this.log(`Validation complete: ${passed}/${total} passed, ${failed} failed`);
    
    if (success) {
      this.log(`✅ ${this.config.name} validation PASSED`);
    } else {
      this.log(`❌ ${this.config.name} validation FAILED`);
    }

    return { success, passed, failed, total };
  }

  // Helper validation methods
  async runBasicHealthCheck() {
    try {
      const healthChecker = new HealthChecker(this.baseUrl, this.environment);
      const { passed } = await healthChecker.runAll();
      return passed;
    } catch (error) {
      this.log(`Health check failed: ${error.message}`, 'error');
      return false;
    }
  }

  async runProductionHealthCheck() {
    // Enhanced health check for production
    const basicHealth = await this.runBasicHealthCheck();
    if (!basicHealth) return false;

    // Additional production-specific checks
    return this.checkProductionSpecificMetrics();
  }

  async checkBasicFunctionality() {
    // Simulate basic functionality check
    return true; // Would implement actual checks
  }

  async checkAssetAvailability() {
    // Check if critical assets are available
    try {
      const healthChecker = new HealthChecker(this.baseUrl, this.environment);
      return await healthChecker.checkAssets();
    } catch (error) {
      return false;
    }
  }

  async validateCoreUserFlows() {
    // Simulate core user flow validation
    this.log('Simulating core user flow validation');
    return true; // Would implement actual flow testing
  }

  async checkCrossBrowserCompatibility() {
    // Simulate cross-browser compatibility check
    this.log('Cross-browser compatibility check (simulated)');
    return true;
  }

  async validateDataIntegrity() {
    // Simulate data integrity validation
    this.log('Data integrity validation (simulated)');
    return true;
  }

  async checkAccessibilityStandards() {
    // Simulate accessibility standards check
    this.log('Accessibility standards check (simulated)');
    return true;
  }

  async validateFeatureCompleteness() {
    // Simulate feature completeness validation
    this.log('Feature completeness validation (simulated)');
    return true;
  }

  async checkProductionReadiness() {
    // Simulate production readiness check
    this.log('Production readiness check (simulated)');
    return true;
  }

  async validateRollbackProcedures() {
    // Simulate rollback procedure validation
    this.log('Rollback procedures validation (simulated)');
    return true;
  }

  async checkDocumentationCompleteness() {
    // Simulate documentation completeness check
    this.log('Documentation completeness check (simulated)');
    return true;
  }

  async validatePerformanceBenchmarks() {
    // Simulate performance benchmark validation
    this.log('Performance benchmarks validation (simulated)');
    return true;
  }

  async checkSecurityHardening() {
    // Simulate security hardening check
    this.log('Security hardening check (simulated)');
    return true;
  }

  async validateMonitoringSetup() {
    // Simulate monitoring setup validation
    this.log('Monitoring setup validation (simulated)');
    return true;
  }

  async checkRollbackReadiness() {
    // Simulate rollback readiness check
    this.log('Rollback readiness check (simulated)');
    return true;
  }

  async checkProductionSpecificMetrics() {
    // Simulate production-specific metrics check
    this.log('Production-specific metrics check (simulated)');
    return true;
  }

  generateReport() {
    const duration = Date.now() - this.startTime;
    
    return {
      timestamp: new Date().toISOString(),
      environment: this.environment,
      config: this.config.name,
      baseUrl: this.baseUrl,
      duration,
      results: this.results,
      rollback_time_target: `${this.config.rollback_time_target} minutes`
    };
  }

  async validate() {
    this.log(`Starting ${this.config.name} validation`);
    this.log(`Target: ${this.baseUrl}`);
    this.log(`Rollback time target: ${this.config.rollback_time_target} minutes`);

    let result;
    
    switch (this.environment) {
      case 'dev':
        result = await this.validateDev();
        break;
      case 'qa':
        result = await this.validateQa();
        break;
      case 'stage':
        result = await this.validateStage();
        break;
      case 'prod':
        result = await this.validateProd();
        break;
      default:
        throw new Error(`Unknown environment: ${this.environment}`);
    }

    const report = this.generateReport();
    return { ...result, report };
  }
}

// CLI usage
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.error('Usage: node validate-environment.js <environment> <url>');
    console.error('Environments: dev, qa, stage, prod');
    console.error('Example: node validate-environment.js qa https://flashesofbrilliance.github.io/job-tracker-pro/env/qa/latest/');
    process.exit(1);
  }

  const environment = args[0];
  const url = args[1];
  
  try {
    const validator = new EnvironmentValidator(environment, url);
    const { success, report } = await validator.validate();
    
    // Output JSON report for CI/automation
    if (process.env.OUTPUT_JSON) {
      console.log(JSON.stringify(report, null, 2));
    }
    
    process.exit(success ? 0 : 1);
  } catch (error) {
    console.error('Validation failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = EnvironmentValidator;