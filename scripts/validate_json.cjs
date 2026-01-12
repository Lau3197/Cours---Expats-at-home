const fs = require('fs');
try {
    const data = fs.readFileSync('./data/allCourses.json', 'utf8');
    const json = JSON.parse(data);
    console.log("JSON is valid.");
    console.log("Course count:", json.length);
    const b1Global = json.find(c => c.id === 'b1-global');
    if (b1Global) {
        console.log("Found b1-global:", b1Global.title);
    } else {
        console.log("b1-global NOT FOUND");
    }
} catch (e) {
    console.error("JSON Error:", e.message);
}
