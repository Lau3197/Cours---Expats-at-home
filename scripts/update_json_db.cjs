
const fs = require('fs');
const path = require('path');

const jsonPath = path.join(__dirname, '../data/allCourses.json');
const a21Dir = path.join(__dirname, '../Niveau_A2/A2.1');

// Helper to read lesson content
function readLesson(dirName) {
    const dirPath = path.join(a21Dir, dirName);
    if (!fs.existsSync(dirPath)) return "Content not found";
    const files = fs.readdirSync(dirPath);
    const mdFile = files.find(f => f.endsWith('.md'));
    if (!mdFile) return "Content not found";
    return fs.readFileSync(path.join(dirPath, mdFile), 'utf8');
}

// Define the structure of A2.1 (Same as in mockData.ts)
const newA21 = {
    id: 'a2-1',
    title: 'Niveau A2.1 - Raconter au Passé',
    level: 'A2',
    description: 'Maîtrisez les temps du passé, le futur simple, les pronoms COD/COI et bien plus encore pour raconter vos expériences en Belgique.',
    resources: [
        { id: 'r_a21_1', name: 'Imparfait_Cheatsheet.pdf', type: 'pdf', url: '#' },
        { id: 'r_a21_2', name: 'PC_vs_Imparfait_Guide.pdf', type: 'pdf', url: '#' },
        { id: 'r_a21_3', name: 'Les_Pronoms_Tableau.pdf', type: 'pdf', url: '#' }
    ],
    sections: [
        {
            id: 's_a21_1',
            title: 'Module 1: L\'Imparfait et Souvenirs',
            lessons: [
                { id: 'a21_l1', dir: 'Lecon_01', type: 'text', title: 'Leçon 01: Souvenirs d\'enfance', duration: '20:00' },
                { id: 'a21_l2', dir: 'Lecon_02', type: 'text', title: 'Leçon 02: La vie avant la Belgique', duration: '20:00' }
            ]
        },
        {
            id: 's_a21_2',
            title: 'Module 2: Imparfait vs Passé Composé',
            lessons: [
                { id: 'a21_l3', dir: 'Lecon_03', type: 'text', title: 'Leçon 03: Mon arrivée en Belgique', duration: '25:00' },
                { id: 'a21_l4', dir: 'Lecon_04', type: 'text', title: 'Leçon 04: Un voyage mémorable', duration: '25:00' },
                { id: 'a21_l5', dir: 'Lecon_05', type: 'quiz', title: 'Leçon 05: Raconter au passé (Consolidation)', duration: '30:00' }
            ]
        },
        {
            id: 's_a21_3',
            title: 'Module 3: Le Passé Récent',
            lessons: [
                { id: 'a21_l6', dir: 'Lecon_06', type: 'text', title: 'Leçon 06: Ce que je viens de faire', duration: '20:00' },
                { id: 'a21_l7', dir: 'Lecon_07', type: 'text', title: 'Leçon 07: Passé récent en contexte', duration: '20:00' }
            ]
        },
        {
            id: 's_a21_4',
            title: 'Module 4: Le Futur Simple',
            lessons: [
                { id: 'a21_l8', dir: 'Lecon_08', type: 'text', title: 'Leçon 08: Mes projets en Belgique', duration: '20:00' },
                { id: 'a21_l9', dir: 'Lecon_09', type: 'text', title: 'Leçon 09: L\'année prochaine', duration: '25:00' },
                { id: 'a21_l10', dir: 'Lecon_10', type: 'text', title: 'Leçon 10: Les temps du futur (Bilan)', duration: '25:00' }
            ]
        },
        {
            id: 's_a21_5',
            title: 'Module 5: Les Pronoms (Je le veux !)',
            lessons: [
                { id: 'a21_l11', dir: 'Lecon_11', type: 'text', title: 'Leçon 11: Ma routine quotidienne', duration: '20:00' },
                { id: 'a21_l12', dir: 'Lecon_12', type: 'text', title: 'Leçon 12: Communiquer au travail (COI)', duration: '25:00' },
                { id: 'a21_l13', dir: 'Lecon_13', type: 'text', title: 'Leçon 13: Chez le médecin (COI Pratique)', duration: '25:00' },
                { id: 'a21_l14', dir: 'Lecon_14', type: 'text', title: 'Leçon 14: Les Doubles Pronoms', duration: '25:00' },
                { id: 'a21_l15', dir: 'Lecon_15', type: 'quiz', title: 'Leçon 15: Consolidation COD & COI', duration: '30:00' }
            ]
        },
        {
            id: 's_a21_6',
            title: 'Module 6: Comparer et Choisir',
            lessons: [
                { id: 'a21_l16', dir: 'Lecon_16', type: 'text', title: 'Leçon 16: Chercher un appartement (Comparatifs)', duration: '25:00' },
                { id: 'a21_l17', dir: 'Lecon_17', type: 'text', title: 'Leçon 17: Les meilleures adresses (Superlatifs)', duration: '25:00' },
                { id: 'a21_l18', dir: 'Lecon_18', type: 'text', title: 'Leçon 18: Celui que je préfère (Démonstratifs)', duration: '25:00' },
                { id: 'a21_l19', dir: 'Lecon_19', type: 'text', title: 'Leçon 19: C\'est le mien ! (Possessifs)', duration: '20:00' },
                { id: 'a21_l20', dir: 'Lecon_20', type: 'quiz', title: 'Leçon 20: Comparer et désigner (Consolidation)', duration: '30:00' }
            ]
        },
        {
            id: 's_a21_7',
            title: 'Module 7: Compétences & Bilan Final',
            lessons: [
                { id: 'a21_l21', dir: 'Lecon_21', type: 'text', title: 'Leçon 21: Révision A2.1', duration: '35:00' },
                { id: 'a21_l22', dir: 'Lecon_22', type: 'quiz', title: 'Leçon 22: Évaluation A2.1', duration: '45:00' },
                { id: 'a21_l23', dir: 'Lecon_23', type: 'writing', title: 'Leçon 23: Expression écrite A2.1', duration: '40:00' },
                { id: 'a21_l24', dir: 'Lecon_24', type: 'listening', title: 'Leçon 24: Compréhension orale A2.1', duration: '30:00' }
            ]
        }
    ]
};

try {
    const rawData = fs.readFileSync(jsonPath, 'utf8');
    const courses = JSON.parse(rawData);

    // Find index of A2.1
    const idx = courses.findIndex(c => c.id === 'a2-1');

    // Enrich the new A2.1 structure with actual content
    newA21.sections.forEach(sec => {
        sec.lessons.forEach(lesson => {
            // Find the directory mapping based on previous logic if needed, 
            // but here we hardcoded the 'dir' property for simplicity in the mapping above.
            // We need to look for folders like 'Lecon_01', 'Lecon_12' etc.

            // Handle directory matching (Lecon_1 vs Lecon_01) - My mapping uses Lecon_01 format
            // But directory on disk might be Lecon_1 for single digits?
            // Let's check: List_dir showed Lecon_13, Lecon_24.
            // I should be careful. My script above used dir.match(/Lecon_(\d+)/).
            // Let's deduce the folder name dynamically.

            // We'll read the directory again to be safe.
            const num = lesson.id.replace('a21_l', '');
            const folderName = fs.readdirSync(a21Dir).find(d => {
                const match = d.match(/Lecon_(\d+)/);
                return match && parseInt(match[1]) === parseInt(num);
            });

            if (folderName) {
                lesson.content = readLesson(folderName);
                lesson.completed = false; // Add default properties
                lesson.vocabulary = [];
                lesson.comments = [];
            } else {
                console.warn(`Could not find folder for lesson ${lesson.id}`);
                lesson.content = "# Content not found";
            }
            // Remove helper property 'dir'
            delete lesson.dir;
        });
    });

    if (idx !== -1) {
        courses[idx] = newA21;
    } else {
        courses.push(newA21);
    }

    fs.writeFileSync(jsonPath, JSON.stringify(courses, null, 2));
    console.log('Successfully updated allCourses.json with full A2.1 curriculum!');

} catch (e) {
    console.error("Error updating JSON:", e);
}
