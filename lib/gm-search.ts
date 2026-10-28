import data from '@/data/rules.json';
const normalize=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR');
export function searchRules(query:string){const words=normalize(query).trim().split(/\s+/).filter(Boolean);if(!words.length)return [];return data.chapters.flatMap(c=>c.sections.filter(s=>words.every(w=>normalize(`${s.title} ${s.searchableText}`).includes(w))).map(s=>({chapterSlug:c.slug,id:s.id,heading:`${c.shortTitle} · ${s.title}`,text:s.searchableText}))).slice(0,30);}
