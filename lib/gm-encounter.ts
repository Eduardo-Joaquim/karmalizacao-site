import {z} from 'zod';
import type {NpcTemplate} from '@/lib/combat-catalog';
import type {BossPhaseState} from '@/lib/boss-phase-state';
import type {CharacterPayload} from '@/lib/character-data';
export type EncounterParticipant=BossPhaseState & {key:string;team:'Aliados'|'Inimigos';initiative:number;link?:{id:string;token:string};payload?:CharacterPayload;npc?:NpcTemplate;life:number;karma:number;shield:number;conditions:string[];reactions:number;domainRounds:Record<string,number>};
const bounded=z.number().int().min(0).max(99999),short=z.string().max(160),long=z.string().max(50000);
const phase=z.object({id:short,title:short,description:long,life:bounded.optional(),percent:z.number().min(0).max(100).optional(),anchors:bounded.optional(),ca:bounded.optional(),resistance:bounded.optional(),defense:long.optional(),unlocks:z.array(short).max(40),order:bounded,karmaCost:bounded.optional(),pcCost:bounded.optional(),controlDC:bounded.optional(),attributeBonus:z.array(z.object({index:z.number().int().min(0).max(5),value:z.number().int().min(-20).max(20)})).max(6).optional()});
export const npcTemplateSchema=z.object({id:short.min(1),name:short.min(1),stage:short,source:short,life:bounded,karma:bounded,ca:bounded,movement:short,attributes:z.array(z.number().int().min(0).max(50)).length(6),skills:long,traits:long,reactions:z.number().int().min(0).max(10),resistance:bounded,phase:bounded.optional(),phases:z.array(phase).max(12).optional(),pc:bounded.optional(),arts:z.array(z.object({id:short,name:short,cost:bounded.nullable(),text:long,calculation:long,roll:short,damage:short,attack:z.boolean(),action:short,domain:short.optional()})).max(100)});
const participant=z.object({key:short.min(1),team:z.enum(['Aliados','Inimigos']),initiative:z.number().int().min(-99999).max(99999),npc:npcTemplateSchema,life:bounded,karma:bounded,shield:bounded,conditions:z.array(z.string().max(80)).max(20),reactions:z.number().int().min(0).max(10),domainRounds:z.record(z.number().int().min(0).max(99)),seenPhases:z.array(short).max(20).optional(),appliedPhases:z.array(short).max(20).optional(),anchors:bounded.optional(),pc:bounded.optional(),phaseLabel:short.optional(),phaseDefense:long.optional(),phaseUnlocks:z.array(short).max(100).optional(),conditionalResistance:bounded.optional()});
const playerRef=z.object({id:short,name:short,team:z.enum(['Aliados','Inimigos']),initiative:z.number().int().min(-99999).max(99999)});
const encounter=z.object({version:z.literal(1),round:z.number().int().min(1).max(99999),turn:short,participants:z.array(participant).max(60),players:z.array(playerRef).max(60)}).strict();
export const FORGE_LIBRARY_KEY='karmalizacao:gm-forge-library:v1';
export function parseForgeLibrary(value:unknown):NpcTemplate[]{const rows=z.array(npcTemplateSchema).max(30).parse(value);if(new Set(rows.map(n=>n.id)).size!==rows.length)throw Error('Identificadores repetidos na biblioteca.');return rows;}
export function addToForgeLibrary(old:unknown,npc:NpcTemplate){const rows=parseForgeLibrary(old),validated=npcTemplateSchema.parse(npc);if(rows.length>=30)throw Error('Biblioteca cheia: remova uma criatura para salvar outra.');return [...rows,validated];}
export type EncounterPlayerRef=z.infer<typeof playerRef>;
export function exportEncounter(participants:EncounterParticipant[],round:number,turn:string,pendingPlayers:EncounterPlayerRef[]=[]){
 return encounter.parse({version:1,round,turn,participants:participants.filter(p=>p.npc&&!p.link).map(({payload,link,...p})=>p),players:[...pendingPlayers.filter(r=>!participants.some(p=>p.link?.id===r.id)),...participants.filter(p=>p.link&&p.payload).map(p=>({id:p.link!.id,name:p.payload!.name,team:p.team,initiative:p.initiative}))]});
}
export function importEncounter(text:string){
 if(new TextEncoder().encode(text).byteLength>5_000_000)throw Error('Encontro excede 5 MB.');
 const data=encounter.parse(JSON.parse(text));
 if(data.participants.length+data.players.length>60)throw Error('O encontro excede 60 participantes.');
 if(new Set(data.participants.map(p=>p.key)).size!==data.participants.length)throw Error('Há identificadores de participantes repetidos.');
 for(const p of data.participants){if(p.life>p.npc.life||p.karma>p.npc.karma||p.reactions>p.npc.reactions)throw Error('Recursos do NPC excedem seus máximos.');}
 return data;
}
