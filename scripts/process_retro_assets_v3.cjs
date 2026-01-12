const { Jimp } = require('jimp');
console.log('Using Jimp class');
if (Jimp && !Jimp.read) {
    console.error('Jimp.read is missing! Jimp static methods:', Object.getOwnPropertyNames(Jimp));
    console.error('Jimp prototype methods:', Object.getOwnPropertyNames(Jimp.prototype));
}

// Helper to get the constructor is just Jimp now
const getJimp = () => Jimp;
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
    console.log("Starting FINAL transparency processing (v3)...");

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

            const J = getJimp();
            const image = await J.read(sourcePath);

            // Sample top-left pixel for background color
            const hex = image.getPixelColor(0, 0);
            const bgColor = {
                r: (hex >>> 24) & 0xFF,
                g: (hex >>> 16) & 0xFF,
                b: (hex >>> 8) & 0xFF,
                a: hex & 0xFF
            };
            console.log(`Processing ${file.name} (BG Color: R${bgColor.r} G${bgColor.g} B${bgColor.b})...`);

            image.scan(0, 0, image.bitmap.width, image.bitmap.height, function (x, y, idx) {
                const r = this.bitmap.data[idx + 0];
                const g = this.bitmap.data[idx + 1];
                const b = this.bitmap.data[idx + 2];

                // Check distance to background color with tolerance
                if (
                    Math.abs(r - bgColor.r) < 20 &&
                    Math.abs(g - bgColor.g) < 20 &&
                    Math.abs(b - bgColor.b) < 20
                ) {
                    this.bitmap.data[idx + 3] = 0; // Transparent
                }
            });

            const buffer = await image.getBuffer("image/png");
            fs.writeFileSync(destPath, buffer);
            console.log(`Saved transparent asset to: ${destPath}`);
        } catch (error) {
            console.error(`Failed to process ${file.name}:`, error);
        }
    }
    console.log("Processing complete.");
}

processImages();
