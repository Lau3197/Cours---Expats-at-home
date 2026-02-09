
import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

const targetDirs = ['Niveau_A1', 'Niveau_A2', 'Niveau_B1', 'Niveau_B2'];

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

console.log('🧹 Scanning for cleanup artifacts (U+FFFD)...');

let totalFixed = 0;
let totalScanned = 0;

for (const dir of targetDirs) {
    const dirPath = join(rootDir, dir);
    const files = getAllFiles(dirPath);

    for (const file of files) {
        totalScanned++;
        try {
            let content = readFileSync(file, 'utf-8');
            let originalContent = content;

            // 1. Remove BOM/Replacement at start
            if (content.startsWith('\uFFFD') || content.startsWith('\uFEFF')) {
                content = content.substring(1);
            }

            // 2. Fix Apostrophes: letter +  + letter -> letter + ' + letter
            // e.g. "laddition" -> "l'addition"
            content = content.replace(/([a-zA-Zà-ÿÀ-Ÿ])\uFFFD([a-zA-Zà-ÿÀ-Ÿ])/g, "$1'$2");

            // 3. Fix common words if space separated (might be hard, but try common ones)
            // "C" at start of sentence -> "C'"
            content = content.replace(/ C\uFFFD/g, " C'");
            content = content.replace(/\nC\uFFFD/g, "\nC'");

            // 4. Arrows: " " -> "→ " (Best guess for this context)
            // Often appears in vocabulary lists: "word  definition"
            content = content.replace(/ \uFFFD /g, " → ");

            if (content !== originalContent) {
                writeFileSync(file, content, 'utf-8');
                totalFixed++;
                console.log(`✨ Cleaned: ${file}`);
            }
        } catch (e) {
            console.error(`Error processing ${file}: ${e.message}`);
        }
    }
}

console.log(`\n🎉 Cleanup complete. Scanned ${totalScanned}, Cleaned ${totalFixed}.`);
