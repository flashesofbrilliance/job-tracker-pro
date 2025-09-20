#!/usr/bin/env node

/**
 * Change Tracking Utility
 * Tracks changes between MR/PR/commit/deploy for rollback and audit purposes
 */

const { execSync } = require('child_process');
const fs = require('fs');
const crypto = require('crypto');

class ChangeTracker {
  constructor() {
    this.changes = {
      timestamp: new Date().toISOString(),
      commit_info: {},
      file_changes: {},
      performance_impact: {},
      security_impact: {},
      rollback_info: {}
    };
  }

  log(message, level = 'info') {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}`);
  }

  executeGitCommand(command) {
    try {
      return execSync(command, { encoding: 'utf8' }).trim();
    } catch (error) {
      this.log(`Git command failed: ${command}`, 'error');
      return null;
    }
  }

  getCurrentCommitInfo() {
    this.log('Gathering current commit information...');
    
    const commitSha = this.executeGitCommand('git rev-parse HEAD');
    const shortSha = this.executeGitCommand('git rev-parse --short HEAD');
    const branch = this.executeGitCommand('git rev-parse --abbrev-ref HEAD');
    const author = this.executeGitCommand('git log -1 --format="%an"');
    const authorEmail = this.executeGitCommand('git log -1 --format="%ae"');
    const commitMessage = this.executeGitCommand('git log -1 --format="%s"');
    const commitDate = this.executeGitCommand('git log -1 --format="%ci"');
    const remoteUrl = this.executeGitCommand('git remote get-url origin');

    this.changes.commit_info = {
      sha: commitSha,
      short_sha: shortSha,
      branch,
      author,
      author_email: authorEmail,
      message: commitMessage,
      date: commitDate,
      remote_url: remoteUrl
    };

    return this.changes.commit_info;
  }

  getChangesSinceCommit(previousCommit) {
    this.log(`Analyzing changes since ${previousCommit}...`);
    
    if (!previousCommit) {
      this.log('No previous commit provided, analyzing last commit', 'warn');
      previousCommit = 'HEAD~1';
    }

    // Get list of changed files
    const changedFiles = this.executeGitCommand(`git diff --name-only ${previousCommit}..HEAD`);
    const filesArray = changedFiles ? changedFiles.split('\n').filter(f => f.trim()) : [];

    // Get detailed file statistics
    const fileStats = {};
    let totalLinesAdded = 0;
    let totalLinesRemoved = 0;

    for (const file of filesArray) {
      const stats = this.executeGitCommand(`git diff --numstat ${previousCommit}..HEAD -- "${file}"`);
      if (stats) {
        const [added, removed] = stats.split('\t');
        const addedNum = parseInt(added) || 0;
        const removedNum = parseInt(removed) || 0;
        
        fileStats[file] = {
          lines_added: addedNum,
          lines_removed: removedNum,
          net_change: addedNum - removedNum
        };
        
        totalLinesAdded += addedNum;
        totalLinesRemoved += removedNum;
      }
    }

    // Categorize file changes
    const categorizedChanges = this.categorizeFileChanges(filesArray);

    this.changes.file_changes = {
      previous_commit: previousCommit,
      total_files_changed: filesArray.length,
      total_lines_added: totalLinesAdded,
      total_lines_removed: totalLinesRemoved,
      net_change: totalLinesAdded - totalLinesRemoved,
      files: fileStats,
      categories: categorizedChanges
    };

    return this.changes.file_changes;
  }

  categorizeFileChanges(files) {
    const categories = {
      source_code: [],
      tests: [],
      documentation: [],
      configuration: [],
      assets: [],
      workflows: [],
      other: []
    };

    for (const file of files) {
      const ext = file.split('.').pop()?.toLowerCase();
      const path = file.toLowerCase();

      if (path.includes('test') || path.includes('spec') || ext === 'test.js') {
        categories.tests.push(file);
      } else if (ext === 'md' || path.includes('doc') || path.includes('readme')) {
        categories.documentation.push(file);
      } else if (path.includes('.github/workflows') || ext === 'yml' || ext === 'yaml') {
        categories.workflows.push(file);
      } else if (ext === 'json' || ext === 'env' || path.includes('config')) {
        categories.configuration.push(file);
      } else if (ext === 'css' || ext === 'scss' || ext === 'png' || ext === 'jpg' || ext === 'svg') {
        categories.assets.push(file);
      } else if (ext === 'js' || ext === 'ts' || ext === 'html') {
        categories.source_code.push(file);
      } else {
        categories.other.push(file);
      }
    }

    return categories;
  }

  analyzeSecurityImpact(files) {
    this.log('Analyzing security impact...');
    
    const securitySensitivePatterns = [
      'auth', 'password', 'token', 'key', 'secret', 'credential',
      'login', 'permission', 'role', 'security', 'encrypt', 'decrypt'
    ];
    
    const securitySensitiveFiles = files.filter(file => {
      const fileLower = file.toLowerCase();
      return securitySensitivePatterns.some(pattern => 
        fileLower.includes(pattern)
      );
    });

    // Check for potential security issues in commit message
    const commitMessage = this.changes.commit_info?.message?.toLowerCase() || '';
    const hasSecurityKeywords = securitySensitivePatterns.some(pattern => 
      commitMessage.includes(pattern)
    );

    this.changes.security_impact = {
      security_sensitive_files: securitySensitiveFiles,
      has_security_keywords: hasSecurityKeywords,
      requires_security_review: securitySensitiveFiles.length > 0 || hasSecurityKeywords,
      risk_level: this.calculateSecurityRiskLevel(securitySensitiveFiles, hasSecurityKeywords)
    };

    return this.changes.security_impact;
  }

  calculateSecurityRiskLevel(sensitiveFiles, hasSecurityKeywords) {
    let risk = 'low';
    
    if (sensitiveFiles.length > 5 || hasSecurityKeywords) {
      risk = 'high';
    } else if (sensitiveFiles.length > 0) {
      risk = 'medium';
    }
    
    return risk;
  }

  estimatePerformanceImpact(categories) {
    this.log('Estimating performance impact...');
    
    const performanceImpactingChanges = {
      source_code: categories.source_code || [],
      assets: categories.assets || [],
      configuration: categories.configuration || []
    };

    let impactLevel = 'low';
    let impactAreas = [];

    if (performanceImpactingChanges.source_code.length > 10) {
      impactLevel = 'high';
      impactAreas.push('Large code changes may affect runtime performance');
    } else if (performanceImpactingChanges.source_code.length > 0) {
      impactLevel = 'medium';
      impactAreas.push('Code changes may affect performance');
    }

    if (performanceImpactingChanges.assets.length > 0) {
      impactLevel = Math.max(impactLevel, 'medium');
      impactAreas.push('Asset changes may affect load times');
    }

    if (performanceImpactingChanges.configuration.length > 0) {
      impactAreas.push('Configuration changes may affect system behavior');
    }

    this.changes.performance_impact = {
      impact_level: impactLevel,
      impact_areas: impactAreas,
      requires_performance_testing: impactLevel !== 'low',
      changed_files_by_category: performanceImpactingChanges
    };

    return this.changes.performance_impact;
  }

  generateRollbackPlan(currentCommit, previousCommit) {
    this.log('Generating rollback plan...');
    
    const rollbackCommands = [
      `git checkout ${previousCommit}`,
      'npm run build',
      'npm run health:check',
      `# Verify rollback: git log --oneline -5`
    ];

    const rollbackSteps = [
      'Stop current deployment/traffic',
      'Execute rollback commands',
      'Verify application functionality',
      'Run health checks',
      'Monitor for issues',
      'Update monitoring/alerting',
      'Notify stakeholders of rollback'
    ];

    this.changes.rollback_info = {
      current_commit: currentCommit,
      rollback_target: previousCommit,
      rollback_commands: rollbackCommands,
      rollback_steps: rollbackSteps,
      validation_required: true,
      estimated_rollback_time: '10-15 minutes'
    };

    return this.changes.rollback_info;
  }

  generateChangeManifest() {
    this.log('Generating deployment change manifest...');
    
    const manifest = {
      ...this.changes,
      manifest_version: '1.0.0',
      generated_at: new Date().toISOString(),
      checksum: this.calculateManifestChecksum()
    };

    return manifest;
  }

  calculateManifestChecksum() {
    const manifestData = JSON.stringify(this.changes, null, 0);
    return crypto.createHash('sha256').update(manifestData).digest('hex');
  }

  saveManifest(outputPath) {
    const manifest = this.generateChangeManifest();
    const manifestPath = outputPath || `./change-manifest-${Date.now()}.json`;
    
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    this.log(`Change manifest saved to: ${manifestPath}`);
    
    return manifestPath;
  }

  async trackChanges(previousCommit, outputPath) {
    this.log('Starting change tracking analysis...');
    
    // Gather commit information
    this.getCurrentCommitInfo();
    
    // Analyze file changes
    this.getChangesSinceCommit(previousCommit);
    
    const changedFiles = Object.keys(this.changes.file_changes.files || {});
    
    // Analyze security impact
    this.analyzeSecurityImpact(changedFiles);
    
    // Estimate performance impact
    this.estimatePerformanceImpact(this.changes.file_changes.categories);
    
    // Generate rollback plan
    this.generateRollbackPlan(
      this.changes.commit_info.sha,
      previousCommit || 'HEAD~1'
    );
    
    // Save manifest
    const manifestPath = this.saveManifest(outputPath);
    
    this.log('Change tracking analysis complete');
    
    return {
      changes: this.changes,
      manifest_path: manifestPath,
      summary: this.generateSummary()
    };
  }

  generateSummary() {
    const fileChanges = this.changes.file_changes;
    const securityImpact = this.changes.security_impact;
    const performanceImpact = this.changes.performance_impact;
    
    return {
      total_files_changed: fileChanges.total_files_changed || 0,
      lines_changed: `+${fileChanges.total_lines_added || 0}/-${fileChanges.total_lines_removed || 0}`,
      security_risk: securityImpact.risk_level || 'low',
      performance_impact: performanceImpact.impact_level || 'low',
      requires_security_review: securityImpact.requires_security_review || false,
      requires_performance_testing: performanceImpact.requires_performance_testing || false,
      rollback_time_estimate: this.changes.rollback_info.estimated_rollback_time || '10-15 minutes'
    };
  }

  static async compareEnvironments(sourceEnv, targetEnv) {
    // This would compare deployed versions between environments
    // For now, return a placeholder
    return {
      source_environment: sourceEnv,
      target_environment: targetEnv,
      version_difference: 'Not implemented',
      deployment_readiness: 'Manual verification required'
    };
  }
}

// CLI usage
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.error('Usage: node track-changes.js [previous-commit] [output-path]');
    console.error('Examples:');
    console.error('  node track-changes.js                    # Compare with HEAD~1');
    console.error('  node track-changes.js v1.2.0             # Compare with v1.2.0');
    console.error('  node track-changes.js HEAD~3 ./changes.json  # Compare with HEAD~3, save to ./changes.json');
    process.exit(1);
  }

  const previousCommit = args[0] === 'help' ? null : args[0];
  const outputPath = args[1];

  if (previousCommit === null) {
    console.error('Usage shown above');
    process.exit(1);
  }

  try {
    const tracker = new ChangeTracker();
    const result = await tracker.trackChanges(previousCommit, outputPath);
    
    console.log('\n=== CHANGE TRACKING SUMMARY ===');
    console.log(`Files changed: ${result.summary.total_files_changed}`);
    console.log(`Lines changed: ${result.summary.lines_changed}`);
    console.log(`Security risk: ${result.summary.security_risk}`);
    console.log(`Performance impact: ${result.summary.performance_impact}`);
    console.log(`Security review required: ${result.summary.requires_security_review}`);
    console.log(`Performance testing required: ${result.summary.requires_performance_testing}`);
    console.log(`Rollback time estimate: ${result.summary.rollback_time_estimate}`);
    console.log(`Change manifest: ${result.manifest_path}`);
    
    // Output JSON for automation
    if (process.env.OUTPUT_JSON) {
      console.log('\n=== JSON OUTPUT ===');
      console.log(JSON.stringify(result.changes, null, 2));
    }
    
  } catch (error) {
    console.error('Change tracking failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = ChangeTracker;