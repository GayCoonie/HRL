const search=document.getElementById('hrl-file-search');
const kind=document.getElementById('hrl-file-kind');
const rows=[...document.querySelectorAll('[data-hrl-file]')];
const count=document.getElementById('hrl-file-count');
function filter(){const words=search.value.toLowerCase().trim().split(/\s+/).filter(Boolean);let n=0;for(const r of rows){r.hidden=!(kind.value==='all'||r.dataset.kind===kind.value)||!words.every(w=>r.dataset.hrlFile.includes(w));if(!r.hidden)n++;}count.textContent=n+' of '+rows.length+' files';}
search.addEventListener('input',filter);kind.addEventListener('change',filter);
const query=new URLSearchParams(location.search);if(query.has('q'))search.value=query.get('q');if([...kind.options].some(o=>o.value===query.get('type')))kind.value=query.get('type');filter();
