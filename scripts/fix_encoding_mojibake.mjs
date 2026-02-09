
import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// Directories to scan
const targetDirs = ['Niveau_A1', 'Niveau_A2', 'Niveau_B1', 'Niveau_B2'];

// Common Mojibake patterns to detect
const MOJIBAKE_PATTERNS = [
    'Ã©', // é
    'Ã¨', // è
    'Ã§', // ç
    'Ã ', // à (followed by space usually, or NBSP)
    'Ãª', // ê
    'Ã´', // ô
    'Ã¹', // ù
    'Ã«', // ë
    'Ã®', // î
    'Ã¯', // ï
    'Ã¢', // â
    'Ã»', // û
    'â€™', // ’ (curly quote)
    'â€¦', // … (ellipsis)
    'â€“', // – (en dash)
    'Å“', // œ
    'Ã'    // Capital A tilde generic
];

function getAllFiles(dirPath, arrayOfFiles) {
    const files = readdirSync(dirPath);

    arrayOfFiles = arrayOfFiles || [];

    files.forEach(function (file) {
        if (file.startsWith('.') || file === 'node_modules' || file === 'img' || file === 'assets') return;

        const fullPath = join(dirPath, file);
        if (statSync(fullPath).isDirectory()) {
            arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
        } else {
            if (file.endsWith('.md')) {
                arrayOfFiles.push(fullPath);
            }
        }
    });

    return arrayOfFiles;
}

function fixEncoding(filePath) {
    try {
        const content = readFileSync(filePath, 'utf-8');

        // Detection: Check if content has multiple instances of Mojibake patterns
        let mojibakeCount = 0;
        for (const pattern of MOJIBAKE_PATTERNS) {
            if (content.includes(pattern)) {
                mojibakeCount++;
            }
        }

        // Only proceed if we are fairly sure (at least one clear pattern)
        if (mojibakeCount > 0) {
            console.log(`🔧 Fixing: ${filePath} (Detected ${mojibakeCount} patterns)`);

            // The Repair Logic:
            // The string is "Double Encoded". It was UTF-8 bytes, read as Latin-1, and saved as UTF-8.
            // To fix: 
            // 1. Take current string (which has 'Ã©' etc)
            // 2. Convert to Buffer using 'latin1' (Maps 'Ã'(C3) to byte C3, '©'(A9) to byte A9)
            // 3. Read that Buffer as 'utf-8' (Decodes bytes C3 A9 to 'é')

            const fixedContent = Buffer.from(content, 'latin1').toString('utf-8');

            // Verify?
            // If the fixed content looks "worse" (has replacement characters ), maybe abort?
            // UTF-8 decoding issues result in  (U+FFFD).
            // But if the original content was indeed valid UTF-8 interpreted as Latin-1, the repair should be clean.

            if (fixedContent.includes('') && !content.includes('')) {
                console.warn(`⚠️ Warning: Repairing ${filePath} introduced replacement characters. Skipping save.`);
                return false;
            }

            writeFileSync(filePath, fixedContent, 'utf-8');
            return true;
        }

        return false;
    } catch (err) {
        console.error(`❌ Error scanning ${filePath}:`, err.message);
        return false;
    }
}

console.log('🔍 Scanning for Mojibake (Double Encoding)...');

let totalFixed = 0;
let totalScanned = 0;

for (const dir of targetDirs) {
    const dirPath = join(rootDir, dir);
    const files = getAllFiles(dirPath);

    for (const file of files) {
        totalScanned++;
        if (fixEncoding(file)) {
            totalFixed++;
        }
    }
}

console.log(`\n🎉 Done! Scanned ${totalScanned} files. Fixed ${totalFixed} files.`);
