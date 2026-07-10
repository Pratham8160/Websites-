const fs = require('fs');
const transcriptPath = 'C:\\Users\\Pratham\\.gemini\\antigravity\\brain\\6b5031a6-948b-44a9-817f-c8b126700ccd\\.system_generated\\logs\\transcript_full.jsonl';

const raw = fs.readFileSync(transcriptPath, 'utf8');
const firstLine = raw.split('\n')[0];
const obj = JSON.parse(firstLine);
const c = obj.content;

// Search for patterns
console.log('Length:', c.length);
console.log('Has <html>:', c.includes('<html'));
console.log('Has &lt;html:', c.includes('&lt;html'));
console.log('Char at 14:', JSON.stringify(c.slice(14, 30)));
console.log('Char at 0-50:', JSON.stringify(c.slice(0, 50)));

// The content might have literal \n chars since it's double JSON encoded
// Let's look at raw content around DOCTYPE
const idx = c.indexOf('DOCTYPE');
console.log('around DOCTYPE:', JSON.stringify(c.slice(Math.max(0, idx-5), idx+20)));
