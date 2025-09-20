#!/usr/bin/env node

/**
 * Health Check Script for Job Tracker Pro
 * Validates deployment health and core functionality
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const TIMEOUT = 10000; // 10 second timeout
const MAX_RETRIES = 3;

class HealthChecker {
  constructor(baseUrl, environment = 'unknown') {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.environment = environment;
    this.results = [];
    this.startTime = Date.now();
  }

  log(message, level = 'info') {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
    console.log(logMessage);
    
    this.results.push({
      timestamp,
      level,
      message,
      environment: this.environment
    });
  }

  async httpGet(url) {
    return new Promise((resolve, reject) => {
      const request = https.get(url, { timeout: TIMEOUT }, (response) => {
        let data = '';
        response.on('data', chunk => data += chunk);
        response.on('end', () => {
          resolve({
            statusCode: response.statusCode,
            headers: response.headers,
            body: data
          });
        });
      });

      request.on('timeout', () => {
        request.destroy();
        reject(new Error(`Request timeout after ${TIMEOUT}ms`));
      });

      request.on('error', reject);
    });
  }

  async retryRequest(url, retries = MAX_RETRIES) {
    for (let i = 0; i < retries; i++) {
      try {
        return await this.httpGet(url);
      } catch (error) {
        if (i === retries - 1) throw error;
        this.log(`Retry ${i + 1}/${retries} for ${url}: ${error.message}`, 'warn');
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1))); // Exponential backoff
      }
    }
  }

  async checkPageLoad() {
    this.log(`Checking page load: ${this.baseUrl}/`);
    
    try {
      const response = await this.retryRequest(this.baseUrl + '/');
      
      if (response.statusCode !== 200) {
        throw new Error(`HTTP ${response.statusCode}`);
      }

      const html = response.body;
      
      // Basic HTML structure checks
      const checks = [
        { name: 'Has DOCTYPE', test: () => html.includes('<!DOCTYPE') || html.includes('<!doctype') },
        { name: 'Has title tag', test: () => html.includes('<title>') },
        { name: 'Has body tag', test: () => html.includes('<body') },
        { name: 'Contains Job Tracker', test: () => html.toLowerCase().includes('job tracker') },
        { name: 'Has main CSS', test: () => html.includes('style.css') },
        { name: 'Has main JS', test: () => html.includes('app.js') },
        { name: 'No obvious errors', test: () => !html.toLowerCase().includes('error') && !html.toLowerCase().includes('404') }
      ];

      let passed = 0;
      for (const check of checks) {
        if (check.test()) {
          this.log(`✓ ${check.name}`, 'info');
          passed++;
        } else {
          this.log(`✗ ${check.name}`, 'error');
        }
      }

      if (passed === checks.length) {
        this.log('Page load check: PASSED', 'info');
        return true;
      } else {
        this.log(`Page load check: FAILED (${passed}/${checks.length} checks passed)`, 'error');
        return false;
      }

    } catch (error) {
      this.log(`Page load check failed: ${error.message}`, 'error');
      return false;
    }
  }

  async checkAssets() {
    this.log('Checking critical assets...');
    
    const assets = [
      '/style.css',
      '/app.js'
    ];

    let allPassed = true;

    for (const asset of assets) {
      try {
        const response = await this.retryRequest(this.baseUrl + asset);
        
        if (response.statusCode === 200) {
          this.log(`✓ Asset available: ${asset}`, 'info');
        } else {
          this.log(`✗ Asset failed: ${asset} (HTTP ${response.statusCode})`, 'error');
          allPassed = false;
        }
      } catch (error) {
        this.log(`✗ Asset failed: ${asset} (${error.message})`, 'error');
        allPassed = false;
      }
    }

    return allPassed;
  }

  async checkPerformance() {
    this.log('Checking performance...');
    
    const performanceStart = Date.now();
    
    try {
      await this.retryRequest(this.baseUrl + '/');
      const loadTime = Date.now() - performanceStart;
      
      const thresholds = {
        good: 1000,    // < 1s
        acceptable: 3000, // < 3s
        poor: 5000     // < 5s
      };

      let status = 'good';
      if (loadTime > thresholds.poor) {
        status = 'poor';
        this.log(`⚠ Performance: POOR (${loadTime}ms > ${thresholds.poor}ms)`, 'warn');
      } else if (loadTime > thresholds.acceptable) {
        status = 'acceptable';
        this.log(`⚠ Performance: ACCEPTABLE (${loadTime}ms)`, 'warn');
      } else {
        this.log(`✓ Performance: GOOD (${loadTime}ms)`, 'info');
      }

      return { status, loadTime };
    } catch (error) {
      this.log(`Performance check failed: ${error.message}`, 'error');
      return { status: 'failed', loadTime: -1 };
    }
  }

  async checkBuildCatalog() {
    // Only check build catalog for the main site
    if (!this.baseUrl.includes('/env/')) {
      this.log('Checking build catalog...');
      
      try {
        const response = await this.retryRequest(this.baseUrl + '/');
        
        if (response.statusCode === 200 && 
            response.body.toLowerCase().includes('build catalog')) {
          this.log('✓ Build catalog available', 'info');
          return true;
        } else {
          this.log('✗ Build catalog not found', 'error');
          return false;
        }
      } catch (error) {
        this.log(`Build catalog check failed: ${error.message}`, 'error');
        return false;
      }
    }
    return true; // Skip for environment-specific URLs
  }

  generateReport() {
    const duration = Date.now() - this.startTime;
    const errors = this.results.filter(r => r.level === 'error').length;
    const warnings = this.results.filter(r => r.level === 'warn').length;
    
    const report = {
      timestamp: new Date().toISOString(),
      environment: this.environment,
      baseUrl: this.baseUrl,
      duration,
      summary: {
        total_checks: this.results.length,
        errors,
        warnings,
        status: errors > 0 ? 'FAILED' : warnings > 0 ? 'WARNING' : 'PASSED'
      },
      results: this.results
    };

    return report;
  }

  async runAll() {
    this.log(`Starting health check for ${this.environment}: ${this.baseUrl}`);
    
    const checks = [
      () => this.checkPageLoad(),
      () => this.checkAssets(),
      () => this.checkBuildCatalog()
    ];

    let allPassed = true;
    const results = {};

    for (const check of checks) {
      try {
        const result = await check();
        if (result === false) {
          allPassed = false;
        }
      } catch (error) {
        this.log(`Check failed with exception: ${error.message}`, 'error');
        allPassed = false;
      }
    }

    // Always run performance check but don't fail on it
    const performance = await this.checkPerformance();
    results.performance = performance;

    const report = this.generateReport();
    
    this.log(`Health check completed: ${report.summary.status}`);
    this.log(`Duration: ${report.duration}ms, Errors: ${report.summary.errors}, Warnings: ${report.summary.warnings}`);
    
    return { passed: allPassed, report };
  }
}

// CLI usage
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 1) {
    console.error('Usage: node health-check.js <url> [environment]');
    console.error('Example: node health-check.js https://flashesofbrilliance.github.io/job-tracker-pro/ prod');
    process.exit(1);
  }

  const url = args[0];
  const environment = args[1] || 'unknown';
  
  const checker = new HealthChecker(url, environment);
  
  try {
    const { passed, report } = await checker.runAll();
    
    // Output JSON report for CI/automation
    if (process.env.OUTPUT_JSON) {
      console.log(JSON.stringify(report, null, 2));
    }
    
    process.exit(passed ? 0 : 1);
  } catch (error) {
    console.error('Health check failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = HealthChecker;