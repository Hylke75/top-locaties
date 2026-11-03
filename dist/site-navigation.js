document.addEventListener('DOMContentLoaded',()=>{
  const nav=document.querySelector('.panelnav a[href="#bouwstenen"]');
  if(nav){nav.href='locaties.html';nav.textContent='Zoek locaties ↗';}
  const card=document.querySelector('[data-piece="location"]');
  if(card){card.onclick=()=>{window.location.href='locaties.html'};card.style.cursor='pointer';}
  const panel=document.querySelector('.panelcontent');
  if(panel){const link=document.createElement('a');link.href='locaties.html';link.textContent='ZOEK EEN LOCATIE ↗';link.style.cssText='display:inline-block;font:11px var(--mono);margin:19px 0 0;border-bottom:1px solid #333;padding-bottom:4px';panel.appendChild(link);}
  const feelingLink=document.querySelector('.panelcontent .cta');
  if(feelingLink){feelingLink.href='#gevoel';feelingLink.textContent='KIES OP GEVOEL ↗';}
  const menuLinks=document.querySelector('.panelnav');
  if(menuLinks){const a=document.createElement('a');a.href='#gevoel';a.textContent='Kies op gevoel ↗';menuLinks.insertBefore(a,menuLinks.firstChild);a.onclick=()=>{document.getElementById('panelNav').hidden=true;document.getElementById('panelContent').hidden=false;document.getElementById('menuLabel').textContent='MENU';};}
  const concepts=['festival','diner','ideeen','nacht'];
  const openConcept=()=>{
    const count=document.getElementById('counter');
    const index=Math.max(0,Math.min(3,(parseInt(count?.textContent||'1',10)||1)-1));
    window.location.href='concept.html?concept='+concepts[index];
  };
  const detail=document.getElementById('detail');
  if(detail)detail.onclick=openConcept;
  const picture=document.getElementById('featpic');
  if(picture){picture.style.cursor='pointer';picture.setAttribute('title','Bekijk het volledige eventconcept');picture.onclick=openConcept;}
  const introLink=document.querySelector('.introgrid .roundlink');
  if(introLink)introLink.href='#gevoel';
});
