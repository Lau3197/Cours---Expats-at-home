
import fs from 'fs';
import path from 'path';

const l07Path = 'c:/Users/Jacqu/OneDrive/Projects/extracted_french_mastery/Niveau_A1/A1.1/02_Module_2_My_first_sentences/L07_Going_places.md';
const content = fs.readFileSync(l07Path, 'utf-8');

function extractGrammarSummary(content: string) {
    // Regex from courseLoader.ts
    const headerRegex = /##\s*(?:📖\s*)?(?:Grammar|Grammaire)[:\s]*(?:Summary|Synthesis|Synthèse|Récapitulatif)/i;
    const match = content.match(headerRegex);
    if (!match) {
        console.log("No match found!");
        return [];
    }
    console.log("Match found:", match[0]);

    const startIndex = match.index! + match[0].length;
    const contentAfterStart = content.substring(startIndex);

    const nextHeaderMatch = contentAfterStart.match(/\n##\s+/);
    const endIndex = nextHeaderMatch ? nextHeaderMatch.index : contentAfterStart.length;

    const summaryContent = contentAfterStart.substring(0, endIndex).trim();

    console.log("Extracted Content Length:", summaryContent.length);
    console.log("Snippet:", summaryContent.substring(0, 50));

    return [{
        id: 'grammar-summary',
        name: 'Grammar Summary',
        content: summaryContent
    }];
}

const resources = extractGrammarSummary(content);
console.log("Resources:", JSON.stringify(resources, null, 2));
