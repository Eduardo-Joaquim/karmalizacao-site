export const REJECTION_NAMES=["Dentro do limiar","Enjoo químico","Expurgo violento","Inversão tóxica","Colapso tóxico"] as const;
export function alchemyState(constitution:number,current=0){
 const tolerance=2+Math.ceil(Math.max(0,constitution)/2);
 const saturation=Number.isFinite(current)?Math.max(0,Math.floor(current)):0;
 const excess=Math.max(0,saturation-tolerance);
 const severity=Math.min(4,excess);
 return {tolerance,current:saturation,excess,severity,label:REJECTION_NAMES[severity],dc:excess?14+saturation:null};
}
