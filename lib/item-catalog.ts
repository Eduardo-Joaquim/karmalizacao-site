import catalog from "@/data/equipment-catalog.json";
const collator=new Intl.Collator("pt-BR",{sensitivity:"variant",numeric:true});
export const alphabeticCatalog=[...catalog].sort((a,b)=>collator.compare(a.name,b.name));
export function normalizeItemSearch(value:string){return value.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLocaleLowerCase("pt-BR").trim();}
export function searchItemCatalog(query:string){const words=normalizeItemSearch(query).split(/\s+/).filter(Boolean);return alphabeticCatalog.filter(i=>words.every(w=>normalizeItemSearch(i.name).includes(w)));}

export function catalogPriceLabel(raw:string){const amount=raw.split(";").at(-1)!.trim();return /\d/.test(amount)?amount.includes("%")?amount:`${amount} m`:"Preço sob consulta";}
