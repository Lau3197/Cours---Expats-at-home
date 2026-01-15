// Script pour générer un fichier JSON avec toutes les leçons
// Usage: node scripts/generateLessonsJSON.mjs

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
  if (!content) return { title: '', duration: '15:00', type: 'text', objectives: [] };

  const titleMatch = content.match(/^# (.+)$/m);
  const durationMatch = content.match(/\*\*Durée estimée\*\*\s*:\s*(.*)/);
  const objectivesMatch = content.match(/\*\*Objectifs\*\*\s*:\s*(.*)/);
  const moduleMatch = content.match(/\*\*Module\*\*\s*:\s*(.*)/);

  let title = titleMatch ? titleMatch[1].trim() : '';
  let duration = durationMatch ? durationMatch[1].trim() : '15:00';
  const objectives = objectivesMatch ? objectivesMatch[1].split(',').map(s => s.trim()) : [];
  const moduleName = moduleMatch ? moduleMatch[1].trim() : null;

  if (moduleName) console.log(`found MODULE meta: ${moduleName} in ${title}`);

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
    const coursePath = join(rootDir, 'Niveau_' + levelPrefix, courseDir);

    if (!existsSync(coursePath)) {
      console.log(`⚠️  Directory not found: ${coursePath}`);
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
            lessonId: `l${lessonNumber}`,
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
      if (!courseInfo) {
        console.error(`🚨 MISSING CONFIG for ${lesson.courseDir} (needed for ${lesson.courseId})`);
        continue;
      }
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

    // 1. Metadata-First: Check if file defines its own module
    if (lesson.module) {
      sectionTitle = lesson.module;
      // Check if this section already exists to get its index
      const existingIdx = courses[lesson.courseId].sections.findIndex(s => s.title === sectionTitle);
      if (existingIdx !== -1) {
        sectionIndex = existingIdx;
      } else {
        // Create new section at the end
        sectionIndex = courses[lesson.courseId].sections.length;
      }
    }
    // 2. Manual Overrides (Legacy/Fallback)
    else if (moduleOverrides[lesson.courseDir]) {
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
        sectionIndex = overrides.length;
        sectionTitle = "Modules Supplémentaires";
      }
    } else {
      // 3. Default logic: Group by 4 lessons per module
      sectionIndex = Math.floor((lesson.lessonNumber - 1) / 4);
      sectionTitle = `Module ${sectionIndex + 1}`;
    }

    // Create sections if they don't exist
    while (courses[lesson.courseId].sections.length <= sectionIndex) {
      const idx = courses[lesson.courseId].sections.length;

      let titleToUse = `Module ${idx + 1}`;
      if (moduleOverrides[lesson.courseDir] && idx < moduleOverrides[lesson.courseDir].length) { // Changed lesson.courseId to lesson.courseDir
        titleToUse = moduleOverrides[lesson.courseDir][idx].title;
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
      objectives: lesson.objectives,
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

  for (const course of courses) {
    const totalLessons = course.sections.reduce((sum, s) => sum + s.lessons.length, 0);
    console.log(`  - ${course.title}: ${totalLessons} lessons in ${course.sections.length} sections`);
  }

  const outputPath = join(__dirname, '..', 'data', 'allCourses.json');
  writeFileSync(outputPath, JSON.stringify(courses, null, 2), 'utf-8');

  console.log(`\n✅ Generated JSON file: ${outputPath}`);
  console.log(`\n📦 Total size: ${(JSON.stringify(courses).length / 1024 / 1024).toFixed(2)} MB`);
  console.log('\n🎉 JSON file generated successfully!');
  console.log('\n💡 Next step: Use the "Load All Courses from JSON" button in the Admin Dashboard.');
}

generateJSON();



