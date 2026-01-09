#!/usr/bin/env python3
"""
Script to remove emojis from titles/subtitles and Quick Win sections from all lesson files.
"""

import os
import re
from pathlib import Path

# Emojis to remove from titles
EMOJIS_TO_REMOVE = [
    '🎯', '🎤', '📚', '🎧', '📖', '🗣️', '✍️', '🆘', '🇧🇪', '📝', '📄', 
    '💡', '✅', '❌', '⚠️', '🎉', '🎨'
]

def remove_emojis_from_line(line):
    """Remove emojis from a line."""
    for emoji in EMOJIS_TO_REMOVE:
        line = line.replace(emoji, '')
    return line.strip()

def remove_quick_win_section(content):
    """Remove Quick Win sections from content."""
    # Pattern to match Quick Win sections (from ## Quick Win to next ## or end)
    pattern = r'##\s*Quick Win.*?(?=\n##|\Z)'
    content = re.sub(pattern, '', content, flags=re.DOTALL | re.IGNORECASE)
    return content

def process_file(file_path):
    """Process a single markdown file."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        # Remove Quick Win sections
        content = remove_quick_win_section(content)
        
        # Process line by line to remove emojis from titles
        lines = content.split('\n')
        processed_lines = []
        
        for line in lines:
            # Check if line is a title (starts with ## or ###)
            if line.strip().startswith('##') or line.strip().startswith('###'):
                # Remove emojis from title
                processed_line = remove_emojis_from_line(line)
                # Preserve the original structure (## or ###)
                if processed_line:
                    # Reconstruct the line with proper spacing
                    if line.startswith('##'):
                        processed_line = '## ' + processed_line.lstrip('#').strip()
                    elif line.startswith('###'):
                        processed_line = '### ' + processed_line.lstrip('#').strip()
                else:
                    processed_line = line  # Keep original if removing emojis leaves nothing
                processed_lines.append(processed_line)
            else:
                processed_lines.append(line)
        
        new_content = '\n'.join(processed_lines)
        
        # Only write if content changed
        if new_content != original_content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(new_content)
            return True
        return False
    except Exception as e:
        print(f"Error processing {file_path}: {e}")
        return False

def main():
    """Main function to process all lesson files."""
    # Get the script directory
    script_dir = Path(__file__).parent
    # Go up to extracted_french_mastery
    base_dir = script_dir.parent
    
    # Find all lesson markdown files
    lesson_files = list(base_dir.rglob('Lecon_*.md'))
    
    print(f"Found {len(lesson_files)} lesson files")
    
    modified_count = 0
    for file_path in lesson_files:
        if process_file(file_path):
            print(f"Modified: {file_path.relative_to(base_dir)}")
            modified_count += 1
    
    print(f"\nDone! Modified {modified_count} files.")

if __name__ == '__main__':
    main()







