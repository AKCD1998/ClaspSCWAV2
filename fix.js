const fs = require('fs');

// Fix index.html
let html = fs.readFileSync('index.html', 'utf8');
// Fix the messy replacement
html = html.replace(/<!-- <div id="screen-report1011"[\s\S]*?<\/div> --> <!-- SCREEN: RX1011 -->[\s\S]*?<div id="screen-rx1011"[\s\S]*?<\/div>/, '');
html = html.replace(/<div id="screen-report1011"[\s\S]*?<\/div>\s*<!-- SCREEN: RX1011 -->\s*<div id="screen-rx1011"[\s\S]*?<\/div>/, '');
html = html.replace(/'#screen-report1011', '#screen-rx1011', '#screen-followup',/, `'#screen-followup',`);

fs.writeFileSync('index.html', html, 'utf8');

// Fix scripts.html
let js = fs.readFileSync('scripts.html', 'utf8');

const regexFunc = /function goReport1011\([\s\S]*?function openRx1011\([\s\S]*?\}\s*\)\)\s*\.catch\(\(\) => alert\('โหลด Rx1011 ไม่สำเร็จ'\)\);\s*\}/;
const newFuncs = `function goReport1011(e){
  e?.preventDefault?.();
  window.open('https://akcd1998.github.io/RepWeb1011/#/', '_blank');
}

function openRx1011(e){
  e?.preventDefault?.();
  window.open('https://akcd1998.github.io/RepWeb1011/#/', '_blank');
}`;

js = js.replace(regexFunc, newFuncs);
js = js.replace(/,'screen-report1011','screen-rx1011'/, '');

fs.writeFileSync('scripts.html', js, 'utf8');
