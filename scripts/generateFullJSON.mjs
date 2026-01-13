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
    'B1.2': { level: 'B1', title: 'Niveau B1.2 - Maîtrise Avancée', description: 'Advanced communication skills for complex situations and nuanced expressions.' },
    'B2.1': { level: 'B2', title: 'Niveau B2.1 - Expertise Culturelle', description: 'Master complex topics about Belgian identity, economy, and society.' },
    'B2.2': { level: 'B2', title: 'Niveau B2.2 - Maîtrise Complète', description: 'Achieve full mastery of French with Belgian nuances and advanced expressions.' }
};

// Configuration for manual module grouping (optional overrides)
const moduleOverrides = {
    'a1-1': [
        { title: "Module 1 : Bases et Identité", lessons: [1, 2, 3, 4] },
        { title: "Module 2 : Vie Sociale & Environnement", lessons: [5, 6, 7, 8] },
        { title: "Module 3 : Le Temps et les Goûts", lessons: [9, 10, 11, 12] },
        { title: "Module 4 : Vie Quotidienne", lessons: [13, 14, 15] },
        { title: "Module 5 : Compétences & Bilan", lessons: [16, 17] }
    ],
    'a1-2': [
        { title: "Module 1 : Sorties et Loisirs", lessons: [1, 2, 3, 4] },
        { title: "Module 2 : Vie Quotidienne", lessons: [5, 6, 7, 8] },
        { title: "Module 3 : Voyage et Déplacement", lessons: [9, 10, 11, 12] },
        { title: "Module 4 : Santé et Services", lessons: [13, 14, 15, 16] },
        { title: "Module 5 : Compétences & Bilan", lessons: [17, 18] }
    ],
    'a2-1': [
        { title: "Module 1 : Souvenirs et Passé", lessons: [1, 2, 3, 4] },
        { title: "Module 2 : Raconter une histoire", lessons: [5, 6, 7, 8] },
        { title: "Module 3 : Projets et Futur", lessons: [9, 10, 11, 12] },
        { title: "Module 4 : Vie Professionnelle", lessons: [13, 14, 15, 16] },
        { title: "Module 5 : Société et Actualité", lessons: [17, 18, 19, 20] },
        { title: "Module 6 : Compétences & Bilan", lessons: [21, 22] }
    ],
    'a1-global': [
        { title: "Module 1 : Mission Agent Secret", lessons: [19] },
        { title: "Module 2 : Les Commères du Quartier", lessons: [20] },
        { title: "Module 3 : Escape Game Le Manoir", lessons: [21] }
    ],
    'a2-global': [
        { title: "Module 1 : Le Voyageur Temporel", lessons: [21] },
        { title: "Module 2 : Enquête à l'Hôtel Royal", lessons: [22] },
        { title: "Module 3 : Le Mystère de l'Orient Express", lessons: [23] }
    ],
    'b1-1': [
        { title: "Module 1", lessons: [1, 2, 3] },
        { title: "Module 2", lessons: [4, 5] },
        { title: "Module 3", lessons: [6, 7, 8, 9] },
        { title: "Module 4", lessons: [10, 11, 12] },
        { title: "Module 5", lessons: [13, 14, 15] },
        { title: "Module 6", lessons: [16, 17, 18] },
        { title: "Module 7", lessons: [19, 20, 21] },
        { title: "Module 8", lessons: [22, 23] },
        { title: "Module 9", lessons: [24, 25] },
        { title: "Module 10", lessons: [26, 27, 28] },
        { title: "Module 11", lessons: [29, 30, 31, 32] },
        { title: "Module 12 : Compétences & Bilan", lessons: [33, 34] }
    ],
    'b1-2': [
        // Using Module X naming or just auto-grouping by default if linear
        // But since we have many lessons, explicit is safer if gaps exist
        { title: "Module 1", lessons: [1, 2, 3, 4] },
        { title: "Module 2", lessons: [5, 6, 7, 8] },
        { title: "Module 3", lessons: [9, 10, 11, 12] },
        { title: "Module 4", lessons: [13, 14, 15, 16] },
        { title: "Module 5", lessons: [17, 18, 19, 20] },
        { title: "Module 6", lessons: [21, 22, 23, 24] },
        { title: "Module 7", lessons: [25, 26, 27, 28] },
        { title: "Module 8", lessons: [29, 30, 31, 32] },
        { title: "Module 9 : Compétences & Bilan", lessons: [33] }
    ],
    'b1-global': [
        { title: "Module 1 : Le Rédacteur en Chef", lessons: [34] },
        { title: "Module 2 : Radio Libre", lessons: [35] },
        { title: "Module 3 : Le Grand Sommet Francophone", lessons: [36] }
    ]
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

// Helper to extract vocabulary from markdown tables
function extractVocabulary(content) {
    const vocabMatch = content.match(/## Vocabulary List\s+([\s\S]*?)(?=\n\s*---|\n##|$)/);
    if (!vocabMatch) return [];

    const tableContent = vocabMatch[1];
    const rows = tableContent.split('\n').filter(line => line.trim().startsWith('|') && !line.includes('---')); // Sketchy standard table check

    // Assume format: | French | English | Pronunciation (optional) |
    // skip header row if it contains "French" or "Français"
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

    const titleMatch = content.match(/^# (.+)$/m);
    const durationMatch = content.match(/\*\*Durée (totale )?estimée\*\* : (.+)/);

    let title = titleMatch ? titleMatch[1].trim() : '';
    let duration = durationMatch ? durationMatch[2].trim() : '15:00';

    const hasVideo = content.includes('youtube.com') || content.includes('youtu.be') || content.includes('.mp4');
    const type = hasVideo ? 'video' : 'text';

    const vocabulary = extractVocabulary(content);

    return { title, duration, type, vocabulary };
}

function findLessonFiles() {
    const lessons = [];
    const courseDirs = ['A1.1', 'A1.2', 'A2.1', 'A2.2', 'B1.1', 'B1.2', 'B2.1', 'B2.2'];

    // 1. Standard Courses
    for (const courseDir of courseDirs) {
        const levelPrefix = courseDir[0] + courseDir[1];
        const coursePath = join(rootDir, 'Niveau_' + levelPrefix, courseDir);

        if (!existsSync(coursePath)) {
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
                .filter(f => f.endsWith('.md') && !f.includes('-Laurine'))
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

    // 2. Global Modules
    const globalModules = [
        { dir: 'Module_Global_A1', level: 'A1', id: 'a1-global', title: 'Module Global A1 : Mission Agent Secret', description: 'Une mission secrète immersive pour réviser tout le niveau A1 de manière ludique !' },
        { dir: 'Module_Global_A2', level: 'A2', id: 'a2-global', title: 'Module Global A2 : Le Voyage Temporel', description: 'Enquêtez sur un voyage dans le temps pour consolider vos acquis A2.' },
        { dir: 'Module_Global_B1', level: 'B1', id: 'b1-global', title: 'Module Global B1 : Sommet Francophone', description: 'Prenez la tête d\'un magazine et participez à un sommet international. Argumentez et convainquez !' }
    ];

    for (const mod of globalModules) {
        const coursePath = join(rootDir, `Niveau_${mod.level}`, mod.dir);

        if (existsSync(coursePath)) {
            // Register course in structure if missing
            if (!courseStructure[mod.dir]) {
                courseStructure[mod.dir] = {
                    level: mod.level,
                    title: mod.title,
                    description: mod.description
                };
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
                    .filter(f => f.endsWith('.md') && !f.includes('-Laurine'))
                    .sort();

                if (files.length > 0) {
                    const filePath = join(lessonPath, files[0]);
                    const content = readMarkdownFile(filePath);

                    if (content) {
                        const metadata = extractMetadata(content);
                        const lessonNumber = lessonDir.match(/\d+/)?.[0] || '0';

                        lessons.push({
                            courseId: mod.id,
                            courseDir: mod.dir, // Use directory as key for structure lookup
                            lessonNumber: parseInt(lessonNumber),
                            lessonId: `l${lessonNumber.padStart(2, '0')}`,
                            content,
                            ...metadata
                        });
                    }
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

        let sectionIndex = 0;
        let sectionTitle = `Module 1`;

        // Check for manual overrides for this course
        if (moduleOverrides[lesson.courseId]) {
            const overrides = moduleOverrides[lesson.courseId];
            let found = false;
            for (let i = 0; i < overrides.length; i++) {
                if (overrides[i].lessons.includes(lesson.lessonNumber)) {
                    sectionIndex = i;
                    sectionTitle = overrides[i].title || `Module ${i + 1}`;
                    found = true;
                    break;
                }
            }
            if (!found) {
                // Fallback for lessons not in the manual list: put them in a "Extra" module at the end
                sectionIndex = overrides.length;
                sectionTitle = "Modules Supplémentaires";
            }
        } else {
            // Default logic: Group by 4 lessons per module
            sectionIndex = Math.floor((lesson.lessonNumber - 1) / 4);
            sectionTitle = `Module ${sectionIndex + 1}`;
        }

        // Create sections if they don't exist
        while (courses[lesson.courseId].sections.length <= sectionIndex) {
            const idx = courses[lesson.courseId].sections.length;

            let titleToUse = `Module ${idx + 1}`;
            if (moduleOverrides[lesson.courseId] && idx < moduleOverrides[lesson.courseId].length) {
                titleToUse = moduleOverrides[lesson.courseId][idx].title;
            } else if (idx === sectionIndex) {
                titleToUse = sectionTitle;
            }

            courses[lesson.courseId].sections.push({
                id: `section-${idx + 1}`,
                title: titleToUse,
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
            vocabulary: lesson.vocabulary || [], // Use extracted vocabulary
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
