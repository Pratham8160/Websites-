const fs = require('fs');
const outDir = 'C:\\Users\\Pratham\\.gemini\\antigravity\\scratch\\patidar-cricket';
const transcriptPath = 'C:\\Users\\Pratham\\.gemini\\antigravity\\brain\\6b5031a6-948b-44a9-817f-c8b126700ccd\\.system_generated\\logs\\transcript_full.jsonl';

const raw = fs.readFileSync(transcriptPath, 'utf8');
const firstLine = raw.split('\n')[0];
const obj = JSON.parse(firstLine);
const c = obj.content;

// Check end of content
console.log('Last 100 chars:', JSON.stringify(c.slice(-100)));
console.log('Has </html>:', c.includes('</html>'));
console.log('lastIndexOf </html>:', c.lastIndexOf('</html>'));

// The HTML might be URL-encoded or use escaped tags
// Let's see what closing tags look like
const bodyClose = c.lastIndexOf('</body>');
const htmlClose = c.lastIndexOf('</html>');
console.log('lastIndexOf </body>:', bodyClose);
console.log('lastIndexOf </html>:', htmlClose);

// Extract manually - from DOCTYPE to end of content (trim USER_REQUEST wrapper)
const s = c.indexOf('<!DOCTYPE');
// Find </USER_REQUEST> end marker
const ureEnd = c.lastIndexOf('</USER_REQUEST>');
console.log('USER_REQUEST end:', ureEnd);

const html = ureEnd > 0 ? c.slice(s, ureEnd) : c.slice(s);
console.log('Extracted HTML length:', html.length);
console.log('Last 50 of html:', JSON.stringify(html.slice(-50)));

// Write - unescape the double-JSON encoding
// The content has escaped quotes like \\" that need to become "
const unescaped = html
  .replace(/\\"/g, '"')
  .replace(/\\\\/g, '\\');

fs.writeFileSync(outDir + '\\index.html', unescaped, 'utf8');
console.log('Written!');
