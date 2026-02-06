const fs = require('fs');

const lessonPath = "c:\\Users\\Jacqu\\OneDrive\\Projects\\extracted_french_mastery\\Niveau_A2\\A2.1\\01_Module_1_C_était_comment_avant\\01_Leçon_01_Souvenirs_d_enfance.md";

try {
    const content = fs.readFileSync(lessonPath, 'utf8');

    console.log("File read successfully. Length:", content.length);
    console.log("Checking for '## Vocabulaire' section...");

    // New Robust Logic - Line Scanning
    const vocabHeaderRegex = /##\s*Vocabulaire/i;
    const match = content.match(vocabHeaderRegex);

    if (!match) {
        console.log("❌ No vocabulary section found!");
    } else {
        console.log("✅ Header found at index:", match.index);

        // Get content starting AFTER "## Vocabulaire"
        const afterHeader = content.substring(match.index + match[0].length);
        const lines = afterHeader.split(/\r?\n/);
        const vocabulary = [];

        console.log("Scanning lines...");
        let rowCount = 0;

        for (const line of lines) {
            const trimmed = line.trim();
            // Skip empty lines at the start (or between rows)
            if (!trimmed) continue;

            // If we encounter a new header, stop
            if (trimmed.startsWith('#')) {
                console.log("  -> Found new section (stopping):", trimmed);
                break;
            }

            // Must start with pipe to be a table row
            if (!trimmed.startsWith('|')) {
                console.log("  -> Line does not start with pipe, ignoring:", trimmed);
                continue;
            }

            // Skip divider rows like |---|---|
            if (trimmed.match(/^\|?\s*[-:]+\s*\|/)) {
                console.log("  -> Separator row, skipping");
                continue;
            }
            // Skip header row
            if (trimmed.match(/^\|?\s*Mot\s*\|/i)) {
                console.log("  -> Header row, skipping");
                continue;
            }

            // Process valid row
            // Split by pipe and remove empty first/last elements from "| cell |"
            const cells = trimmed.split('|').map(c => c.trim()).filter(c => c !== '');

            if (cells.length >= 2) {
                // console.log("  -> Row mapped:", cells);
                vocabulary.push({
                    fr: cells[0],
                    en: cells[1],
                    example: cells[2] || undefined
                });
                rowCount++;
            }
        }

        console.log("Final Vocabulary Array (" + rowCount + " items):");
        console.log(JSON.stringify(vocabulary, null, 2));
    }

} catch (e) {
    console.error("Error:", e);
}
