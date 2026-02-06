
import { readdirSync, existsSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// COPY OF THE NEW LOGIC
function findLessonFiles() {
    const lessons = [];
    const courseDirs = ['A1.1']; // ONLY CHECK A1.1

    for (const courseDir of courseDirs) {
        const levelPrefix = courseDir[0] + courseDir[1];
        const coursePath = join(rootDir, `Niveau_${levelPrefix}`, courseDir);

        if (!existsSync(coursePath)) {
            console.log(`⚠️  Directory not found: ${coursePath}`);
            continue;
        }

        const items = readdirSync(coursePath, { withFileTypes: true });

        for (const item of items) {
            if (!item.isDirectory()) continue;
            if (item.name.startsWith('.') || item.name === 'img' || item.name === 'assets') continue;

            const subDirPath = join(coursePath, item.name);
            const files = readdirSync(subDirPath)
                .filter(f => f.endsWith('.md') && !f.includes('-Laurine'))
                .sort();

            // NEW structure
            if (files.length > 0) {
                let moduleTitle = item.name.replace(/^\d+_/, '').replace(/_/g, ' ');
                console.log(`Found potential module: ${moduleTitle} in ${item.name}`);

                for (const file of files) {
                    const match = file.match(/Le[çc]on_?(\d+)/i) || file.match(/Lesson_?(\d+)/i) || file.match(/^(\d+)[_\s]/);
                    const lessonNumber = match ? parseInt(match[1]) : 0;
                    console.log(`  - Found file: ${file} -> Lesson Number: ${lessonNumber}`);
                    lessons.push(file);
                }
            }
        }
    }
    return lessons;
}

const found = findLessonFiles();
console.log(`Total lessons found: ${found.length}`);
