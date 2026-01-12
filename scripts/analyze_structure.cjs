
const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '../data/allCourses.json');

try {
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    console.log('Courses found:', data.length);

    data.forEach(course => {
        console.log(`\nCourse: ${course.id} - ${course.title}`);
        console.log(`sections: ${course.sections ? course.sections.length : 0}`);
        if (course.sections) {
            course.sections.forEach(sec => {
                console.log(`  Section: ${sec.id} - ${sec.title}`);
                console.log(`    Lessons: ${sec.lessons ? sec.lessons.length : 0}`);
                if (sec.lessons && sec.lessons.length > 0) {
                    console.log(`      IDs: ${sec.lessons.map(l => l.id).join(', ')}`);
                }
            });
        }
    });

} catch (err) {
    console.error('Error:', err);
}
