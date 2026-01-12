const Jimp = require('jimp');
const path = require('path');
const fs = require('fs');

const ARTIFACT_DIR = 'C:/Users/Jacqu/.gemini/antigravity/brain/2cfcf5ac-eb4c-4f7f-a6c1-2b09e74c0449';
const OUTPUT_DIR = 'public/assets/retro';

const FILES = [
    { name: 'door_closed.png', source: 'retro_door_closed_1768161401201.png' },
    { name: 'door_open.png', source: 'retro_door_open_1768161412678.png' },
    { name: 'hero_idle.png', source: 'retro_hero_idle_1768161424955.png' },
    { name: 'chest_closed.png', source: 'retro_chest_closed_1768161530509.png' },
    { name: 'chest_open.png', source: 'retro_chest_open_1768161544391.png' },
    { name: 'tree.png', source: 'retro_tree_1768161558043.png' },
    { name: 'rock.png', source: 'retro_rock_1768161571403.png' },
    { name: 'grass.png', source: 'retro_grass_1768161676531.png' },
    { name: 'signpost.png', source: 'retro_signpost_1768161689132.png' }
];

async function processImages() {
    console.log("Starting transparency processing...");

    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    for (const file of FILES) {
        try {
            const sourcePath = path.join(ARTIFACT_DIR, file.source);
            const destPath = path.join(OUTPUT_DIR, file.name);

            if (!fs.existsSync(sourcePath)) {
                console.error(`Skipping missing source: ${file.source}`);
                continue;
            }

            console.log(`Reading ${file.source}...`);
            const image = await Jimp.read(sourcePath);

            console.log(`Processing...`);
            image.scan(0, 0, image.bitmap.width, image.bitmap.height, function (x, y, idx) {
                const r = this.bitmap.data[idx + 0];
                const g = this.bitmap.data[idx + 1];
                const b = this.bitmap.data[idx + 2];
                // Magenta is roughly R>250, G<10, B>250
                if (r > 240 && g < 40 && b > 240) {
                    this.bitmap.data[idx + 3] = 0; // Alpha = 0
                }
            });

            await image.writeAsync(destPath);
            console.log(`Saved transparent asset to: ${destPath}`);
        } catch (error) {
            console.error(`Failed to process ${file.name}:`, error);
        }
    }
    console.log("Processing complete.");
}

processImages();
