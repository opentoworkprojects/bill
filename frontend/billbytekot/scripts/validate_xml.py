#!/usr/bin/env python3
"""
XML Validation Script for Android Project
Validates AndroidManifest.xml and theme files for well-formed XML structure
"""

import xml.etree.ElementTree as ET
import sys
from pathlib import Path

def validate_xml_file(file_path: Path) -> tuple[bool, str]:
    """
    Validate that an XML file is well-formed.
    
    Args:
        file_path: Path to the XML file
        
    Returns:
        Tuple of (is_valid, message)
    """
    try:
        ET.parse(file_path)
        return True, f"✓ {file_path.name}: Valid XML"
    except ET.ParseError as e:
        return False, f"✗ {file_path.name}: XML Parse Error - {e}"
    except FileNotFoundError:
        return False, f"✗ {file_path.name}: File not found"
    except Exception as e:
        return False, f"✗ {file_path.name}: Unexpected error - {e}"

def main():
    """Main validation function"""
    print("=" * 60)
    print("Android XML Validation")
    print("=" * 60)
    print()
    
    # Define files to validate
    base_path = Path(__file__).parent.parent
    files_to_validate = [
        base_path / "app" / "src" / "main" / "AndroidManifest.xml",
        base_path / "app" / "src" / "main" / "res" / "values" / "themes.xml",
        base_path / "app" / "src" / "main" / "res" / "values-v35" / "themes.xml",
    ]
    
    all_valid = True
    results = []
    
    for file_path in files_to_validate:
        is_valid, message = validate_xml_file(file_path)
        results.append((is_valid, message))
        print(message)
        if not is_valid:
            all_valid = False
    
    print()
    print("=" * 60)
    if all_valid:
        print("✓ All XML files are valid and well-formed")
        print("=" * 60)
        return 0
    else:
        print("✗ Some XML files have validation errors")
        print("=" * 60)
        return 1

if __name__ == "__main__":
    sys.exit(main())
