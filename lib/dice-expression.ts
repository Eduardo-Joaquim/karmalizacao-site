/** Dice expressions share one grammar in combat and public dossiers. */
export function extractDiceExpression(text:string):string|null {
 const match=text.match(/(?<![\w])(\d+d\d+(?:\s*\+\s*\d+(?:d\d+)?)*)(?!\w)/i);
 return match?.[1].replace(/\s+/g,'')??null;
}
export function randomDie(sides:number){
 if(!Number.isSafeInteger(sides)||sides<2||sides>4294967296)throw Error('Número de faces inválido.');
 const limit=Math.floor(4294967296/sides)*sides,a=new Uint32Array(1);
 do{crypto.getRandomValues(a);}while(a[0]>=limit);
 return a[0]%sides+1;
}
export function rollDiceExpression(text:string,critical=false,source=(count:number,sides:number)=>Array.from({length:count},()=>randomDie(sides))){
 const expression=extractDiceExpression(text);if(!expression)return null;
 let bonus=0;const dice:number[]=[],formulas:string[]=[];
 for(const term of expression.split('+')){
  const m=term.match(/^(\d+)d(\d+)$/i);if(!m){bonus+=Number(term);if(!Number.isSafeInteger(bonus))throw Error('Bônus inválido.');continue;}
  const sides=Number(m[2]),requested=Number(m[1]);
  if(!Number.isSafeInteger(sides)||sides<2||sides>4294967296||!Number.isSafeInteger(requested)||requested<1)throw Error('Fórmula de dados inválida.');
  const count=Math.min(30,requested)*(critical?2:1);if(dice.length+count>60)throw Error('Fórmula excede 60 dados.');
  dice.push(...source(count,sides));formulas.push(`${count}d${sides}`);
 }
 return {formula:formulas.join('+')+(bonus?`+${bonus}`:''),dice,total:dice.reduce((a,b)=>a+b,0)+bonus};
}
