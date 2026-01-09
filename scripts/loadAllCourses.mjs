// Script pour charger toutes les leçons Markdown dans Firebase
// Usage: node scripts/loadAllCourses.mjs

import { readFileSync, readdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..', '..');

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
  const durationMatch = content.match(/\*\*Durée estimée\*\* : (.+)/);
  
  let title = titleMatch ? titleMatch[1].trim() : '';
  let duration = durationMatch ? durationMatch[1].trim() : '15:00';
  
  if (duration.includes('heure')) {
    const hours = duration.match(/(\d+)/);
    if (hours) {
      const h = parseInt(hours[1]);
      duration = `${h.toString().padStart(2, '0')}:00`;
    }
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
    const coursePath = join(rootDir, `Niveau_${levelPrefix}`, courseDir);
    
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
      courses[lesson.courseId] = {
        id: lesson.courseId,
        title: courseInfo.title,
        level: courseInfo.level,
        description: courseInfo.description,
        sections: [],
        resources: []
      };
    }
    
    let sectionIndex = Math.floor((lesson.lessonNumber - 1) / 4);
    if (sectionIndex >= courses[lesson.courseId].sections.length) {
      courses[lesson.courseId].sections.push({
        id: `section-${sectionIndex + 1}`,
        title: `Module ${sectionIndex + 1}`,
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











