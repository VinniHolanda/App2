const fs = require('fs');
const path = require('path');

const replacements = {
  '#0c0c0e': '#080b11',
  '#121215': '#0f172a',
  '#141417': '#0f172a',
  '#17171b': '#0f172a',
  '#1e1e23': '#0f172a',
  '#232329': '#1e293b',
  '#2a2a31': '#1e293b',
  '#2e2e38': '#1e293b',
  '#6a6a73': '#64748b',
  '#9a9aa3': '#94a3b8',
  '#ededee': '#f1f5f9',
  '#14160a': '#080b11'
};

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk('./src');
let changed = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;
  
  for (const [oldColor, newColor] of Object.entries(replacements)) {
    const regex = new RegExp(oldColor, 'gi');
    content = content.replace(regex, newColor);
  }
  
  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    changed++;
  }
});

console.log(`Replaced colors in ${changed} files.`);
