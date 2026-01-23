#!/usr/bin/env python3
"""
Clean up unnecessary files while keeping testing files
"""
import os
import glob

# Files to keep (testing and essential files)
KEEP_FILES = [
    # Core testing files
    'test-connection.py',
    'test-login.py', 
    'test-user-signup.py',
    'test-referral-signup.py',
    
    # Essential project files
    '.gitignore',
    '.gitconfig',
    '.npmrc',
    'docker-compose.yml',
    'docker-compose.production.yml',
    'nginx.conf',
    'logo.png',
    'CHANGELOG.md',
    
    # Build scripts
    'build-apk.bat',
    'build-apk.sh',
    'release-electron.bat',
    'release-electron.sh',
    
    # Deployment documentation (keep recent ones)
    'SIGNUP_REFERRAL_FIX_DEPLOYED.md',
    'START_HERE.md'
]

# File patterns to remove
REMOVE_PATTERNS = [
    # Old test files (keep only essential ones)
    'test-*.py',
    'test-*.js', 
    'test-*.html',
    
    # Documentation files (except essential ones)
    '*_REPORT.md',
    '*_SUMMARY.md',
    '*_GUIDE.md',
    '*_INDEX.md',
    '*_CHECKLIST.md',
    'DELIVERABLES.md',
    'DELIVERY_*.md',
    'EDIT_ORDER_*.md',
    'FAST_ACCESS_*.md',
    'IMPLEMENTATION_*.md',
    'PATH_C_*.md',
    'PERFORMANCE_*.md',
    'PHASE_*.md',
    'README_*.md',
    
    # Old fix files
    'fix-*.py',
    'fix-*.js',
    'aggressive_fix.py',
    'backend_fixes.py',
    'frontend_fixes.js',
    
    # Debug files
    'debug-*.py',
    'debug_*.py',
    
    # Check files
    'check-*.py',
    'check_*.py',
    
    # Old signup files
    'signup_*.py',
    'final_signup_fix.py',
    
    # Performance reports
    'performance_report_*.json',
    'payment_performance_report.json',
    'local_test_results.json',
    'signup_test_results.json',
    'test_results_*.json',
    
    # Deployment files
    'deploy-*.bat',
    'deploy-*.sh',
    'verify-*.py',
    'verify_*.py',
    
    # Temporary files
    'temp_*.txt',
    'curl_*.txt',
    
    # Update files
    'update-*.py',
    'update_*.py',
    
    # Other cleanup
    'complete-*.py',
    'enable-*.py',
    'find-*.py',
    'restart-*.py',
    'revert-*.py',
    'quick_*.py',
    'start-local-test.*'
]

def should_keep_file(filename):
    """Check if file should be kept"""
    if filename in KEEP_FILES:
        return True
    
    # Keep essential testing files
    essential_tests = [
        'test-connection.py',
        'test-login.py', 
        'test-user-signup.py',
        'test-referral-signup.py'
    ]
    if filename in essential_tests:
        return True
        
    return False

def main():
    print("🧹 Cleaning up unnecessary files...")
    
    removed_count = 0
    kept_count = 0
    
    # Get all files matching removal patterns
    files_to_check = []
    for pattern in REMOVE_PATTERNS:
        files_to_check.extend(glob.glob(pattern))
    
    # Remove duplicates
    files_to_check = list(set(files_to_check))
    
    for filename in files_to_check:
        if os.path.isfile(filename):
            if should_keep_file(filename):
                print(f"✅ KEEPING: {filename}")
                kept_count += 1
            else:
                try:
                    os.remove(filename)
                    print(f"🗑️  REMOVED: {filename}")
                    removed_count += 1
                except Exception as e:
                    print(f"❌ ERROR removing {filename}: {e}")
    
    print(f"\n📊 SUMMARY:")
    print(f"   🗑️  Files removed: {removed_count}")
    print(f"   ✅ Files kept: {kept_count}")
    print(f"\n🎯 KEPT ESSENTIAL FILES:")
    for file in KEEP_FILES:
        if os.path.exists(file):
            print(f"   ✅ {file}")

if __name__ == "__main__":
    main()