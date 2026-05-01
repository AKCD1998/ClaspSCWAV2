
function escJS(s=''){
  return String(s)
    .replace(/\\/g,'\\\\')
    .replace(/'/g,"\\'")
    .replace(/\n/g,'\\n');
}
