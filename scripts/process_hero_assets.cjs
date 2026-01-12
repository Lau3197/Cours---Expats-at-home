const { Jimp } = require('jimp');
const path = require('path');
const fs = require('fs');

// Helper to get the constructor is just Jimp now
const getJimp = () => Jimp;

const ARTIFACT_DIR = 'C:/Users/Jacqu/.gemini/antigravity/brain/2cfcf5ac-eb4c-4f7f-a6c1-2b09e74c0449';
const OUTPUT_DIR = 'public/assets/retro';

const FILES = [
    { name: 'hero_walk_side.png', source: 'retro_hero_walk_side_1768164258744.png' },
    { name: 'hero_walk_up.png', source: 'retro_hero_walk_up_1768164271889.png' },
    { name: 'hero_walk_down.png', source: 'retro_hero_walk_down_1768164285023.png' }
];

async function processImages() {
    console.log("Starting Hero Walk Assets processing...");

    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    // Manual intToRGBA helper since it was missing in J
    const getRGBA = (hex) => ({
        r: (hex >>> 24) & 0xFF,
        g: (hex >>> 16) & 0xFF,
        b: (hex >>> 8) & 0xFF,
        a: hex & 0xFF
    });

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
            const bgColor = getRGBA(hex);
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
