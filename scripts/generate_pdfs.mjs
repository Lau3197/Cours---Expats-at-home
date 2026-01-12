import fs from 'fs';
import path from 'path';
import { jsPDF } from 'jspdf';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = path.resolve(__dirname, '..');
const CONTENT_DIR = path.join(ROOT_DIR, 'public', '30jours');
const PUBLIC_DIR = path.join(ROOT_DIR, 'public', '30jours');

// Ensure parent directory exists
if (!fs.existsSync(PUBLIC_DIR)) {
    console.log(`Creating ${PUBLIC_DIR}...`);
    fs.mkdirSync(PUBLIC_DIR, { recursive: true });
}

async function generatePDFs() {
    console.log('Starting PDF generation...');

    for (let i = 1; i <= 30; i++) {
        const dayNum = String(i).padStart(2, '0');
        const dayFolder = `day${dayNum}`;

        const contentPath = path.join(CONTENT_DIR, dayFolder, 'content.md');
        const targetDir = path.join(PUBLIC_DIR, dayFolder, 'pdfs');
        const targetFile = path.join(targetDir, `day${dayNum}_guide.pdf`);

        // Ensure target directory exists
        if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
        }

        if (fs.existsSync(contentPath)) {
            const content = fs.readFileSync(contentPath, 'utf-8');

            // Create PDF
            const doc = new jsPDF();

            // Add Title
            doc.setFontSize(20);
            doc.text(`Day ${i} Guide`, 20, 20);

            // Add Content (simplified text wrapping)
            doc.setFontSize(12);
            const splitText = doc.splitTextToSize(content, 170);

            // Simple pagination loop
            let y = 40;
            const pageHeight = doc.internal.pageSize.height;

            for (const line of splitText) {
                if (y > pageHeight - 20) {
                    doc.addPage();
                    y = 20;
                }
                doc.text(line, 20, y);
                y += 7;
            }

            doc.save(targetFile);
            console.log(`✅ Generated: ${targetFile}`);
        } else {
            console.log(`⚠️  Skipping Day ${i}: content.md not found at ${contentPath}`);
        }
    }
    console.log('PDF Generation Complete!');
}

generatePDFs().catch(console.error);
