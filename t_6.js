
function setAmedHeadOffset(){
  const card = document.getElementById('amedCard');
  const head = card?.querySelector('.amed-head');
  if (!head) return;
  card.style.setProperty('--amed-head-h', `${head.offsetHeight}px`);
}
