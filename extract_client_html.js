const fs = require('fs');
const path = require('path');
const sourceFile = 'C:\\Users\\Pratham\\.gemini\\antigravity\\brain\\6b5031a6-948b-44a9-817f-c8b126700ccd\\.system_generated\\steps\\252\\content.md';
const destFile = 'C:\\Users\\Pratham\\...gemini\\antigravity\\scratch\\patidar-cricket\\index_client.html'; // Wait, let's use absolute path explicitly

// Let's resolve target directory
const targetDir = 'C:\\Users\\Pratham\\.gemini\\antigravity\\scratch\\patidar-cricket';
const targetFile = path.join(targetDir, 'index_client.html');

try {
  const content = fs.readFileSync(sourceFile, 'utf8');
  const lines = content.split('\n');
  const startIndex = lines.findIndex(line => line.trim().startsWith('<!DOCTYPE html>'));
  if (startIndex !== -1) {
    const htmlContent = lines.slice(startIndex).join('\n');
    fs.writeFileSync(targetFile, htmlContent, 'utf8');
    console.log('Success! Saved client HTML to ' + targetFile);
  } else {
    console.error('Could not find <!DOCTYPE html> in content.md');
  }
} catch (e) {
  console.error('Error:', e);
}
