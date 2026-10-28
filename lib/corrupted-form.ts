import type { CharacterPayload } from "@/lib/character-data";
import mutations from "@/data/corrupted-mutations.json";
export function corruptedFormState(draft:CharacterPayload,control:number){
 const c=draft.corruption;const stage=["Etapa I","Etapa II","Etapa III","Etapa IV","Etapa V","Etapa VI","Etapa VII"].indexOf(draft.stage)+1;
 const slots=stage<3?0:stage===3?1:stage<6||control<2?2:3;
 const selected=[...new Set(c.formTraits??[])];const issues:string[]=[];
 if(!c.enabled)issues.push("A Marca não está ativa.");
 if(stage<3||control<1)issues.push("Mutações exigem Etapa III e Controle da Corrupção 1.");
 if(c.charge<7||c.charge>9)issues.push("Mutações exigem 7 a 9 Cargas efetivas.");
 if(c.formBlocked)issues.push("Forma bloqueada pela Ruptura até descanso longo seguro.");
 if(selected.length>slots)issues.push(`Escolhas excedem os ${slots} espaços de mutação.`);
 if(selected.some(id=>!mutations.some(m=>m.id===id)))issues.push("Há uma mutação não reconhecida.");
 if(selected.includes("expansao")&&!selected.includes("membros"))issues.push("Expansão predatória exige Membros predatórios.");
 const active=Boolean(c.formActive&&selected.length&&issues.length===0);
 return {stage,slots,selected,issues,active,armorBonus:active&&selected.includes("carapaca")?1:0,movementBonus:active&&selected.includes("aceleracao")?2:0,controlDC:14+c.charge,
  grafts:c.charge>=4&&c.charge<=9?(c.formBlocked?1:c.charge>=7?2**(c.charge-6):1):0,
  graftRange:c.formBlocked?5:c.charge>=7&&c.charge<=9?15:5};
}
