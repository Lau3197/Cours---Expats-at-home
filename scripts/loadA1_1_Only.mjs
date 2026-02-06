// Script pour recharger UNIQUEMENT le niveau A1.1
// Usage: node scripts/loadA1_1_Only.mjs

import { readFileSync, readdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyA-l53RiwCiEKXvWDLwXmEAMqaYWbbyRTU",
    authDomain: "cours-a1-b2.firebaseapp.com",
    projectId: "cours-a1-b2",
    storageBucket: "cours-a1-b2.firebasestorage.app",
    messagingSenderId: "580711237544",
    appId: "1:580711237544:web:5e3821dee7b252fb1b7f9d",
    measurementId: "G-RLE1LXB7H0"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

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
    const durationMatch = content.match(/\*\*Durée estimée\*\*\s*:\s*(.*)/);

    let title = titleMatch ? titleMatch[1].trim() : '';
    let duration = durationMatch ? durationMatch[1].trim() : '15:00';

    const hasVideo = content.includes('youtube.com') || content.includes('youtu.be') || content.includes('.mp4');
    const type = hasVideo ? 'video' : 'text';

    return { title, duration, type };
}

function loadA11Only() {
    console.log('📚 Chargement UNIQUEMENT du niveau A1.1...');

    const coursePath = join(rootDir, 'Niveau_A1', 'A1.1');

    if (!existsSync(coursePath)) {
        console.error('❌ Dossier A1.1 non trouvé:', coursePath);
        process.exit(1);
    }

    const lessons = [];
    const sections = [];

    // Parcourir les modules
    const moduleDirs = readdirSync(coursePath, { withFileTypes: true })
        .filter(d => d.isDirectory() && !d.name.startsWith('.'))
        .sort();

    for (const moduleDir of moduleDirs) {
        const modulePath = join(coursePath, moduleDir.name);
        const moduleTitle = moduleDir.name.replace(/^\d+_/, '').replace(/_/g, ' ');

        const files = readdirSync(modulePath)
            .filter(f => f.endsWith('.md') && !f.includes('-Laurine'))
            .sort();

        const sectionLessons = [];

        for (const file of files) {
            const filePath = join(modulePath, file);
            const content = readMarkdownFile(filePath);

            if (content) {
                const metadata = extractMetadata(content);

                // Extraire le numéro de leçon du NOM DU FICHIER
                const match = file.match(/Le[çc]on_?(\d+)/i) || file.match(/Lesson_?(\d+)/i) || file.match(/^(\d+)[_\s]/);
                const lessonNumber = match ? parseInt(match[1]) : 0;

                // FORCER le titre avec le numéro du fichier
                let cleanTitle = metadata.title
                    .replace(/^#?\s*(Le[çc]on|Lesson)\s*\d+(\s*[Bb]is)?\s*[:|-]?\s*/i, '')
                    .trim();

                const prefix = file.toLowerCase().includes('lesson') ? 'Lesson' : 'Leçon';
                const newTitle = `${prefix} ${lessonNumber.toString().padStart(2, '0')} : ${cleanTitle}`;

                console.log(`  ✅ ${file} -> "${newTitle}"`);

                sectionLessons.push({
                    id: `l${lessonNumber}`,
                    title: newTitle,
                    content: content,
                    duration: metadata.duration,
                    type: metadata.type,
                    completed: false,
                    vocabulary: [],
                    comments: []
                });
            }
        }

        if (sectionLessons.length > 0) {
            sections.push({
                id: `section-${sections.length + 1}`,
                title: moduleTitle,
                lessons: sectionLessons
            });
        }
    }

    const course = {
        id: 'a1-1',
        title: 'Niveau A1.1 - Premiers Pas en Belgique',
        level: 'A1',
        description: 'The foundational course for new expats. Master greetings, self-introduction, and daily essentials in the Belgian context.',
        sections: sections,
        resources: []
    };

    const totalLessons = sections.reduce((sum, s) => sum + s.lessons.length, 0);
    console.log(`\n📊 Total: ${totalLessons} leçons dans ${sections.length} modules\n`);

    return course;
}

async function uploadToFirebase(course) {
    console.log('🚀 Upload vers Firebase...');

    try {
        const courseRef = doc(db, 'courses', course.id);
        await setDoc(courseRef, course, { merge: false }); // REMPLACE COMPLÈTEMENT
        console.log('✅ A1.1 uploadé avec succès!');
    } catch (error) {
        console.error('❌ Erreur upload:', error.message);
    }

    process.exit(0);
}

const course = loadA11Only();
uploadToFirebase(course);
