// Script to generate a full JSON file from local markdown lessons
// Usage: node scripts/generateFullJSON.mjs

import { readFileSync, readdirSync, existsSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

const courseStructure = {
    'A1.1': { level: 'A1', title: 'Niveau A1.1 - Premiers Pas en Belgique', description: 'The foundational course for new expats. Master greetings, self-introduction, and daily essentials in the Belgian context.' },
    'A1.2': { level: 'A1', title: 'Niveau A1.2 - Vie Quotidienne à Bruxelles', description: 'Level up your daily interactions. Learn to order food, shop at markets, and navigate social situations.' },
    'A2.1': { level: 'A2', title: 'Niveau A2.1 - S\'installer en Belgique', description: 'Master essential administrative tasks, housing, healthcare, and banking in Belgium.' },
    'A2.2': { level: 'A2', title: 'Niveau A2.2 - Vie Sociale et Culturelle', description: 'Deepen your integration. Learn about Belgian culture, media, and social interactions.' },
    'B1.1': { level: 'B1', title: 'Niveau B1.1 - Le Monde Professionnel', description: 'Navigate the Belgian job market, interviews, and professional communication.' },
    'B1.2': { level: 'B1', title: 'Niveau B1.2 - Maîtrise Avancée', description: 'Advanced communication skills for complex situations and nuanced expressions.' },
    'B2.1': { level: 'B2', title: 'Niveau B2.1 - Expertise Culturelle', description: 'Master complex topics about Belgian identity, economy, and society.' },
    'B2.2': { level: 'B2', title: 'Niveau B2.2 - Maîtrise Complète', description: 'Achieve full mastery of French with Belgian nuances and advanced expressions.' }
};

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

function extractMetadata(content) {
    if (!content) return { title: '', duration: '15:00', type: 'text' };

    const titleMatch = content.match(/^# (.+)$/m);
    const durationMatch = content.match(/\*\*Durée (totale )?estimée\*\* : (.+)/);

    let title = titleMatch ? titleMatch[1].trim() : '';
    let duration = durationMatch ? durationMatch[2].trim() : '15:00';

    // Normalize duration format if needed
    if (duration.includes('heure') || duration.includes('h')) {
        // Keep as text string for now or parse if specific format needed
    }

    const hasVideo = content.includes('youtube.com') || content.includes('youtu.be') || content.includes('.mp4');
    const type = hasVideo ? 'video' : 'text';

    return { title, duration, type };
}

function findLessonFiles() {
    const lessons = [];
    const courseDirs = ['A1.1', 'A1.2', 'A2.1', 'A2.2', 'B1.1', 'B1.2', 'B2.1', 'B2.2'];

    for (const courseDir of courseDirs) {
        const levelPrefix = courseDir[0] + courseDir[1];
        const coursePath = join(rootDir, 'Niveau_' + levelPrefix, courseDir);

        if (!existsSync(coursePath)) {
            // console.log(`⚠️  Directory not found: ${coursePath}`);
            continue;
        }

        const lessonDirs = readdirSync(coursePath, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory() && dirent.name.startsWith('Lecon_'))
            .map(dirent => dirent.name)
            .sort((a, b) => {
                const numA = parseInt(a.match(/\d+/)?.[0] || '0');
                const numB = parseInt(b.match(/\d+/)?.[0] || '0');
                return numA - numB;
            });

        for (const lessonDir of lessonDirs) {
            const lessonPath = join(coursePath, lessonDir);
            const files = readdirSync(lessonPath)
                .filter(f => f.endsWith('.md') && !f.includes('-Laurine')) // Exclude Laurine's copies if any
                .sort();

            if (files.length > 0) {
                const filePath = join(lessonPath, files[0]);
                const content = readMarkdownFile(filePath);

                if (content) {
                    const metadata = extractMetadata(content);
                    const lessonNumber = lessonDir.match(/\d+/)?.[0] || '0';

                    lessons.push({
                        courseId: courseDir.toLowerCase().replace('.', '-'),
                        courseDir,
                        lessonNumber: parseInt(lessonNumber),
                        lessonId: `l${lessonNumber.padStart(2, '0')}`,
                        content,
                        ...metadata
                    });
                }
            }
        }
    }

    return lessons;
}

function organizeLessonsIntoCourses(lessons) {
    const courses = {};

    for (const lesson of lessons) {
        if (!courses[lesson.courseId]) {
            const courseInfo = courseStructure[lesson.courseDir];
            courses[lesson.courseId] = {
                id: lesson.courseId,
                title: courseInfo.title,
                level: courseInfo.level,
                description: courseInfo.description,
                sections: [],
                resources: []
            };
        }

        // Group by 4 lessons per module
        let sectionIndex = Math.floor((lesson.lessonNumber - 1) / 4);

        // Create sections if they don't exist
        while (courses[lesson.courseId].sections.length <= sectionIndex) {
            const idx = courses[lesson.courseId].sections.length;
            courses[lesson.courseId].sections.push({
                id: `section-${idx + 1}`,
                title: `Module ${idx + 1}`,
                lessons: []
            });
        }

        const section = courses[lesson.courseId].sections[sectionIndex];
        section.lessons.push({
            id: lesson.lessonId,
            title: lesson.title || `Leçon ${lesson.lessonNumber}`,
            content: lesson.content,
            duration: lesson.duration,
            type: lesson.type,
            completed: false,
            vocabulary: [],
            comments: []
        });
    }

    return Object.values(courses);
}

function generateJSON() {
    console.log('📚 Scanning for lesson files...');
    console.log(`Root directory: ${rootDir}`);

    const lessons = findLessonFiles();
    console.log(`✅ Found ${lessons.length} lessons`);

    const courses = organizeLessonsIntoCourses(lessons);
    console.log(`✅ Organized into ${courses.length} courses:\n`);

    let totalLessons = 0;
    for (const course of courses) {
        const courseLessons = course.sections.reduce((sum, s) => sum + s.lessons.length, 0);
        console.log(`  - ${course.title}: ${courseLessons} lessons`);
        totalLessons += courseLessons;
    }

    const outputPath = join(__dirname, '..', 'data', 'allCourses.json');
    writeFileSync(outputPath, JSON.stringify(courses, null, 2), 'utf-8');

    console.log(`\n✅ Generated JSON file: ${outputPath}`);
    console.log(`📦 Total Content: ${courses.length} courses, ${totalLessons} lessons.`);
}

generateJSON();
