const fs = require('fs');
const path = require('path');

function readText(relativePath) {
  return fs.readFileSync(path.join(__dirname, relativePath), 'utf8');
}

function expandIncludes(html) {
  let previous;
  do {
    previous = html;
    html = html
      .replace(/<\?!=\s*includeRaw\('([A-Za-z0-9_-]+)'\);\s*\?>/g, (_, name) => readText(`${name}.html`))
      .replace(/<\?!=\s*include\('([A-Za-z0-9_-]+)'\);\s*\?>/g, (_, name) => readText(`${name}.html`));
  } while (html !== previous);
  return html;
}

const html = expandIncludes(readText('index.html'))
  .replace(/<\?= SUPABASE_URL \?>/g, 'https://example.supabase.co')
  .replace(/<\?= SUPABASE_KEY \?>/g, 'local-preview-anon-key')
  .replace(/<\?= devTest \?>/g, 'false');

const matches = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)];
let allGood = true;
matches.forEach((m, i) => {
  const js = m[1];
  if (!js.trim()) return;
  try {
    new Function(js);
  } catch(e) {
    const line = html.slice(0, m.index).split(/\r?\n/).length;
    console.log(`Error in script block ${i + 1} starting at rendered HTML line ${line}: ${e.message}`);
    console.log(e.stack);
    allGood = false;
  }
});
if (allGood) console.log("All scripts passed syntax check.");
