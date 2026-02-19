#!/usr/bin/env python3
"""
AndroidManifest.xml Validator for Play Store Compliance
Validates manifest for edge-to-edge, resizability, orientation, and large screen support
"""

import xml.etree.ElementTree as ET
import sys
from pathlib import Path
from dataclasses import dataclass
from typing import List, Optional
import shutil
from datetime import datetime


@dataclass
class DeprecatedAttribute:
    """Represents a deprecated attribute found in the manifest"""
    attribute_name: str
    element_tag: str
    line_number: int
    current_value: str
    reason: str
    migration_guide: str
    severity: str  # "error" or "warning"


@dataclass
class ManifestIssue:
    """Represents a manifest configuration issue"""
    issue_type: str  # "edge-to-edge", "resizability", "orientation", "large-screen"
    description: str
    location: str
    current_config: str
    recommended_config: str
    play_store_impact: str


@dataclass
class ValidationResult:
    """Result of a validation check"""
    check_name: str
    passed: bool
    message: str
    severity: str  # "error", "warning", "info"
    remediation: Optional[str] = None


class ManifestValidator:
    """Validates AndroidManifest.xml for Play Store compliance"""
    
    # Deprecated edge-to-edge attributes
    DEPRECATED_EDGE_TO_EDGE_ATTRS = {
        'android:windowLayoutInDisplayCutoutMode': 'Use WindowCompat.setDecorFitsSystemWindows() instead',
        'android:windowDrawsSystemBarBackgrounds': 'Handled automatically in modern Android',
        'android:windowTranslucentStatus': 'Use modern edge-to-edge APIs',
        'android:windowTranslucentNavigation': 'Use modern edge-to-edge APIs',
    }
    
    # Fixed orientation values that restrict flexibility
    FIXED_ORIENTATIONS = [
        'portrait', 'landscape', 'reverseLandscape', 'reversePortrait',
        'sensorPortrait', 'sensorLandscape', 'userPortrait', 'userLandscape'
    ]
    
    def __init__(self, manifest_path: Path):
        self.manifest_path = manifest_path
        self.tree = None
        self.root = None
        self.issues: List[ManifestIssue] = []
        self.deprecated_attrs: List[DeprecatedAttribute] = []
        
    def parse_manifest(self) -> bool:
        """Parse the AndroidManifest.xml file"""
        try:
            self.tree = ET.parse(self.manifest_path)
            self.root = self.tree.getroot()
            return True
        except ET.ParseError as e:
            print(f"✗ XML Parse Error: {e}")
            return False
        except FileNotFoundError:
            print(f"✗ File not found: {self.manifest_path}")
            return False
        except Exception as e:
            print(f"✗ Unexpected error: {e}")
            return False
    
    def validate_edge_to_edge(self) -> ValidationResult:
        """Check for deprecated edge-to-edge parameters"""
        deprecated_found = []
        
        # Check application element
        app_elem = self.root.find('application')
        if app_elem is not None:
            for attr_name, reason in self.DEPRECATED_EDGE_TO_EDGE_ATTRS.items():
                if attr_name in app_elem.attrib:
                    deprecated_found.append({
                        'element': 'application',
                        'attribute': attr_name,
                        'value': app_elem.attrib[attr_name],
                        'reason': reason
                    })
        
        # Check all activity elements
        for activity in self.root.findall('.//activity'):
            for attr_name, reason in self.DEPRECATED_EDGE_TO_EDGE_ATTRS.items():
                if attr_name in activity.attrib:
                    activity_name = activity.get('{http://schemas.android.com/apk/res/android}name', 'Unknown')
                    deprecated_found.append({
                        'element': f'activity ({activity_name})',
                        'attribute': attr_name,
                        'value': activity.attrib[attr_name],
                        'reason': reason
                    })
        
        if deprecated_found:
            message = f"Found {len(deprecated_found)} deprecated edge-to-edge attribute(s)"
            for item in deprecated_found:
                self.deprecated_attrs.append(DeprecatedAttribute(
                    attribute_name=item['attribute'],
                    element_tag=item['element'],
                    line_number=0,  # ET doesn't provide line numbers easily
                    current_value=item['value'],
                    reason=item['reason'],
                    migration_guide=f"Remove {item['attribute']} from {item['element']}",
                    severity="warning"
                ))
            return ValidationResult(
                check_name="Edge-to-Edge Configuration",
                passed=False,
                message=message,
                severity="warning",
                remediation="Remove deprecated edge-to-edge attributes and use modern APIs"
            )
        
        return ValidationResult(
            check_name="Edge-to-Edge Configuration",
            passed=True,
            message="No deprecated edge-to-edge attributes found",
            severity="info"
        )
    
    def validate_resizability(self) -> ValidationResult:
        """Check for resizeableActivity restrictions"""
        restrictions_found = []
        
        # Check application element
        app_elem = self.root.find('application')
        if app_elem is not None:
            resizeable = app_elem.get('{http://schemas.android.com/apk/res/android}resizeableActivity')
            if resizeable and resizeable.lower() == 'false':
                restrictions_found.append({
                    'element': 'application',
                    'value': resizeable
                })
                self.issues.append(ManifestIssue(
                    issue_type="resizability",
                    description="Application has resizability disabled",
                    location="<application> element",
                    current_config='android:resizeableActivity="false"',
                    recommended_config='Remove attribute or set to "true"',
                    play_store_impact="App won't work properly on tablets, foldables, and ChromeOS"
                ))
        
        # Check all activity elements
        for activity in self.root.findall('.//activity'):
            resizeable = activity.get('{http://schemas.android.com/apk/res/android}resizeableActivity')
            if resizeable and resizeable.lower() == 'false':
                activity_name = activity.get('{http://schemas.android.com/apk/res/android}name', 'Unknown')
                restrictions_found.append({
                    'element': f'activity ({activity_name})',
                    'value': resizeable
                })
                self.issues.append(ManifestIssue(
                    issue_type="resizability",
                    description=f"Activity {activity_name} has resizability disabled",
                    location=f"<activity android:name=\"{activity_name}\">",
                    current_config='android:resizeableActivity="false"',
                    recommended_config='Remove attribute or set to "true"',
                    play_store_impact="Activity won't resize on large screens"
                ))
        
        if restrictions_found:
            message = f"Found {len(restrictions_found)} resizability restriction(s)"
            return ValidationResult(
                check_name="Resizability Configuration",
                passed=False,
                message=message,
                severity="error",
                remediation="Remove resizeableActivity=\"false\" to support large screens"
            )
        
        return ValidationResult(
            check_name="Resizability Configuration",
            passed=True,
            message="No resizability restrictions found",
            severity="info"
        )
    
    def validate_orientation(self) -> ValidationResult:
        """Check for fixed screenOrientation values"""
        orientation_locks = []
        
        # Check all activity elements
        for activity in self.root.findall('.//activity'):
            orientation = activity.get('{http://schemas.android.com/apk/res/android}screenOrientation')
            if orientation and orientation in self.FIXED_ORIENTATIONS:
                activity_name = activity.get('{http://schemas.android.com/apk/res/android}name', 'Unknown')
                orientation_locks.append({
                    'element': f'activity ({activity_name})',
                    'value': orientation
                })
                self.issues.append(ManifestIssue(
                    issue_type="orientation",
                    description=f"Activity {activity_name} has fixed orientation lock",
                    location=f"<activity android:name=\"{activity_name}\">",
                    current_config=f'android:screenOrientation="{orientation}"',
                    recommended_config='Remove attribute or use "unspecified"',
                    play_store_impact="Poor user experience on tablets and large screens"
                ))
        
        if orientation_locks:
            message = f"Found {len(orientation_locks)} fixed orientation lock(s)"
            return ValidationResult(
                check_name="Orientation Configuration",
                passed=False,
                message=message,
                severity="warning",
                remediation="Remove fixed orientation locks to support device rotation"
            )
        
        return ValidationResult(
            check_name="Orientation Configuration",
            passed=True,
            message="No fixed orientation locks found",
            severity="info"
        )
    
    def validate_large_screen_support(self) -> ValidationResult:
        """Verify supports-screens configuration"""
        supports_screens = self.root.find('supports-screens')
        
        if supports_screens is None:
            self.issues.append(ManifestIssue(
                issue_type="large-screen",
                description="Missing supports-screens declaration",
                location="<manifest> root element",
                current_config="No <supports-screens> element",
                recommended_config='Add <supports-screens> with all screen sizes enabled',
                play_store_impact="May not be available on tablets and large screen devices"
            ))
            return ValidationResult(
                check_name="Large Screen Support",
                passed=False,
                message="Missing supports-screens declaration",
                severity="warning",
                remediation="Add <supports-screens> element with large screen support"
            )
        
        # Check for proper configuration
        issues = []
        required_attrs = {
            '{http://schemas.android.com/apk/res/android}largeScreens': 'true',
            '{http://schemas.android.com/apk/res/android}xlargeScreens': 'true',
            '{http://schemas.android.com/apk/res/android}anyDensity': 'true',
        }
        
        for attr, expected_value in required_attrs.items():
            actual_value = supports_screens.get(attr)
            if actual_value != expected_value:
                issues.append(f"{attr.split('}')[1]} should be '{expected_value}' but is '{actual_value}'")
        
        if issues:
            message = f"Large screen support configuration issues: {', '.join(issues)}"
            return ValidationResult(
                check_name="Large Screen Support",
                passed=False,
                message=message,
                severity="warning",
                remediation="Update supports-screens to enable all screen sizes"
            )
        
        return ValidationResult(
            check_name="Large Screen Support",
            passed=True,
            message="Large screen support properly configured",
            severity="info"
        )
    
    def scan_all_deprecated_attributes(self) -> List[DeprecatedAttribute]:
        """Scan manifest for all deprecated attributes"""
        # This is already populated by other validation methods
        return self.deprecated_attrs
    
    def validate_all(self) -> List[ValidationResult]:
        """Run all validations and return results"""
        if not self.parse_manifest():
            return [ValidationResult(
                check_name="XML Parsing",
                passed=False,
                message="Failed to parse AndroidManifest.xml",
                severity="error",
                remediation="Fix XML syntax errors"
            )]
        
        results = [
            self.validate_edge_to_edge(),
            self.validate_resizability(),
            self.validate_orientation(),
            self.validate_large_screen_support(),
        ]
        
        return results
    
    def generate_validation_report(self) -> str:
        """Generate detailed validation report"""
        report = []
        report.append("=" * 80)
        report.append("AndroidManifest.xml Validation Report")
        report.append("=" * 80)
        report.append(f"Manifest: {self.manifest_path}")
        report.append(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        report.append("")
        
        results = self.validate_all()
        
        # Summary
        passed = sum(1 for r in results if r.passed)
        failed = len(results) - passed
        report.append(f"Summary: {passed} passed, {failed} failed")
        report.append("")
        
        # Detailed results
        for result in results:
            icon = "✓" if result.passed else "✗"
            report.append(f"{icon} {result.check_name}")
            report.append(f"  Status: {result.severity.upper()}")
            report.append(f"  Message: {result.message}")
            if result.remediation:
                report.append(f"  Remediation: {result.remediation}")
            report.append("")
        
        # Deprecated attributes
        if self.deprecated_attrs:
            report.append("-" * 80)
            report.append("Deprecated Attributes Found:")
            report.append("-" * 80)
            for attr in self.deprecated_attrs:
                report.append(f"• {attr.attribute_name} in <{attr.element_tag}>")
                report.append(f"  Current value: {attr.current_value}")
                report.append(f"  Reason: {attr.reason}")
                report.append(f"  Fix: {attr.migration_guide}")
                report.append("")
        
        # Issues
        if self.issues:
            report.append("-" * 80)
            report.append("Configuration Issues:")
            report.append("-" * 80)
            for issue in self.issues:
                report.append(f"• {issue.description}")
                report.append(f"  Type: {issue.issue_type}")
                report.append(f"  Location: {issue.location}")
                report.append(f"  Current: {issue.current_config}")
                report.append(f"  Recommended: {issue.recommended_config}")
                report.append(f"  Play Store Impact: {issue.play_store_impact}")
                report.append("")
        
        report.append("=" * 80)
        
        return "\n".join(report)
    
    def generate_fix_snippets(self) -> str:
        """Generate XML snippets for fixes"""
        snippets = []
        snippets.append("=" * 80)
        snippets.append("Recommended XML Fixes")
        snippets.append("=" * 80)
        snippets.append("")
        
        if self.deprecated_attrs:
            snippets.append("1. Remove Deprecated Attributes:")
            snippets.append("-" * 40)
            for attr in self.deprecated_attrs:
                snippets.append(f"   Remove: {attr.attribute_name}")
                snippets.append(f"   From: <{attr.element_tag}>")
                snippets.append("")
        
        if any(issue.issue_type == "resizability" for issue in self.issues):
            snippets.append("2. Fix Resizability:")
            snippets.append("-" * 40)
            snippets.append("   Remove or change:")
            snippets.append('   android:resizeableActivity="false"')
            snippets.append("   To:")
            snippets.append('   android:resizeableActivity="true"')
            snippets.append("   Or remove the attribute entirely")
            snippets.append("")
        
        if any(issue.issue_type == "orientation" for issue in self.issues):
            snippets.append("3. Fix Orientation Locks:")
            snippets.append("-" * 40)
            snippets.append("   Remove fixed orientation attributes:")
            for issue in self.issues:
                if issue.issue_type == "orientation":
                    snippets.append(f"   {issue.current_config}")
            snippets.append("   Or change to:")
            snippets.append('   android:screenOrientation="unspecified"')
            snippets.append("")
        
        if any(issue.issue_type == "large-screen" for issue in self.issues):
            snippets.append("4. Add Large Screen Support:")
            snippets.append("-" * 40)
            snippets.append("   Add to <manifest>:")
            snippets.append("   <supports-screens")
            snippets.append('       android:smallScreens="true"')
            snippets.append('       android:normalScreens="true"')
            snippets.append('       android:largeScreens="true"')
            snippets.append('       android:xlargeScreens="true"')
            snippets.append('       android:anyDensity="true"')
            snippets.append('       android:resizeable="true" />')
            snippets.append("")
        
        snippets.append("=" * 80)
        
        return "\n".join(snippets)
    
    def create_backup(self) -> Path:
        """Create backup of manifest before modifications"""
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        backup_path = self.manifest_path.parent / f"AndroidManifest.xml.backup_{timestamp}"
        shutil.copy2(self.manifest_path, backup_path)
        return backup_path
    
    def verify_xml_validity(self) -> bool:
        """Verify XML is still valid after changes"""
        try:
            ET.parse(self.manifest_path)
            return True
        except ET.ParseError:
            return False
    
    def apply_fixes(self, dry_run: bool = True) -> bool:
        """
        Apply automated fixes to the manifest
        
        Args:
            dry_run: If True, only show what would be changed without modifying the file
            
        Returns:
            True if fixes were applied successfully, False otherwise
        """
        if not self.parse_manifest():
            return False
        
        # Run validations to populate issues
        self.validate_all()
        
        if not self.issues and not self.deprecated_attrs:
            print("✓ No issues found, nothing to fix")
            return True
        
        if dry_run:
            print("DRY RUN MODE - No changes will be made")
            print()
        else:
            # Create backup
            backup_path = self.create_backup()
            print(f"✓ Backup created: {backup_path}")
            print()
        
        changes_made = []
        
        # Fix deprecated attributes
        for attr in self.deprecated_attrs:
            attr_key = attr.attribute_name
            if attr.element_tag == 'application':
                app_elem = self.root.find('application')
                if app_elem is not None and attr_key in app_elem.attrib:
                    if not dry_run:
                        del app_elem.attrib[attr_key]
                    changes_made.append(f"Removed {attr_key} from <application>")
            else:
                # Handle activity elements
                for activity in self.root.findall('.//activity'):
                    if attr_key in activity.attrib:
                        if not dry_run:
                            del activity.attrib[attr_key]
                        activity_name = activity.get('{http://schemas.android.com/apk/res/android}name', 'Unknown')
                        changes_made.append(f"Removed {attr_key} from activity {activity_name}")
        
        # Fix resizability restrictions
        for issue in self.issues:
            if issue.issue_type == "resizability":
                if "application" in issue.location:
                    app_elem = self.root.find('application')
                    if app_elem is not None:
                        attr_key = '{http://schemas.android.com/apk/res/android}resizeableActivity'
                        if attr_key in app_elem.attrib:
                            if not dry_run:
                                app_elem.attrib[attr_key] = 'true'
                            changes_made.append("Changed resizeableActivity to 'true' in <application>")
                else:
                    # Handle activity elements
                    for activity in self.root.findall('.//activity'):
                        attr_key = '{http://schemas.android.com/apk/res/android}resizeableActivity'
                        if attr_key in activity.attrib and activity.attrib[attr_key].lower() == 'false':
                            if not dry_run:
                                activity.attrib[attr_key] = 'true'
                            activity_name = activity.get('{http://schemas.android.com/apk/res/android}name', 'Unknown')
                            changes_made.append(f"Changed resizeableActivity to 'true' in activity {activity_name}")
        
        # Fix orientation locks
        for issue in self.issues:
            if issue.issue_type == "orientation":
                for activity in self.root.findall('.//activity'):
                    attr_key = '{http://schemas.android.com/apk/res/android}screenOrientation'
                    orientation = activity.get(attr_key)
                    if orientation and orientation in self.FIXED_ORIENTATIONS:
                        if not dry_run:
                            del activity.attrib[attr_key]
                        activity_name = activity.get('{http://schemas.android.com/apk/res/android}name', 'Unknown')
                        changes_made.append(f"Removed fixed orientation lock from activity {activity_name}")
        
        # Display changes
        if changes_made:
            print("Changes to be applied:" if dry_run else "Changes applied:")
            for change in changes_made:
                print(f"  • {change}")
            print()
        
        # Write changes if not dry run
        if not dry_run and changes_made:
            try:
                # Write the modified tree
                self.tree.write(self.manifest_path, encoding='utf-8', xml_declaration=True)
                
                # Verify XML is still valid
                if self.verify_xml_validity():
                    print("✓ Manifest updated successfully")
                    print("✓ XML validity verified")
                    return True
                else:
                    print("✗ XML validation failed after changes")
                    print(f"  Restoring from backup: {backup_path}")
                    shutil.copy2(backup_path, self.manifest_path)
                    return False
            except Exception as e:
                print(f"✗ Error writing manifest: {e}")
                if 'backup_path' in locals():
                    print(f"  Restoring from backup: {backup_path}")
                    shutil.copy2(backup_path, self.manifest_path)
                return False
        
        return True


def main():
    """Main function"""
    import argparse
    
    parser = argparse.ArgumentParser(
        description='AndroidManifest.xml Validator for Play Store Compliance'
    )
    parser.add_argument(
        '--fix',
        action='store_true',
        help='Apply automated fixes to the manifest'
    )
    parser.add_argument(
        '--dry-run',
        action='store_true',
        help='Show what would be fixed without making changes'
    )
    
    args = parser.parse_args()
    
    print("=" * 80)
    print("AndroidManifest.xml Validator for Play Store Compliance")
    print("=" * 80)
    print()
    
    # Locate manifest
    base_path = Path(__file__).parent.parent
    manifest_path = base_path / "app" / "src" / "main" / "AndroidManifest.xml"
    
    if not manifest_path.exists():
        print(f"✗ Manifest not found: {manifest_path}")
        return 1
    
    # Create validator
    validator = ManifestValidator(manifest_path)
    
    # If fix mode, apply fixes
    if args.fix or args.dry_run:
        success = validator.apply_fixes(dry_run=args.dry_run)
        if not success:
            return 1
        
        # Re-validate after fixes
        if not args.dry_run:
            print()
            print("=" * 80)
            print("Re-validating after fixes...")
            print("=" * 80)
            print()
            validator = ManifestValidator(manifest_path)
    
    # Generate and display report
    report = validator.generate_validation_report()
    print(report)
    
    # Generate fix snippets if issues found
    if validator.issues or validator.deprecated_attrs:
        print()
        snippets = validator.generate_fix_snippets()
        print(snippets)
        
        # Save report to file
        report_path = base_path / "manifest_validation_report.txt"
        with open(report_path, 'w') as f:
            f.write(report)
            f.write("\n\n")
            f.write(snippets)
        print(f"\n✓ Full report saved to: {report_path}")
        
        return 1  # Exit with error code if issues found
    
    print("\n✓ All validations passed!")
    return 0


if __name__ == "__main__":
    sys.exit(main())
