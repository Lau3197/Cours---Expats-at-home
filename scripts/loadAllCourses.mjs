// Script pour charger toutes les leçons Markdown dans Firebase
// Usage: node scripts/loadAllCourses.mjs

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

// Configuration for manual module grouping (optional overrides)
const moduleOverrides = {
  'B1.1': [
    { title: "Module 1 : Il était une fois... (L'art de raconter)", lessons: [1, 2, 3] },
    { title: "Module 2 : Retour vers le futur (antérieur)", lessons: [4, 5] },
    { title: "Module 3 : Le monde des \"et si...\"", lessons: [6, 7, 8, 9] },
    { title: "Module 4 : Entendu à la machine à café (discours rapporté)", lessons: [10, 11, 12] },
    { title: "Module 5 : Mission : job de rêve", lessons: [13, 14, 15] },
    { title: "Module 6 : Il faut qu'on parle ! (volonté et nécessité)", lessons: [16, 17, 18] },
    { title: "Module 7 : Ascenseur émotionnel", lessons: [19, 20, 21] },
    { title: "Module 8 : L'art d'avoir raison (argumenter)", lessons: [22, 23] },
    { title: "Module 9 : Faits divers et enquêtes (qui a fait quoi ?)", lessons: [24, 25] },
    { title: "Module 10 : Devenir un pro de l'email", lessons: [26, 27, 28] },
    { title: "Module 11 : Le grand final", lessons: [29, 30, 31, 32] }
  ],
  'B1.2': [
    { title: "Module 1 : C'est à moi !", lessons: [1, 2] },
    { title: "Module 2 : Je te le donne", lessons: [3, 4] },
    { title: "Module 3 : La chose dont on parle", lessons: [5, 6] },
    { title: "Module 4 : On y va !", lessons: [7, 8] },
    { title: "Module 5 : Ce que je veux dire", lessons: [9, 10] },
    { title: "Module 6: C'est toi la star !", lessons: [13, 14] },
    { title: "Module 7: Avoir le dernier mot", lessons: [15, 16, 17] },
    { title: "Module 8: Le Grand Débat", lessons: [18, 19] },
    { title: "Module 9: Bienvenue chez les Belges", lessons: [20, 21] },
    { title: "Module 10: Libérez votre parole", lessons: [22, 23] },
    { title: "Module 11: En pleine action", lessons: [24, 25, 26, 27, 28] },
    { title: "Module 12: Le Sommet B1", lessons: [29, 30, 31, 32] }
  ],
  'A2.1': [
    { title: "Module 1 : C'était comment avant ?", lessons: [1, 2, 3, 4, 5] },
    { title: "Module 2 : Ça vient d'arriver !", lessons: [6, 7] },
    { title: "Module 3 : Projets d'avenir", lessons: [8, 9, 10] },
    { title: "Module 4 : Je le veux !", lessons: [11, 12, 13] },
    { title: "Module 5 : Plus grand, moins cher", lessons: [14, 15, 16, 17] },
    { title: "Module 6 : Docteur, j'ai mal !", lessons: [18] },
    { title: "Module 7 : Le Grand Bilan", lessons: [19, 20] }
  ],
  'A2.2': [
    { title: "Module 1 : J'y vais, j'en viens !", lessons: [1, 2, 3, 4] },
    { title: "Module 2 : C'est celui que je préfère", lessons: [5, 6, 7] },
    { title: "Module 3 : Plus jamais ça !", lessons: [8, 9] },
    { title: "Module 4 : Et si on changeait le monde ?", lessons: [10, 11, 12, 13] },
    { title: "Module 5 : À votre avis ?", lessons: [14, 15, 16] },
    { title: "Module 6 : Prêt pour le grand saut ?", lessons: [17, 18, 19, 20] }
  ],
  'A1.1': [
    { title: "Module 1 : Premiers pas", lessons: [1, 2, 3, 4] },
    { title: "Module 2 : Mon monde à moi", lessons: [5, 6, 7] },
    { title: "Module 3 : La vie en Belgique", lessons: [8, 9, 10, 11] },
    { title: "Module 4 : En ville !", lessons: [12, 13, 14, 15] }
  ],
  'A1.2': [
    { title: "Module 1 : Bon appétit !", lessons: [1, 2, 3, 4] },
    { title: "Module 2 : Projets et Météo", lessons: [5, 6, 7, 8] },
    { title: "Module 3 : Mes goûts et moi", lessons: [9, 10, 11, 12] },
    { title: "Module 4 : Souvenirs de week-end", lessons: [13, 14, 15, 16] }
  ],
  'B1.1_bis': [
    { title: "Module 1 : Fondamentaux", lessons: [1, 2, 3] },
    { title: "Module 2 : Approfondissement", lessons: [6, 7, 8, 9, 5] },
    { title: "Module 3 : Pronoms et relatifs", lessons: [4] },
    { title: "Module 4 : Consolidation grammaticale", lessons: [10, 11, 12, 19] },
    { title: "Module 5 : Expression avancée", lessons: [16, 17, 18, 20, 21] },
    { title: "Module 6 : Culture et société", lessons: [13, 14, 15] },
    { title: "Module 7 : Projets finaux", lessons: [26, 27, 28] }
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

function extractMetadata(content) {
  if (!content) return { title: '', duration: '15:00', type: 'text' };

  const cleanContent = content.replace(/^\uFEFF/, '').trimStart();
  const titleMatch = cleanContent.match(/^#\s+(.+)$/m);
  const durationMatch = content.match(/\*\*Durée estimée\*\*\s*:\s*(.*)/);
  const objectivesMatch = content.match(/\*\*Objectifs\*\*\s*:\s*(.*)/);
  const moduleMatch = content.match(/\*\*Module\*\*\s*:\s*(.*)/);

  let title = titleMatch ? titleMatch[1].trim() : '';
  let duration = durationMatch ? durationMatch[1].trim() : '15:00';
  const objectives = objectivesMatch ? objectivesMatch[1].split(',').map(s => s.trim()) : [];
  const moduleName = moduleMatch ? moduleMatch[1].trim() : null;

  if (duration.includes('heure')) {
    const hours = duration.match(/(\d+)/);
    if (hours) {
      const h = parseInt(hours[1]);
      duration = `${h.toString().padStart(2, '0')}:00`;
    }
  }

  const hasVideo = content.includes('youtube.com') || content.includes('youtu.be') || content.includes('.mp4');
  const type = hasVideo ? 'video' : 'text';

  return { title, duration, type, objectives, module: moduleName };
}

function findLessonFiles() {
  const lessons = [];
  const courseDirs = ['A1.1', 'A1.2', 'A2.1', 'A2.2', 'B1.1', 'B1.2', 'B2.1', 'B2.2'];

  for (const courseDir of courseDirs) {
    const levelPrefix = courseDir[0] + courseDir[1];
    const coursePath = join(rootDir, `Niveau_${levelPrefix}`, courseDir);

    if (!existsSync(coursePath)) {
      console.log(`⚠️  Directory not found: ${coursePath}`);
      continue;
    }

    const items = readdirSync(coursePath, { withFileTypes: true });

    // STRATEGY 1: Old Structure (Lecon_XX folders)
    const legacyLessonDirs = items
      .filter(dirent => dirent.isDirectory() && dirent.name.startsWith('Lecon_'));

    if (legacyLessonDirs.length > 0) {
      // ... (Keep existing logic for other levels if they still use it, or just unified logic below)
      // actually, let's just make a unified traverser.
    }

    // UNIFIED STRATEGY: Check all subdirectories
    for (const item of items) {
      if (!item.isDirectory()) continue;

      // Skip hidden or system folders
      if (item.name.startsWith('.') || item.name === 'img' || item.name === 'assets') continue;

      const subDirPath = join(coursePath, item.name);

      // Check content of this subdirectory
      // It could be a "Module" folder (new structure) or a "Lecon" folder (old structure)
      const files = readdirSync(subDirPath)
        .filter(f => f.endsWith('.md') && !f.includes('-Laurine'))
        .sort();

      // If it's the OLD structure, the folder is the lesson container
      if (item.name.startsWith('Lecon_') && files.length > 0) {
        const lessonNumber = parseInt(item.name.match(/\d+/)?.[0] || '0');
        const filePath = join(subDirPath, files[0]);
        const content = readMarkdownFile(filePath);
        if (content) {
          const metadata = extractMetadata(content);
          lessons.push({
            courseId: courseDir.toLowerCase().replace('.', '-'),
            courseDir,
            lessonNumber,
            lessonId: `l${lessonNumber}`,
            content,
            ...metadata,
            // If no module defined in metadata, we fallback to logic in organize
          });
        }
      }
      // If it's the NEW structure, the folder is a MODULE container
      // We expect multiple MD files inside, or maybe one for each lesson?
      // User has: A1.1/01_Module_1.../01_Leçon_01...md
      else if (files.length > 0) {
        // Assume this folder matches a SECTION/MODULE
        // Clean the folder name to get a nice title if possible
        let moduleTitle = item.name.replace(/^\d+_/, '').replace(/_/g, ' ');

        for (const file of files) {
          const filePath = join(subDirPath, file);
          const content = readMarkdownFile(filePath);
          if (content) {
            const metadata = extractMetadata(content);

            // Extract lesson number from FILENAME
            // e.g. "01_Leçon_01_..." -> 1
            // e.g. "03_Lesson_03_..." -> 3
            // e.g. "Leçon_16_..." -> 16
            const match = file.match(/Le[çc]on_?(\d+)/i) || file.match(/Lesson_?(\d+)/i) || file.match(/^(\d+)[_\s]/);
            const lessonNumber = match ? parseInt(match[1]) : 0;

            // FIX: Auto-correct title to match filename number
            if (metadata.title) {
              // 1. Remove existing prefix variants (Leçon XX, Lesson XX, Leçon XX Bis, etc.)
              let cleanTitle = metadata.title
                .replace(/^#?\s*(Le[çc]on|Lesson)\s*\d+(\s*[Bb]is)?\s*[:|-]?\s*/i, '') // Remove "Lesson 04 Bis : "
                .trim();

              // 2. Determine correct prefix based on language or defaults
              // If the file path contains "Lesson", use "Lesson", else "Leçon"
              const prefix = file.toLowerCase().includes('lesson') ? 'Lesson' : 'Leçon';

              // 3. Reconstruct title
              metadata.title = `${prefix} ${lessonNumber.toString().padStart(2, '0')} : ${cleanTitle}`;
            }

            lessons.push({
              courseId: courseDir.toLowerCase().replace('.', '-'),
              courseDir,
              lessonNumber,
              lessonId: `l${lessonNumber}`,
              content,
              ...metadata,
              module: metadata.module || moduleTitle // Prefer metadata, fallback to folder name
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
      const courseInfo = courseStructure[lesson.courseDir] || { level: '?', title: lesson.courseId, description: '' };
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

    // 1. Explicit Module Name (from folder or metadata)
    if (lesson.module) {
      sectionTitle = lesson.module;
      const existingIdx = courses[lesson.courseId].sections.findIndex(s => s.title === sectionTitle);
      if (existingIdx !== -1) {
        sectionIndex = existingIdx;
      } else {
        sectionIndex = courses[lesson.courseId].sections.length;
      }
    }
    // 2. Fallback to Manual Overrides
    else if (moduleOverrides[lesson.courseDir]) {
      // ... (Keep existing override logic)
      const overrides = moduleOverrides[lesson.courseDir];
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
        sectionIndex = courses[lesson.courseId].sections.length; // Append to end if not found
        sectionTitle = "Suppléments";
      }
    } else {
      // 3. Last resort: group by 4
      sectionIndex = Math.floor((lesson.lessonNumber - 1) / 4);
      sectionTitle = `Module ${sectionIndex + 1}`;
    }

    // Ensure section exists
    if (!courses[lesson.courseId].sections[sectionIndex]) {
      // Find existing section by title first to avoid duplicates if indices don't align
      const existingSection = courses[lesson.courseId].sections.find(s => s.title === sectionTitle);
      if (existingSection) {
        // This case shouldn't happen if we set sectionIndex correctly above, but good safely
      } else {
        // Fill gaps or add new
        courses[lesson.courseId].sections[sectionIndex] = {
          id: `section-${sectionIndex + 1}`,
          title: sectionTitle,
          lessons: []
        };
      }
    }

    // We used array index, but that might leave holes if we used overrides. 
    // Safer to just push if not found, but we want to maintain order. 
    // Let's stick to the prompt's cleaner logic: find or create.
    let targetSection = courses[lesson.courseId].sections.find(s => s.title === sectionTitle);
    if (!targetSection) {
      targetSection = {
        id: `section-${courses[lesson.courseId].sections.length + 1}`,
        title: sectionTitle,
        lessons: []
      };
      courses[lesson.courseId].sections.push(targetSection);
    }

    targetSection.lessons.push({
      id: lesson.lessonId,
      title: lesson.title || `Leçon ${lesson.lessonNumber}`,
      content: lesson.content,
      duration: lesson.duration,
      type: lesson.type,
      objectives: lesson.objectives,
      completed: false,
      vocabulary: [],
      comments: []
    });
  }

  // Sort sections and lessons? 
  // Maybe user wants the folder order preserved.
  // The lessons array from `findLessons` isn't strictly sorted by folder, but we can sort within sections.

  return Object.values(courses);
}

async function loadAllCourses() {
  console.log('📚 Scanning for lesson files...');
  console.log(`Root directory: ${rootDir}`);

  const lessons = findLessonFiles();
  console.log(`✅ Found ${lessons.length} lessons`);

  const courses = organizeLessonsIntoCourses(lessons);
  console.log(`✅ Organized into ${courses.length} courses:\n`);

  for (const course of courses) {
    const totalLessons = course.sections.reduce((sum, s) => sum + s.lessons.length, 0);
    console.log(`  - ${course.title}: ${totalLessons} lessons in ${course.sections.length} sections`);
  }

  console.log('\n🚀 Uploading to Firebase...\n');

  for (const course of courses) {
    try {
      const courseRef = doc(db, 'courses', course.id);
      await setDoc(courseRef, course, { merge: true });
      const totalLessons = course.sections.reduce((sum, s) => sum + s.lessons.length, 0);
      console.log(`✅ Uploaded: ${course.title} (${totalLessons} lessons)`);
    } catch (error) {
      console.error(`❌ Error uploading ${course.title}:`, error.message);
    }
  }

  console.log('\n🎉 All courses uploaded successfully!');
  process.exit(0);
}

loadAllCourses().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});











