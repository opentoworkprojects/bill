#!/usr/bin/env node

/**
 * Environment Variables Validation Script for RestoBill AI Frontend
 *
 * This script validates that all required environment variables are set
 * and provides helpful guidance for missing or incorrectly configured variables.
 */

const fs = require('fs');
const path = require('path');

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Helper functions
const log = (message, color = colors.reset) => {
  console.log(`${color}${message}${colors.reset}`);
};

const logSuccess = (message) => log(`✅ ${message}`, colors.green);
const logWarning = (message) => log(`⚠️  ${message}`, colors.yellow);
const logError = (message) => log(`❌ ${message}`, colors.red);
const logInfo = (message) => log(`ℹ️  ${message}`, colors.blue);
const logHeader = (message) => log(`\n${colors.bright}${message}${colors.reset}`, colors.cyan);

// Environment variable definitions
const envConfig = {
  required: {
    'REACT_APP_BACKEND_URL': {
      description: 'Backend API server URL',
      example: 'http://localhost:5000',
      validate: (value) => {
        if (!value) return 'Backend URL is required';
        if (!value.startsWith('http://') && !value.startsWith('https://')) {
          return 'Backend URL must start with http:// or https://';
        }
        if (value.endsWith('/')) {
          return 'Backend URL should not end with a trailing slash';
        }
        return null;
      }
    }
  },

  important: {
    'REACT_APP_RAZORPAY_KEY_ID': {
      description: 'Razorpay payment gateway key ID',
      example: 'rzp_test_xxxxxxxxxx',
      validate: (value) => {
        if (!value) return 'Razorpay key is highly recommended for payment features';
        if (!value.startsWith('rzp_test_') && !value.startsWith('rzp_live_')) {
          return 'Razorpay key should start with rzp_test_ or rzp_live_';
        }
        if (value.startsWith('rzp_live_') && process.env.NODE_ENV !== 'production') {
          return 'Using live Razorpay key in non-production environment';
        }
        return null;
      }
    },

    'REACT_APP_ENVIRONMENT': {
      description: 'Application environment',
      example: 'development',
      validate: (value) => {
        const validEnvs = ['development', 'staging', 'production'];
        if (value && !validEnvs.includes(value)) {
          return `Environment should be one of: ${validEnvs.join(', ')}`;
        }
        return null;
      }
    }
  },

  optional: {
    'REACT_APP_GOOGLE_MAPS_API_KEY': {
      description: 'Google Maps API key for location features',
      example: 'AIzaSyxxxxxxxxxxxxxxxxxxxxxxxxxx',
      validate: (value) => {
        if (value && !value.startsWith('AIza')) {
          return 'Google Maps API key should start with "AIza"';
        }
        return null;
      }
    },

    'REACT_APP_FIREBASE_PROJECT_ID': {
      description: 'Firebase project ID for push notifications',
      example: 'your-project-id-here'
    },

    'REACT_APP_GA_TRACKING_ID': {
      description: 'Google Analytics tracking ID',
      example: 'GA-XXXXXXXXX-X',
      validate: (value) => {
        if (value && !value.match(/^GA-\w+-\w+$/)) {
          return 'Google Analytics ID should match format GA-XXXXXXXXX-X';
        }
        return null;
      }
    },

    'REACT_APP_SENTRY_DSN': {
      description: 'Sentry error tracking DSN',
      example: 'https://xxx@sentry.io/project-id',
      validate: (value) => {
        if (value && !value.startsWith('https://') && !value.includes('sentry.io')) {
          return 'Sentry DSN should be a valid Sentry URL';
        }
        return null;
      }
    }
  },

  buildTools: {
    'PORT': {
      description: 'Development server port',
      example: '3000',
      validate: (value) => {
        if (value && (isNaN(value) || parseInt(value) < 1 || parseInt(value) > 65535)) {
          return 'Port must be a valid number between 1 and 65535';
        }
        return null;
      }
    },

    'GENERATE_SOURCEMAP': {
      description: 'Generate source maps for debugging',
      example: 'true'
    },

    'SKIP_PREFLIGHT_CHECK': {
      description: 'Skip Create React App preflight check',
      example: 'true'
    }
  }
};

// Load environment variables from various sources
function loadEnvironmentVariables() {
  const envFiles = [
    '.env.local',
    '.env.development',
    '.env.production',
    '.env.staging',
    '.env'
  ];

  const rootDir = path.join(__dirname, '..');
  const loadedVars = { ...process.env };
  const sources = {};

  envFiles.forEach(filename => {
    const filepath = path.join(rootDir, filename);
    if (fs.existsSync(filepath)) {
      try {
        const content = fs.readFileSync(filepath, 'utf8');
        const lines = content.split('\n');

        lines.forEach(line => {
          line = line.trim();
          if (line && !line.startsWith('#')) {
            const [key, ...valueParts] = line.split('=');
            if (key && valueParts.length > 0) {
              const value = valueParts.join('=').replace(/^["']|["']$/g, '');
              if (!loadedVars[key]) {
                loadedVars[key] = value;
                sources[key] = filename;
              }
            }
          }
        });
      } catch (error) {
        logWarning(`Could not read ${filename}: ${error.message}`);
      }
    }
  });

  return { vars: loadedVars, sources };
}

// Validate environment configuration
function validateEnvironment() {
  logHeader('🔍 RestoBill AI Frontend - Environment Validation');

  const { vars: envVars, sources } = loadEnvironmentVariables();
  const results = {
    required: { valid: 0, invalid: 0, missing: 0 },
    important: { valid: 0, invalid: 0, missing: 0 },
    optional: { valid: 0, invalid: 0, missing: 0 },
    buildTools: { valid: 0, invalid: 0, missing: 0 }
  };

  // Helper function to validate variable category
  function validateCategory(categoryName, variables, isRequired = false) {
    logHeader(`${categoryName.toUpperCase()} Variables`);

    Object.entries(variables).forEach(([varName, config]) => {
      const value = envVars[varName];
      const source = sources[varName];

      if (!value) {
        if (isRequired) {
          logError(`${varName} - MISSING (Required)`);
          results[categoryName.toLowerCase()].missing++;
        } else {
          logWarning(`${varName} - Not set`);
          results[categoryName.toLowerCase()].missing++;
        }

        logInfo(`  Description: ${config.description}`);
        if (config.example) {
          logInfo(`  Example: ${config.example}`);
        }
      } else {
        const error = config.validate ? config.validate(value) : null;

        if (error) {
          logError(`${varName} - INVALID: ${error}`);
          results[categoryName.toLowerCase()].invalid++;
        } else {
          logSuccess(`${varName} - OK${source ? ` (from ${source})` : ''}`);
          results[categoryName.toLowerCase()].valid++;
        }

        // Show truncated value for security
        const displayValue = value.length > 20 ? `${value.substring(0, 20)}...` : value;
        logInfo(`  Value: ${displayValue}`);
      }

      console.log(); // Empty line for readability
    });
  }

  // Validate each category
  validateCategory('Required', envConfig.required, true);
  validateCategory('Important', envConfig.important);
  validateCategory('Optional', envConfig.optional);
  validateCategory('Build Tools', envConfig.buildTools);

  return results;
}

// Display validation summary
function displaySummary(results) {
  logHeader('📊 Validation Summary');

  const totalValid = Object.values(results).reduce((sum, cat) => sum + cat.valid, 0);
  const totalInvalid = Object.values(results).reduce((sum, cat) => sum + cat.invalid, 0);
  const totalMissing = Object.values(results).reduce((sum, cat) => sum + cat.missing, 0);
  const totalVariables = totalValid + totalInvalid + totalMissing;

  console.log(`Total Variables Checked: ${totalVariables}`);
  logSuccess(`Valid: ${totalValid}`);

  if (totalInvalid > 0) {
    logError(`Invalid: ${totalInvalid}`);
  }

  if (totalMissing > 0) {
    logWarning(`Missing: ${totalMissing}`);
  }

  // Category breakdown
  Object.entries(results).forEach(([category, stats]) => {
    const total = stats.valid + stats.invalid + stats.missing;
    if (total > 0) {
      console.log(`\n${category.charAt(0).toUpperCase() + category.slice(1)}:`);
      console.log(`  ✅ Valid: ${stats.valid}`);
      if (stats.invalid > 0) console.log(`  ❌ Invalid: ${stats.invalid}`);
      if (stats.missing > 0) console.log(`  ⚠️  Missing: ${stats.missing}`);
    }
  });

  // Overall status
  const hasRequiredErrors = results.required.invalid > 0 || results.required.missing > 0;
  const hasImportantErrors = results.important.invalid > 0;

  console.log('\n' + '='.repeat(60));

  if (hasRequiredErrors) {
    logError('❌ VALIDATION FAILED - Required variables are missing or invalid');
    logInfo('Please fix the required variables before running the application.');
    return false;
  } else if (hasImportantErrors) {
    logWarning('⚠️  VALIDATION PASSED WITH WARNINGS - Some important variables need attention');
    logInfo('The application will run, but some features may not work correctly.');
    return true;
  } else if (totalMissing > 0) {
    logSuccess('✅ VALIDATION PASSED - Optional variables are missing but application will run');
    return true;
  } else {
    logSuccess('🎉 VALIDATION PASSED - All variables are properly configured!');
    return true;
  }
}

// Provide setup guidance
function provideGuidance() {
  logHeader('🚀 Quick Setup Guide');

  console.log('1. Copy the local environment template:');
  console.log('   cp .env.local.template .env.local');

  console.log('\n2. Edit .env.local and set these essential variables:');
  console.log('   REACT_APP_BACKEND_URL=http://localhost:5000');
  console.log('   REACT_APP_RAZORPAY_KEY_ID=rzp_test_your_key_here');

  console.log('\n3. Get API keys:');
  console.log('   • Razorpay: https://dashboard.razorpay.com/');
  console.log('   • Google Maps: https://console.cloud.google.com/');
  console.log('   • Firebase: https://console.firebase.google.com/');

  console.log('\n4. Start the development server:');
  console.log('   npm start');

  console.log('\nFor detailed setup instructions, see: FRONTEND_ENV_SETUP.md');
}

// Check if .env.local exists
function checkLocalEnvFile() {
  const localEnvPath = path.join(__dirname, '..', '.env.local');
  const templatePath = path.join(__dirname, '..', '.env.local.template');

  if (!fs.existsSync(localEnvPath)) {
    logWarning('.env.local file not found');

    if (fs.existsSync(templatePath)) {
      logInfo('Template file (.env.local.template) is available');
      logInfo('Run: cp .env.local.template .env.local');
    } else {
      logWarning('Template file (.env.local.template) is also missing');
    }

    return false;
  }

  return true;
}

// Main execution
function main() {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    console.log('RestoBill AI Frontend Environment Validation Script');
    console.log('\nUsage: node scripts/validate-env.js [options]');
    console.log('\nOptions:');
    console.log('  --help, -h     Show this help message');
    console.log('  --guide        Show setup guidance only');
    console.log('  --summary      Show summary only (minimal output)');
    console.log('\nExamples:');
    console.log('  node scripts/validate-env.js           # Full validation');
    console.log('  node scripts/validate-env.js --guide   # Setup guidance');
    console.log('  npm run validate-env                   # If added to package.json');
    return;
  }

  if (args.includes('--guide')) {
    provideGuidance();
    return;
  }

  // Check for local environment file
  const hasLocalEnv = checkLocalEnvFile();

  // Run validation
  const results = validateEnvironment();
  const isValid = displaySummary(results);

  // Provide guidance if there are issues
  if (!isValid || !hasLocalEnv) {
    provideGuidance();
  }

  // Exit with appropriate code
  process.exit(isValid ? 0 : 1);
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  validateEnvironment,
  loadEnvironmentVariables,
  envConfig
};
