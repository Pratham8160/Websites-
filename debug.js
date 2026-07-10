const fs = require('fs');
const path = require('path');

const transcriptPath = 'C:\\Users\\Pratham\\.gemini\\antigravity\\brain\\6b5031a6-948b-44a9-817f-c8b126700ccd\\.system_generated\\logs\\transcript_full.jsonl';

const raw = fs.readFileSync(transcriptPath, 'utf8');
const firstLine = raw.split('\n')[0];
const obj = JSON.parse(firstLine);
const c = obj.content;

console.log('Content length:', c.length);
console.log('First 200 chars:', JSON.stringify(c.slice(0, 200)));
console.log('indexOf DOCTYPE:', c.indexOf('<!DOCTYPE'));
console.log('indexOf doctype lower:', c.toLowerCase().indexOf('<!doctype'));
// Check if it starts with USER_REQUEST tag
console.log('Starts with:', JSON.stringify(c.slice(0, 30)));
