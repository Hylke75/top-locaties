document.addEventListener('DOMContentLoaded',()=>{
  const concepts=[
    {id:'festival',name:'Het festival van morgen',moods:['energie','verwondering','verbinding'],why:'Een levendige mix van verhalen, ontdekkingen en onverwachte ontmoetingen.'},
    {id:'diner',name:'Het diner dat verbindt',moods:['verbinding','trots','rust'],why:'Een intieme beleving waarin aandacht, verhalen en bijzondere gesprekken samenkomen.'},
    {id:'ideeen',name:'De dag vol nieuwe ideeën',moods:['focus','energie','verbinding'],why:'Een frisse impuls voor teams die samen willen ontdekken en iets in beweging zetten.'},
    {id:'nacht',name:'Nacht van verwondering',moods:['verwondering','energie','trots'],why:'Een wereld van licht, performance en bijzondere momenten die gasten bijblijven.'}
  ];
  const moods=[
    {id:'energie',title:'Energie',sub:'Met nieuwe zin naar huis.',color:'#f45269'},
    {id:'verbinding',title:'Verbinding',sub:'Echt iets met elkaar delen.',color:'#2746b8'},
    {id:'verwondering',title:'Verwondering',sub:'Even niet weten wat je ziet.',color:'#d49e50'},
    {id:'rust',title:'Rust',sub:'Ruimte om echt stil te staan.',color:'#94ac9e'},
    {id:'focus',title:'Focus',sub:'Met een helder idee verder.',color:'#4c6b85'},
    {id:'trots',title:'Trots',sub:'Samen iets bijzonders vieren.',color:'#bb8d9b'}
  ];
  if(location.pathname.endsWith('concept.html')){
    const key=new URLSearchParams(location.search).get('concept')||'festival';
    const item=concepts.find(c=>c.id===key)||concepts[0];
    const title=document.getElementById('heroTitle');
    if(title){title.style.fontSize='clamp(37px,5.1vw,84px)';title.style.overflowWrap='anywhere';}
    const node=document.createElement('div');node.className='feeling-signature';
    node.innerHTML=`<div class="intro">DIT CONCEPT GEEFT JE GASTEN</div><div class="mood-tags">${item.moods.map(m=>`<span>${m.toUpperCase()}</span>`).join('')}</div><a href="hupr.html#gevoel">KIES OP GEVOEL ↗</a>`;
    document.querySelector('.hero')?.after(node);
    return;
  }
  const target=document.getElementById('concepten');if(!target)return;
  const wrap=document.createElement('section');wrap.className='feeling-section';wrap.id='gevoel';
  wrap.innerHTML=`<div class="feeling-overline"><span>02 / HET GEVOELENSKOMPAS</span><span>GEEN BRANCHE. GEEN LOCATIE. EERST GEVOEL.</span></div><div class="feeling-head"><h2>HOE MOET HET<br><span>VOELEN?</span></h2><p>Stel je voor: je gasten lopen de deur uit. Wat wil je dat ze voelen? Kies maximaal twee gevoelens. Wij laten zien welke eventconcepten daarbij passen.</p></div><div class="feeling-eyebrow">KIES ÉÉN OF TWEE GEVOELENS ↓</div><div class="feeling-grid" id="feelingGrid"></div><div class="feeling-results" id="feelingResults"><div class="feeling-results-top"><h3 id="feelingHeading">VERRASSENDE IDEEËN.</h3><button id="clearFeelings" class="feeling-clear" hidden>OPNIEUW KIEZEN ↗</button></div><div class="feeling-matches" id="feelingMatches"></div><p class="feeling-foot">Deze suggesties zijn redactioneel gekoppeld aan de gewenste beleving. Op de conceptpagina ontdek je het programma, de aanbevolen locaties en leveranciers.</p></div>`;
  target.before(wrap);
  const grid=document.getElementById('feelingGrid');const results=document.getElementById('feelingMatches');let selected=[];
  grid.innerHTML=moods.map((m,i)=>`<button type="button" class="feeling-choice" data-mood="${m.id}" style="--mood-color:${m.color}" aria-pressed="false"><span class="top">${String(i+1).padStart(2,'0')} / GEVOEL <span class="check">+</span></span><span><strong>${m.title}</strong><span class="sub">${m.sub}</span></span></button>`).join('');
  const clear=document.getElementById('clearFeelings');
  function paint(){
    grid.querySelectorAll('button').forEach(b=>{const on=selected.includes(b.dataset.mood);b.setAttribute('aria-pressed',on?'true':'false');b.querySelector('.check').textContent=on?'✓':'+'});
    clear.hidden=!selected.length;
    document.getElementById('feelingHeading').textContent=selected.length?'DIT PAST BIJ JOU.':'VERRASSENDE IDEEËN.';
    const ranked=concepts.map((c,i)=>({...c,score:selected.reduce((n,m)=>n+(c.moods.includes(m)?1:0),0),index:i})).sort((a,b)=>b.score-a.score||a.index-b.index).slice(0,3);
    results.innerHTML=ranked.map((c,i)=>{
      const hits=selected.filter(m=>c.moods.includes(m)).map(m=>moods.find(x=>x.id===m)?.title.toLowerCase());
      const why=hits.length?`Past bij ${hits.join(' en ')}. ${c.why}`:c.why;
      return `<a class="feeling-match" href="concept.html?concept=${c.id}"><div class="rank">${String(i+1).padStart(2,'0')} / ${i===0?'ONZE MATCH':'NOG EEN MOGELIJKHEID'}</div><div class="name">${c.name}</div><p class="reason">${why}</p><div class="link"><span>BEKIJK HET VOLLEDIGE CONCEPT</span><span>↗</span></div></a>`;
    }).join('');
  }
  grid.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{const id=b.dataset.mood;if(selected.includes(id))selected=selected.filter(x=>x!==id);else{if(selected.length===2)selected.shift();selected.push(id)}paint()}));
  clear.onclick=()=>{selected=[];paint()};paint();
});
