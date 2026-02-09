/**
 * Direct file-based course loader using Vite glob imports.
 * Eliminates the need for JSON generation scripts.
 * 
 * Folder structure:
 * Niveau_X/CourseId/NN_ModuleName/NN_LessonName.md
 * 
 * Example:
 * Niveau_B1/B1.1_bis/01_Module_Fondamentaux/01_Ce_qui_setait_passe.md
 */

import { CoursePackage, Section, Lesson, FrenchLevel, Resource, VocabItem } from '../types';

// Import all course config files
const courseConfigs = import.meta.glob('/Niveau_*/*/_course.json', {
    eager: true,
    import: 'default'
}) as Record<string, { title: string; level: FrenchLevel; description: string; resources?: Resource[] }>;

// Import all lesson markdown files (raw content)
const lessonFiles = import.meta.glob('/Niveau_*/*/*/*.md', {
    eager: true,
    query: '?raw',
    import: 'default'
}) as Record<string, string>;

/**
 * Parse a file path to extract course, module, and lesson info.
 * Path format: /Niveau_X/CourseDir/ModuleDir/LessonFile.md
 */
function parseLessonPath(path: string): {
    niveau: string;
    courseDir: string;
    courseId: string;
    moduleDir: string;
    moduleOrder: number;
    moduleTitle: string;
    lessonFile: string;
    lessonOrder: number;
    lessonSlug: string;
} | null {
    // Match pattern: /Niveau_X/CourseDir/ModuleDir/LessonFile.md
    const match = path.match(/\/Niveau_(\w+)\/([^/]+)\/([^/]+)\/([^/]+)\.md$/);
    if (!match) return null;

    const [, niveau, courseDir, moduleDir, lessonFile] = match;

    // Extract order from module folder (01_ModuleName -> order: 1, title: ModuleName)
    const moduleMatch = moduleDir.match(/^(\d+)_(.+)$/);
    const moduleOrder = moduleMatch ? parseInt(moduleMatch[1], 10) : 0;
    const moduleTitle = moduleMatch
        ? moduleMatch[2].replace(/_/g, ' ')
        : moduleDir.replace(/_/g, ' ');

    // Extract order from lesson file (01_LessonName.md -> order: 1, slug: LessonName)
    const lessonMatch = lessonFile.match(/^(\d+)_(.+)$/);
    const lessonOrder = lessonMatch ? parseInt(lessonMatch[1], 10) : 0;
    const lessonSlug = lessonMatch ? lessonMatch[2] : lessonFile;

    // Course ID: convert folder name to lowercase with hyphens
    // B1.1_bis -> b1-1_bis
    const courseId = courseDir.toLowerCase().replace(/\./g, '-');

    return {
        niveau,
        courseDir,
        courseId,
        moduleDir,
        moduleOrder,
        moduleTitle,
        lessonFile,
        lessonOrder,
        lessonSlug
    };
}

/**
 * Extract lesson title from markdown content.
 * Looks for first H1 heading: # Title
 */
function extractLessonTitle(content: string): string {
    // Remove BOM and leading whitespace
    const cleanContent = content.replace(/^\uFEFF/, '').trimStart();
    const match = cleanContent.match(/^#\s+(.+)$/m);
    return match ? match[1].trim() : 'Untitled Lesson';
}

/**
 * Extract duration from markdown metadata.
 * Looks for: **Durée estimée** : X heures
 */
function extractDuration(content: string): string {
    const match = content.match(/\*\*Durée estimée\*\*\s*:\s*(.+)/i);
    return match ? match[1].trim() : '45 min';
}

/**
 * Extract vocabulary from markdown table.
 * Looks for section ## Vocabulaire and parses the table.
 * Format: | Mot | Traduction | Exemple |
 */
function extractVocabulary(content: string): VocabItem[] {
    const vocabHeaderRegex = /##\s*Vocabulaire[^\n]*/i;
    const match = content.match(vocabHeaderRegex);
    if (!match) return [];

    const afterHeader = content.substring(match.index! + match[0].length);
    const lines = afterHeader.split(/\r?\n/);
    const vocabulary: VocabItem[] = [];

    for (const line of lines) {
        const trimmed = line.trim();
        // Skip empty lines
        if (!trimmed) continue;

        // Stop if we hit a new section (starting with #)
        if (trimmed.startsWith('#')) break;

        // Process only table rows
        if (trimmed.startsWith('|')) {
            if (trimmed.match(/^\|?\s*[-:]+\s*\|/)) continue; // Skip separators
            if (trimmed.match(/^\|?\s*(Mot|Français|Masculin)\s*\|/i)) continue; // Skip header

            // Split by pipe and clean
            const cells = trimmed.split('|').map(c => c.trim()).filter(c => c !== '');

            // Expect at least 2 columns
            if (cells.length >= 2) {
                const french = cells[0].replace(/[*_]/g, '').trim();
                vocabulary.push({
                    id: french.toLowerCase().replace(/[^a-z0-9]/g, '-'), // Generate simple ID
                    french: french,
                    translation: cells[1].replace(/[*_]/g, '').trim(), // Map to 'translation'
                    example: cells[2] ? cells[2].trim() : undefined
                });
            }
        }
    }

    return vocabulary;
}

/**
 * Extract Grammar Summary to create a resource.
 * Looks for: ## 📖 Grammar: Summary
 */
function extractGrammarSummary(content: string): Resource[] {
    // Regex to find the header
    const headerRegex = /##\s*(?:📖\s*)?(?:Grammar|Grammaire)[:\s]*(?:Summary|Synthesis|Synthèse|Récapitulatif)/i;
    const match = content.match(headerRegex);
    if (!match) return [];

    const startIndex = match.index! + match[0].length;
    const contentAfterStart = content.substring(startIndex); // Keep the rest

    // Find the next H2 header (## ) to stop extraction
    // We look for \n## because headers are usually at start of line
    const nextHeaderMatch = contentAfterStart.match(/\n##\s+/);

    // If found, cut there. If not, take everything until end.
    const endIndex = nextHeaderMatch ? nextHeaderMatch.index : contentAfterStart.length;

    const summaryContent = contentAfterStart.substring(0, endIndex).trim();

    if (!summaryContent) return [];

    return [{
        id: 'grammar-summary',
        name: 'Grammar Summary',
        type: 'guide', // Use the new type
        url: '',
        content: summaryContent
    }];
}

/**
 * Load all courses from the file system.
 * Returns CoursePackage[] matching the existing type structure.
 */
export function loadCourses(): CoursePackage[] {
    const courses: Map<string, CoursePackage> = new Map();
    const sectionsMap: Map<string, Map<string, Section>> = new Map();

    // First, initialize courses from _course.json files
    for (const [configPath, config] of Object.entries(courseConfigs)) {
        const match = configPath.match(/\/Niveau_(\w+)\/([^/]+)\/_course\.json$/);
        if (!match) continue;

        const [, , courseDir] = match;
        const courseId = courseDir.toLowerCase().replace(/\./g, '-');

        courses.set(courseId, {
            id: courseId,
            title: config.title,
            level: config.level,
            description: config.description,
            sections: [],
            resources: config.resources || []
        });
        sectionsMap.set(courseId, new Map());
    }

    // Then, process all lesson files
    for (const [path, content] of Object.entries(lessonFiles)) {
        const parsed = parseLessonPath(path);
        if (!parsed) continue;

        const { courseId, moduleOrder, moduleTitle, lessonOrder, lessonSlug } = parsed;

        // Skip if course doesn't have a config
        if (!courses.has(courseId)) {
            console.warn(`Lesson found but no _course.json: ${path}`);
            continue;
        }

        // Get or create section
        const courseSections = sectionsMap.get(courseId)!;
        const sectionKey = `${moduleOrder}_${moduleTitle}`;

        if (!courseSections.has(sectionKey)) {
            courseSections.set(sectionKey, {
                id: `section-${moduleOrder}`,
                title: moduleTitle,
                lessons: []
            });
        }

        const section = courseSections.get(sectionKey)!;

        // Create lesson
        const lesson: Lesson = {
            id: lessonSlug.toLowerCase().replace(/[^a-z0-9]+/g, '_'),
            title: extractLessonTitle(content),
            content: content,
            duration: extractDuration(content),
            type: 'text',
            completed: false,
            vocabulary: extractVocabulary(content),
            resources: extractGrammarSummary(content), // Extract grammar summary
            comments: []
        };

        // Add lesson with its order for sorting
        section.lessons.push({ ...lesson, _order: lessonOrder } as Lesson & { _order: number });
    }

    // Sort and finalize sections
    for (const [courseId, course] of courses) {
        const courseSections = sectionsMap.get(courseId)!;

        // Convert to array and sort by module order
        const sortedSections = Array.from(courseSections.entries())
            .sort((a, b) => {
                const orderA = parseInt(a[0].split('_')[0], 10);
                const orderB = parseInt(b[0].split('_')[0], 10);
                return orderA - orderB;
            })
            .map(([, section]) => {
                // Sort lessons within section
                const sortedLessons = (section.lessons as (Lesson & { _order: number })[])
                    .sort((a, b) => a._order - b._order)
                    .map(({ _order, ...lesson }) => lesson as Lesson);

                return { ...section, lessons: sortedLessons };
            });

        course.sections = sortedSections;
    }

    return Array.from(courses.values());
}

/**
 * Get a specific course by ID.
 */
export function getCourseById(courseId: string): CoursePackage | undefined {
    return loadCourses().find(c => c.id === courseId);
}
