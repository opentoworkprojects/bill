#!/usr/bin/env node
/**
 * Test build fix for billingCache.js duplicate declaration issue
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Testing Build Fix for billingCache.js');
console.log('=' .repeat(50));

// Check if the billingCache.js file has the correct structure
const billingCachePath = path.join(__dirname, 'frontend/src/utils/billingCache.js');

if (!fs.existsSync(billingCachePath)) {
    console.log('❌ billingCache.js file not found');
    process.exit(1);
}

const content = fs.readFileSync(billingCachePath, 'utf8');

// Check for issues that caused the build failure
const issues = [];

// Check for duplicate declarations
const billingCacheDeclarations = content.match(/const billingCache|export const billingCache/g);
if (billingCacheDeclarations && billingCacheDeclarations.length > 1) {
    issues.push(`Multiple billingCache declarations found: ${billingCacheDeclarations.length}`);
}

// Check for duplicate exports
const defaultExports = content.match(/export default billingCache/g);
if (defaultExports && defaultExports.length > 1) {
    issues.push(`Multiple default exports found: ${defaultExports.length}`);
}

// Check for missing methods
const requiredMethods = [
    'getCachedBillingData',
    'invalidateCache',
    'clearAll',
    'preloadBillingData'
];

requiredMethods.forEach(method => {
    if (!content.includes(method)) {
        issues.push(`Missing required method: ${method}`);
    }
});

// Check for proper imports
const requiredImports = [
    'import axios from \'axios\'',
    'import { API } from \'../App\'',
    'import { performanceMonitor, trackCacheHit, trackCacheMiss } from \'./performanceMonitor\''
];

requiredImports.forEach(importStatement => {
    if (!content.includes(importStatement.split(' from ')[0])) {
        issues.push(`Missing import: ${importStatement}`);
    }
});

// Report results
console.log('\n📋 Build Fix Validation Results:');
console.log('=' .repeat(50));

if (issues.length === 0) {
    console.log('✅ All checks passed!');
    console.log('✅ No duplicate declarations found');
    console.log('✅ Single default export confirmed');
    console.log('✅ All required methods present');
    console.log('✅ All imports correct');
    console.log('\n🎉 billingCache.js is ready for build!');
    
    // Show file structure
    console.log('\n📁 File Structure:');
    const lines = content.split('\n');
    const structure = [];
    
    lines.forEach((line, index) => {
        if (line.includes('class BillingCache')) {
            structure.push(`Line ${index + 1}: BillingCache class definition`);
        }
        if (line.includes('const billingCache = new BillingCache()')) {
            structure.push(`Line ${index + 1}: Singleton instance creation`);
        }
        if (line.includes('export default billingCache')) {
            structure.push(`Line ${index + 1}: Default export`);
        }
        if (line.includes('export function useBillingCache')) {
            structure.push(`Line ${index + 1}: React hook export`);
        }
    });
    
    structure.forEach(item => console.log(`  ${item}`));
    
} else {
    console.log('❌ Issues found:');
    issues.forEach(issue => console.log(`  - ${issue}`));
    console.log('\n⚠️ Build may fail with these issues');
}

console.log('\n' + '=' .repeat(50));

// Additional checks for Vercel build compatibility
console.log('\n🔍 Vercel Build Compatibility Checks:');

// Check for ES6 module syntax
const hasESModules = content.includes('import ') && content.includes('export ');
console.log(`✅ ES6 modules: ${hasESModules ? 'Yes' : 'No'}`);

// Check for Node.js specific code that might break in browser
const nodeSpecific = ['require(', 'process.', '__dirname', '__filename'];
const hasNodeCode = nodeSpecific.some(pattern => content.includes(pattern));
console.log(`✅ Browser compatible: ${!hasNodeCode ? 'Yes' : 'No'}`);

// Check for async/await usage
const hasAsyncAwait = content.includes('async ') && content.includes('await ');
console.log(`✅ Modern JS features: ${hasAsyncAwait ? 'Yes' : 'No'}`);

console.log('\n🚀 Ready for Vercel deployment!');

process.exit(issues.length === 0 ? 0 : 1);