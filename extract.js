const fs = require('fs');
const path = require('path');

const transcriptPath = 'C:\\Users\\Pratham\\.gemini\\antigravity\\brain\\6b5031a6-948b-44a9-817f-c8b126700ccd\\.system_generated\\logs\\transcript_full.jsonl';
const outDir = 'C:\\Users\\Pratham\\.gemini\\antigravity\\scratch\\patidar-cricket';
const outFile = path.join(outDir, 'index.html');

const raw = fs.readFileSync(transcriptPath, 'utf8');
const firstLine = raw.split('\n')[0];
const obj = JSON.parse(firstLine);
// content is already parsed (JSON.parse handles the \n sequences)
const c = obj.content;

const s = c.indexOf('<!DOCTYPE');
const e = c.lastIndexOf('</html>') + 7;
const html = c.slice(s, e);

console.log('HTML length:', html.length);
console.log('First 100:', html.slice(0, 100));

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(outFile, html, 'utf8');
console.log('Written to:', outFile);
