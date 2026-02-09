import { readFileSync, readdirSync, existsSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');
const jsonPath = join(rootDir, 'data', 'allCourses.json');

// Get arguments
const args = process.argv.slice(2);
const targetCourseId = args[0] ? args[0].toLowerCase().replace('.', '-') : null;
const targetLessonNum = args[1] ? parseInt(args[1]) : null;

if (!targetCourseId) {
    console.error("❌ Usage: node scripts/update_json.mjs <CourseID> [LessonNumber]");
    console.error("   Example: node scripts/update_json.mjs A1.1 14  (Update Single Lesson)");
    console.error("   Example: node scripts/update_json.mjs A1.1     (Update Entire Course)");
    process.exit(1);
}

// Helper functions
function readMarkdownFile(filePath) {
    try {
        if (existsSync(filePath)) {
            return readFileSync(filePath, 'utf-8');
        }
        return null;
    } catch (error) {
        console.error(`Error reading ${filePath}:`, error.message);
        return null;
    }
}

function extractVocabulary(content) {
    const vocabMatch = content.match(/## Vocabulary List\s+([\s\S]*?)(?=\n\s*---|\n##|$)/);
    if (!vocabMatch) return [];

    const tableContent = vocabMatch[1];
    const rows = tableContent.split('\n').filter(line => line.trim().startsWith('|') && !line.includes('---'));

    const vocabData = [];
    for (const row of rows) {
        if (row.toLowerCase().includes('---') || (row.toLowerCase().includes('french') && row.toLowerCase().includes('english'))) continue;
        const cells = row.split('|').map(c => c.trim()).filter(c => c);
        if (cells.length >= 2) {
            vocabData.push({
                id: `v-${Math.random().toString(36).substr(2, 9)}`,
                french: cells[0],
                translation: cells[1],
                pronunciation: cells[2] || ''
            });
        }
    }
    return vocabData;
}

function extractMetadata(content) {
    if (!content) return { title: '', duration: '15:00', type: 'text', vocabulary: [] };

    // Remove BOM and leading whitespace
    content = content.replace(/^\uFEFF/, '').trimStart();

    const titleMatch = content.match(/^#\s+(.+)$/m);
    const durationMatch = content.match(/\*\*Durée (totale )?estimée\*\* : (.+)/);
    let title = titleMatch ? titleMatch[1].trim() : '';
    let duration = durationMatch ? durationMatch[2].trim() : '15:00';
    const hasVideo = content.includes('youtube.com') || content.includes('youtu.be') || content.includes('.mp4');
    const type = hasVideo ? 'video' : 'text';
    const vocabulary = extractVocabulary(content);
    return { title, duration, type, vocabulary };
}

// 1. Locate the course directory
console.log(`🔍 Looking for Course: ${targetCourseId}`);
if (targetLessonNum) console.log(`   Targeting Lesson: ${targetLessonNum}`);
else console.log(`   Targeting: ALL LESSONS`);

const courseDirMap = {
    'a1-1': 'Niveau_A1/A1.1',
    'a1-2': 'Niveau_A1/A1.2',
    'a2-1': 'Niveau_A2/A2.1',
    'a2-2': 'Niveau_A2/A2.2',
    'b1-1': 'Niveau_B1/B1.1',
    'b1-1_bis': 'Niveau_B1/B1.1_bis',
    'b1-2': 'Niveau_B1/B1.2',
    'b2-1': 'Niveau_B2/B2.1',
    'b2-2': 'Niveau_B2/B2.2',
    'a1-global': 'Niveau_A1/Module_Global_A1',
    'a2-global': 'Niveau_A2/Module_Global_A2',
    'b1-global': 'Niveau_B1/Module_Global_B1'
};

const relativePath = courseDirMap[targetCourseId];
if (!relativePath) {
    console.error(`❌ Unknown course ID: ${targetCourseId}`);
    process.exit(1);
}

const coursePath = join(rootDir, relativePath);
if (!existsSync(coursePath)) {
    console.error(`❌ Course directory not found: ${coursePath}`);
    process.exit(1);
}

// Find lesson directories
const lessonDirs = readdirSync(coursePath).filter(d => d.startsWith('Lecon_'));

let lessonsToUpdate = [];

if (targetLessonNum) {
    const targetDir = lessonDirs.find(d => {
        const num = parseInt(d.match(/\d+/)?.[0] || '0');
        return num === targetLessonNum;
    });

    if (!targetDir) {
        console.error(`❌ Lesson directory for number ${targetLessonNum} not found in ${coursePath}`);
        process.exit(1);
    }
    lessonsToUpdate.push(targetDir);
} else {
    lessonsToUpdate = lessonDirs;
}

// 2. Load JSON
if (!existsSync(jsonPath)) {
    console.error(`❌ data/allCourses.json not found!`);
    process.exit(1);
}

const rawJson = readFileSync(jsonPath, 'utf-8');
let allCourses = JSON.parse(rawJson);
if (allCourses.courses) allCourses = allCourses.courses;

// 3. Find course in JSON
const courseIndex = allCourses.findIndex(c => c.id === targetCourseId);
if (courseIndex === -1) {
    console.error(`❌ Course ${targetCourseId} not found in JSON data.`);
    process.exit(1);
}

const course = allCourses[courseIndex];
let updatedCount = 0;

console.log(`🔄 Processing ${lessonsToUpdate.length} lessons...`);

for (const dirName of lessonsToUpdate) {
    const lessonPath = join(coursePath, dirName);
    const files = readdirSync(lessonPath).filter(f => f.endsWith('.md') && !f.includes('-Laurine'));

    if (files.length === 0) {
        console.warn(`⚠️ No Markdown file found in ${dirName}, skipping.`);
        continue;
    }

    const mdFilePath = join(lessonPath, files[0]);
    const currentLessonNum = parseInt(dirName.match(/\d+/)?.[0] || '0');

    const content = readMarkdownFile(mdFilePath);
    if (!content) continue;

    const metadata = extractMetadata(content);

    // Update in JSON
    let found = false;
    for (const section of course.sections) {
        const lessonIndex = section.lessons.findIndex(l => {
            const idNum = parseInt(l.id.replace(/\D/g, ''));
            return idNum === currentLessonNum;
        });

        if (lessonIndex !== -1) {
            const oldLesson = section.lessons[lessonIndex];
            section.lessons[lessonIndex] = {
                ...oldLesson,
                content: content,
                title: metadata.title || oldLesson.title,
                duration: metadata.duration || oldLesson.duration,
                type: metadata.type || oldLesson.type,
                vocabulary: metadata.vocabulary || [],
            };
            found = true;
            updatedCount++;
            break;
        }
    }

    if (!found) {
        console.warn(`   ⚠️ Lesson ${currentLessonNum} found in files but NOT in JSON structure.`);
    }
}

// 4. Write back
writeFileSync(jsonPath, JSON.stringify(allCourses, null, 2), 'utf-8');
console.log(`🎉 Successfully updated ${updatedCount} lessons in ${targetCourseId} (JSON only).`);
console.log(`👉 Now go to Admin Dashboard -> Données -> Mise à jour Granulaire to push to Firebase.`);
