#!/usr/bin/env node
/**
 * Quick syntax check for the fixed files
 */

const fs = require('fs');
const path = require('path');

function checkSyntax(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Basic JSX syntax checks
    const openTags = (content.match(/<[^/][^>]*>/g) || []).length;
    const closeTags = (content.match(/<\/[^>]*>/g) || []).length;
    const selfClosingTags = (content.match(/<[^>]*\/>/g) || []).length;
    
    console.log(`\n📁 ${path.basename(filePath)}`);
    console.log(`   Lines: ${content.split('\n').length}`);
    console.log(`   Open tags: ${openTags}`);
    console.log(`   Close tags: ${closeTags}`);
    console.log(`   Self-closing: ${selfClosingTags}`);
    
    // Check for common syntax issues
    const issues = [];
    
    if (content.includes('export default') && content.split('export default').length > 2) {
      issues.push('Multiple default exports');
    }
    
    if (content.includes('return (') && !content.includes(');')) {
      issues.push('Missing return statement closing');
    }
    
    // Check for unmatched braces
    const openBraces = (content.match(/{/g) || []).length;
    const closeBraces = (content.match(/}/g) || []).length;
    if (openBraces !== closeBraces) {
      issues.push(`Unmatched braces: ${openBraces} open, ${closeBraces} close`);
    }
    
    // Check for unmatched parentheses
    const openParens = (content.match(/\(/g) || []).length;
    const closeParens = (content.match(/\)/g) || []).length;
    if (openParens !== closeParens) {
      issues.push(`Unmatched parentheses: ${openParens} open, ${closeParens} close`);
    }
    
    if (issues.length === 0) {
      console.log('   ✅ No syntax issues detected');
    } else {
      console.log('   ❌ Issues found:');
      issues.forEach(issue => console.log(`      - ${issue}`));
    }
    
    return issues.length === 0;
    
  } catch (error) {
    console.log(`   ❌ Error reading file: ${error.message}`);
    return false;
  }
}

console.log('🧪 Build Syntax Check');
console.log('=' * 50);

const filesToCheck = [
  'frontend/src/components/TopBanner.js',
  'frontend/src/pages/SuperAdminPage.js',
  'frontend/src/pages/InventoryPage.js'
];

let allGood = true;

filesToCheck.forEach(file => {
  if (fs.existsSync(file)) {
    const isGood = checkSyntax(file);
    allGood = allGood && isGood;
  } else {
    console.log(`\n📁 ${path.basename(file)}`);
    console.log('   ❌ File not found');
    allGood = false;
  }
});

console.log('\n🎯 Summary');
console.log('=' * 30);
if (allGood) {
  console.log('✅ All files passed syntax check');
  console.log('🚀 Build should succeed');
} else {
  console.log('❌ Some files have syntax issues');
  console.log('🔧 Fix issues before building');
}

process.exit(allGood ? 0 : 1);