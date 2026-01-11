// Script to update allCourses.json with new Lecon_02 content
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the updated markdown file
const markdownPath = path.join(__dirname, '..', 'Niveau_A1', 'A1.1', 'Lecon_02', 'Lecon_02_Les_salutations.md');
const markdownContent = fs.readFileSync(markdownPath, 'utf-8');

// Read the current allCourses.json
const jsonPath = path.join(__dirname, '..', 'data', 'allCourses.json');
const coursesData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

// Find and update Lecon_02 content
let updated = false;
for (const course of coursesData) {
    if (course.sections) {
        for (const section of course.sections) {
            if (section.lessons) {
                for (const lesson of section.lessons) {
                    if (lesson.title && lesson.title.includes('Leçon 02') && lesson.title.includes('salutations')) {
                        console.log('Found Leçon 02, updating content...');
                        lesson.content = markdownContent;
                        updated = true;
                    }
                }
            }
        }
    }
}

if (updated) {
    // Write back to JSON
    fs.writeFileSync(jsonPath, JSON.stringify(coursesData, null, 2), 'utf-8');
    console.log('✅ allCourses.json updated successfully!');
} else {
    console.log('❌ Could not find Leçon 02 in allCourses.json');
}
