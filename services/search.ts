// Service de recherche fuzzy pour les cours et leçons
import { CoursePackage, Lesson } from '../types';

/**
 * Calcule la distance de Levenshtein entre deux chaînes
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];
  const len1 = str1.length;
  const len2 = str2.length;

  if (len1 === 0) return len2;
  if (len2 === 0) return len1;

  for (let i = 0; i <= len2; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= len1; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= len2; i++) {
    for (let j = 1; j <= len1; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[len2][len1];
}

/**
 * Normalise une chaîne pour la recherche (enlève accents, met en minuscule)
 */
function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/**
 * Calcule un score de similarité entre 0 et 1
 */
function similarityScore(str1: string, str2: string): number {
  const normalized1 = normalizeString(str1);
  const normalized2 = normalizeString(str2);

  // Si exact match
  if (normalized1 === normalized2) return 1;

  // Si contient
  if (normalized1.includes(normalized2) || normalized2.includes(normalized1)) {
    return 0.9;
  }

  // Calcul de distance de Levenshtein
  const distance = levenshteinDistance(normalized1, normalized2);
  const maxLength = Math.max(normalized1.length, normalized2.length);
  const similarity = 1 - distance / maxLength;

  return Math.max(0, similarity);
}

export interface SearchResult {
  course: CoursePackage;
  score: number;
  matchedFields: string[];
  matchedLessons?: Array<{ lesson: Lesson; score: number }>;
}

export interface LessonSearchResult {
  lesson: Lesson;
  course: CoursePackage;
  sectionId: string;
  score: number;
}

/**
 * Recherche fuzzy dans les cours
 */
export function fuzzySearchCourses(
  courses: CoursePackage[],
  searchTerm: string,
  threshold: number = 0.3
): SearchResult[] {
  if (!searchTerm.trim()) {
    return courses.map(course => ({
      course,
      score: 1,
      matchedFields: []
    }));
  }

  const normalizedSearch = normalizeString(searchTerm);
  const results: SearchResult[] = [];

  for (const course of courses) {
    let maxScore = 0;
    const matchedFields: string[] = [];
    const matchedLessons: Array<{ lesson: Lesson; score: number }> = [];

    // Recherche dans le titre
    const titleScore = similarityScore(course.title, normalizedSearch);
    if (titleScore > threshold) {
      maxScore = Math.max(maxScore, titleScore);
      matchedFields.push('title');
    }

    // Recherche dans la description
    const descScore = similarityScore(course.description, normalizedSearch);
    if (descScore > threshold) {
      maxScore = Math.max(maxScore, descScore);
      matchedFields.push('description');
    }

    // Recherche dans le niveau
    const levelScore = similarityScore(course.level, normalizedSearch);
    if (levelScore > threshold) {
      maxScore = Math.max(maxScore, levelScore);
      matchedFields.push('level');
    }

    // Recherche dans les leçons
    course.sections.forEach(section => {
      section.lessons.forEach(lesson => {
        const lessonTitleScore = similarityScore(lesson.title, normalizedSearch);
        const lessonContentScore = lesson.content 
          ? similarityScore(lesson.content.substring(0, 200), normalizedSearch) 
          : 0;
        
        const lessonScore = Math.max(lessonTitleScore, lessonContentScore * 0.5);
        
        if (lessonScore > threshold) {
          matchedLessons.push({ lesson, score: lessonScore });
          maxScore = Math.max(maxScore, lessonScore * 0.7); // Les leçons ont un poids moindre
        }
      });
    });

    if (maxScore > threshold) {
      results.push({
        course,
        score: maxScore,
        matchedFields,
        matchedLessons: matchedLessons.length > 0 ? matchedLessons.sort((a, b) => b.score - a.score).slice(0, 3) : undefined
      });
    }
  }

  // Trier par score décroissant
  return results.sort((a, b) => b.score - a.score);
}

/**
 * Recherche fuzzy dans les leçons individuelles
 */
export function fuzzySearchLessons(
  courses: CoursePackage[],
  searchTerm: string,
  threshold: number = 0.3
): LessonSearchResult[] {
  if (!searchTerm.trim()) {
    return [];
  }

  const normalizedSearch = normalizeString(searchTerm);
  const results: LessonSearchResult[] = [];

  for (const course of courses) {
    course.sections.forEach(section => {
      section.lessons.forEach(lesson => {
        const lessonTitleScore = similarityScore(lesson.title, normalizedSearch);
        const lessonContentScore = lesson.content 
          ? similarityScore(lesson.content.substring(0, 500), normalizedSearch) 
          : 0;
        
        const lessonScore = Math.max(lessonTitleScore, lessonContentScore * 0.6);
        
        if (lessonScore > threshold) {
          results.push({
            lesson,
            course,
            sectionId: section.id,
            score: lessonScore
          });
        }
      });
    });
  }

  // Trier par score décroissant
  return results.sort((a, b) => b.score - a.score);
}

/**
 * Extrait des suggestions de recherche basées sur les cours
 */
export function getSearchSuggestions(
  courses: CoursePackage[],
  searchTerm: string,
  limit: number = 5
): string[] {
  if (!searchTerm.trim() || searchTerm.length < 2) {
    return [];
  }

  const normalizedSearch = normalizeString(searchTerm);
  const suggestions = new Set<string>();

  // Extraire des mots-clés des titres et descriptions
  courses.forEach(course => {
    const titleWords = course.title.split(/\s+/).filter(w => w.length > 2);
    const descWords = course.description.split(/\s+/).filter(w => w.length > 2);
    
    [...titleWords, ...descWords].forEach(word => {
      const normalized = normalizeString(word);
      if (normalized.startsWith(normalizedSearch) && normalized !== normalizedSearch) {
        suggestions.add(word);
      }
    });

    // Ajouter les titres de leçons
    course.sections.forEach(section => {
      section.lessons.forEach(lesson => {
        const lessonWords = lesson.title.split(/\s+/).filter(w => w.length > 2);
        lessonWords.forEach(word => {
          const normalized = normalizeString(word);
          if (normalized.startsWith(normalizedSearch) && normalized !== normalizedSearch) {
            suggestions.add(word);
          }
        });
      });
    });
  });

  return Array.from(suggestions).slice(0, limit);
}

