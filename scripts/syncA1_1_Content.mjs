// Script pour synchroniser a1_1_content.ts avec les fichiers markdown
// Usage: node scripts/syncA1_1_Content.mjs

import { readFileSync, readdirSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

const A1_1_PATH = join(rootDir, 'Niveau_A1', 'A1.1');
const OUTPUT_PATH = join(rootDir, 'data', 'courses', 'a1_1_content.ts');

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

function extractLessonNumber(filename) {
    const match = filename.match(/Le[çc]on_?(\d+)/i) || filename.match(/Lesson_?(\d+)/i);
    return match ? parseInt(match[1]) : 0;
}

function syncA1_1Content() {
    console.log('📚 Synchronisation des leçons A1.1...\n');

    if (!existsSync(A1_1_PATH)) {
        console.error('❌ Dossier A1.1 non trouvé:', A1_1_PATH);
        process.exit(1);
    }

    const lessons = [];

    // Parcourir tous les modules
    const moduleDirs = readdirSync(A1_1_PATH, { withFileTypes: true })
        .filter(d => d.isDirectory() && !d.name.startsWith('.'))
        .sort();

    for (const moduleDir of moduleDirs) {
        const modulePath = join(A1_1_PATH, moduleDir.name);
        const files = readdirSync(modulePath)
            .filter(f => f.endsWith('.md') && !f.includes('-Laurine'))
            .sort();

        for (const file of files) {
            const filePath = join(modulePath, file);
            const content = readMarkdownFile(filePath);
            const lessonNumber = extractLessonNumber(file);

            if (content && lessonNumber > 0) {
                // Nettoyer le contenu pour l'intégration dans le fichier TS
                const cleanContent = content.trim().replace(/`/g, '\\`').replace(/\${/g, '\\${');

                lessons.push({
                    number: lessonNumber,
                    content: cleanContent,
                    file: file
                });

                console.log(`  ✅ l${lessonNumber} <- ${file}`);
            }
        }
    }

    // Trier par numéro de leçon
    lessons.sort((a, b) => a.number - b.number);

    // Générer le fichier TypeScript
    let tsContent = `
export const A1_1_LESSONS: { [key: string]: string } = {
`;

    for (const lesson of lessons) {
        tsContent += `  l${lesson.number}: \`${lesson.content}\`,\n\n`;
    }

    tsContent += `};\n`;

    // Écrire le fichier
    writeFileSync(OUTPUT_PATH, tsContent, 'utf-8');

    console.log(`\n✅ Fichier généré: ${OUTPUT_PATH}`);
    console.log(`📊 Total: ${lessons.length} leçons synchronisées`);
}

syncA1_1Content();
