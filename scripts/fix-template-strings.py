#!/usr/bin/env python3
"""
Fix template string escaping in TSX files
Escapes backticks and ${} inside <script> tags within template strings
"""

import re
import sys

def fix_script_block(match):
    """Fix backticks inside script blocks"""
    script_content = match.group(1)

    # Escape backticks - but not the ones we just added
    script_content = script_content.replace('`', r'\`')
    script_content = script_content.replace('${', r'\${')

    return f'<script>{script_content}</script>'

def fix_file(filename):
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find and fix content inside <script> tags
    # Pattern: <script>(.*?)</script> with DOTALL flag
    fixed_content = re.sub(
        r'<script>(.*?)</script>',
        fix_script_block,
        content,
        flags=re.DOTALL
    )

    with open(filename, 'w', encoding='utf-8') as f:
        f.write(fixed_content)

    print(f"✅ Fixed {filename}")

if __name__ == '__main__':
    files_to_fix = [
        'src/admin/pages/RolesPageImproved.tsx',
        'src/admin/pages/PermissionsPageImproved.tsx',
    ]

    for file in files_to_fix:
        try:
            fix_file(file)
        except Exception as e:
            print(f"❌ Error fixing {file}: {e}")
