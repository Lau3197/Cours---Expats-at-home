
const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '../data/allCourses.json');
const rootPath = path.join(__dirname, '../');

function readLessonContent(relativePath) {
    try {
        return fs.readFileSync(path.join(rootPath, relativePath), 'utf8');
    } catch (e) {
        console.error(`Error reading ${relativePath}:`, e);
        return "Content not found.";
    }
}

try {
    const courses = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    console.log('Loaded courses. Total:', courses.length);

    // --- A1.1 Updates ---
    const a1_1 = courses.find(c => c.id === 'a1-1');
    if (a1_1) {
        console.log('Updating A1.1...');
        // Create new section if not exists
        let sec5 = a1_1.sections.find(s => s.id === 'section-5');
        if (!sec5) {
            sec5 = {
                id: 'section-5',
                title: 'Module 5 : Compétences & Bilan',
                lessons: []
            };
            a1_1.sections.push(sec5);
        }

        // Add L16
        sec5.lessons.push({
            id: 'l16',
            title: 'Leçon 16 : Expression écrite A1.1',
            content: readLessonContent('Niveau_A1/A1.1/Lecon_16/Lecon_16_Expression_ecrite_A1.1.md'),
            duration: '02:00',
            type: 'writing',
            completed: false
        });

        // Add L17
        sec5.lessons.push({
            id: 'l17',
            title: 'Leçon 17 : Compréhension orale A1.1',
            content: readLessonContent('Niveau_A1/A1.1/Lecon_17/Lecon_17_Comprehension_orale_A1.1.md'),
            duration: '02:00',
            type: 'listening',
            completed: false
        });
    }

    // --- A1.2 Updates ---
    const a1_2 = courses.find(c => c.id === 'a1-2');
    if (a1_2) {
        console.log('Updating A1.2...');
        // Check if section 4 exists (it should), add section 5
        let sec5 = a1_2.sections.find(s => s.id === 'section-5');
        if (!sec5) {
            sec5 = {
                id: 'section-5',
                title: 'Module 5 : Compétences & Bilan',
                lessons: []
            };
            a1_2.sections.push(sec5);
        }

        // Add L17
        sec5.lessons.push({
            id: 'l17',
            title: 'Leçon 17 : Expression écrite A1.2',
            content: readLessonContent('Niveau_A1/A1.2/Lecon_17/Lecon_17_Expression_ecrite_A1.2.md'),
            duration: '02:30',
            type: 'writing',
            completed: false
        });

        // Add L18
        sec5.lessons.push({
            id: 'l18',
            title: 'Leçon 18 : Compréhension orale A1.2',
            content: readLessonContent('Niveau_A1/A1.2/Lecon_18/Lecon_18_Comprehension_orale_A1.2.md'),
            duration: '02:30',
            type: 'listening',
            completed: false
        });
    }

    // --- A2.1 Updates ---
    const a2_1 = courses.find(c => c.id === 'a2-1');
    if (a2_1) {
        console.log('Updating A2.1...');
        // Only has 2 sections. Usually skills come at the end.
        // We'll add a new section for skills.
        let secSkills = a2_1.sections.find(s => s.id === 'section-skills');
        if (!secSkills) {
            secSkills = {
                id: 'section-skills',
                title: 'Module Compétences',
                lessons: []
            };
            a2_1.sections.push(secSkills);
        }

        // Add L21
        secSkills.lessons.push({
            id: 'l21',
            title: 'Leçon 21 : Expression écrite A2.1',
            content: readLessonContent('Niveau_A2/A2.1/Lecon_21/Lecon_21_Expression_ecrite_A2.1.md'),
            duration: '02:30',
            type: 'writing',
            completed: false
        });

        // Add L22
        secSkills.lessons.push({
            id: 'l22',
            title: 'Leçon 22 : Compréhension orale A2.1',
            content: readLessonContent('Niveau_A2/A2.1/Lecon_22/Lecon_22_Comprehension_orale_A2.1.md'),
            duration: '02:30',
            type: 'listening',
            completed: false
        });
    }

    // --- Module Global A1 ---
    console.log('Creating Module Global A1...');
    const globalA1 = {
        id: 'a1-global',
        title: 'Module Global A1 : Préparation DELF',
        level: 'A1',
        description: 'A comprehensive review of the A1 level with focused preparation for the DELF A1 exam. Includes writing workshops, listening practice, and a full mock exam.',
        sections: [
            {
                id: 'section-1',
                title: 'Préparation & Examen Blanc',
                lessons: [
                    {
                        id: 'l19',
                        title: 'Leçon 19 : Expression écrite Globale A1',
                        content: readLessonContent('Niveau_A1/Module_Global_A1/Lecon_19/Lecon_19_Expression_ecrite_Globale_A1.md'),
                        duration: '03:00',
                        type: 'writing',
                        completed: false
                    },
                    {
                        id: 'l20',
                        title: 'Leçon 20 : Compréhension orale Globale A1',
                        content: readLessonContent('Niveau_A1/Module_Global_A1/Lecon_20/Lecon_20_Comprehension_orale_Globale_A1.md'),
                        duration: '03:00',
                        type: 'listening',
                        completed: false
                    },
                    {
                        id: 'l21',
                        title: 'Leçon 21 : Examen Final A1 (Simulation DELF)',
                        content: readLessonContent('Niveau_A1/Module_Global_A1/Lecon_21/Lecon_21_Examen_Final_A1.md'),
                        duration: '04:00',
                        type: 'exam',
                        completed: false
                    }
                ]
            }
        ]
    };

    // Insert Global A1 after A1.2
    const a1_2_index = courses.findIndex(c => c.id === 'a1-2');
    if (a1_2_index !== -1) {
        courses.splice(a1_2_index + 1, 0, globalA1);
    } else {
        courses.push(globalA1);
    }

    fs.writeFileSync(dataPath, JSON.stringify(courses, null, 2), 'utf8');
    console.log('Successfully updated allCourses.json!');

} catch (err) {
    console.error('Error:', err);
}
