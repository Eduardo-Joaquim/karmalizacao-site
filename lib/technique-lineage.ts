export const LINEAGE_CATALYSTS:Record<string,string>={
 Humano:'Gaste 1 Ímpeto para acrescentar um dado-base ou economizar 1 Karma.',
 Elfo:'Em Harmonia, acrescente 3 m de alcance ou ignore cobertura parcial.',
 Anão:'Descarregue Cargas de Bigorna para firmar a técnica ou quebrar a guarda.',
 'Demi-humano':'Adapte o efeito secundário ao Aspecto Bestial ativo.',
 Vampiro:'Gaste Vitae para converter em cura a parcela prevista pela Reserva de Vitae.',
 Demônio:'Aplique ou resolva o Selo de Coação no alvo atingido.',
 Ghoul:'Em Caça, use a Regeneração Voraz se o alvo e o resultado cumprirem seu gatilho.',
 'Tritão':'Deslize ou empurre o alvo atingido 2 m com o Pulso de Maré.',
 Abissal:'Meça alcance e trajetória a partir da Âncora do Vazio.'
};
const families={
 marcial:['Impacto','Manobra','Quebra de guarda'],
 conjuracao:['Alcance','Área','Sustentação'],
 furtiva:['Precisão','Ocultação','Alvo isolado'],
 guarda:['Bloqueio','Proteção aliada','Provocação'],
 amparo:['Cura','Purificação','Amparo'],
 oficio:['Dispositivo','Preparação','Área'],
 comando:['Coordenação','Alcance','Sustentação']
};
const classes:Record<string,keyof typeof families>={
 Mercenário:'marcial',Pugilista:'marcial',Duelista:'marcial',Tanque:'guarda',Ranger:'furtiva',Ladrão:'furtiva',Assassino:'furtiva',Samaritano:'amparo',Curandeiro:'amparo',Alquimista:'oficio',Inventor:'oficio',Bardo:'comando',Ocultista:'conjuracao',Especialista:'oficio',Invocador:'comando',Elementalista:'conjuracao',Conjurador:'conjuracao'
};
export function doctrineOptions(className:string){return families[classes[className]]??[];}
export function doctrineDiscount(className:string,component:string,extras:number){return extras>=1&&doctrineOptions(className).includes(component)?1:0;}
