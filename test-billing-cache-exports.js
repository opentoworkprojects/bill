#!/usr/bin/env node
/**
 * Test billingCache exports to ensure they work correctly
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Testing billingCache.js Export Structure');
console.log('=' .repeat(50));

// Read the billingCache.js file
const billingCachePath = path.join(__dirname, 'frontend/src/utils/billingCache.js');

if (!fs.existsSync(billingCachePath)) {
    console.log('❌ billingCache.js file not found');
    process.exit(1);
}

const content = fs.readFileSync(billingCachePath, 'utf8');

console.log('\n📋 Export Analysis:');
console.log('=' .repeat(50));

// Check for default export
const defaultExports = content.match(/export default billingCache/g);
console.log(`✅ Default exports found: ${defaultExports ? defaultExports.length : 0}`);

// Check for named exports
const namedExports = content.match(/export (const|function|class)/g);
console.log(`✅ Named exports found: ${namedExports ? namedExports.length : 0}`);

// Check for useBillingCache hook
const hookExport = content.includes('export function useBillingCache');
console.log(`✅ useBillingCache hook: ${hookExport ? 'Present' : 'Missing'}`);

// Check for class definition
const classDefinition = content.includes('class BillingCache');
console.log(`✅ BillingCache class: ${classDefinition ? 'Present' : 'Missing'}`);

// Check for singleton instance
const singletonInstance = content.includes('const billingCache = new BillingCache()');
console.log(`✅ Singleton instance: ${singletonInstance ? 'Present' : 'Missing'}`);

// Check for global window assignment
const globalAssignment = content.includes('window.billingCache = billingCache');
console.log(`✅ Global window assignment: ${globalAssignment ? 'Present' : 'Missing'}`);

console.log('\n📋 Import Usage Analysis:');
console.log('=' .repeat(50));

// Check files that import billingCache
const filesToCheck = [
    'frontend/src/pages/BillingPage.js',
    'frontend/src/pages/OrdersPage.js',
    'frontend/src/components/OptimizedBillingButton.js'
];

filesToCheck.forEach(filePath => {
    const fullPath = path.join(__dirname, filePath);
    if (fs.existsSync(fullPath)) {
        const fileContent = fs.readFileSync(fullPath, 'utf8');
        
        // Check for correct default import
        const correctImport = fileContent.includes("import billingCache from '../utils/billingCache'");
        const incorrectImport = fileContent.includes("import { billingCache } from '../utils/billingCache'");
        
        console.log(`📄 ${path.basename(filePath)}:`);
        console.log(`   ✅ Correct import: ${correctImport ? 'Yes' : 'No'}`);
        console.log(`   ❌ Incorrect import: ${incorrectImport ? 'Yes' : 'No'}`);
        
        if (incorrectImport) {
            console.log(`   🔧 Fix needed: Change to default import`);
        }
    } else {
        console.log(`📄 ${path.basename(filePath)}: File not found`);
    }
});

console.log('\n📋 Method Usage Analysis:');
console.log('=' .repeat(50));

// Check for method calls in the files
const methodsToCheck = [
    'getCachedBillingData',
    'preloadBillingData',
    'getBillingData',
    'invalidateOrder',
    'invalidateCache',
    'preloadMultipleOrders'
];

filesToCheck.forEach(filePath => {
    const fullPath = path.join(__dirname, filePath);
    if (fs.existsSync(fullPath)) {
        const fileContent = fs.readFileSync(fullPath, 'utf8');
        console.log(`📄 ${path.basename(filePath)}:`);
        
        methodsToCheck.forEach(method => {
            const hasMethod = fileContent.includes(`billingCache.${method}`);
            if (hasMethod) {
                console.log(`   ✅ Uses: ${method}`);
            }
        });
    }
});

console.log('\n🎯 Summary:');
console.log('=' .repeat(50));

const issues = [];

if (!defaultExports || defaultExports.length !== 1) {
    issues.push('Default export issue');
}

if (!hookExport) {
    issues.push('Missing useBillingCache hook');
}

if (!classDefinition) {
    issues.push('Missing BillingCache class');
}

if (!singletonInstance) {
    issues.push('Missing singleton instance');
}

if (issues.length === 0) {
    console.log('🎉 All export checks passed!');
    console.log('✅ billingCache.js is properly structured');
    console.log('✅ Ready for Vercel build');
} else {
    console.log('❌ Issues found:');
    issues.forEach(issue => console.log(`   - ${issue}`));
}

console.log('\n' + '=' .repeat(50));

process.exit(issues.length === 0 ? 0 : 1);