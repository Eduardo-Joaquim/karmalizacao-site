import { phaseNoticeSchema } from '@/lib/combat-visual-schema';
import { z } from 'zod';
const num=z.number().int().min(0).max(99999), delta=z.number().int().min(-99999).max(99999);
const base=z.object({id:z.string().min(12).max(80).regex(/^[a-zA-Z0-9-]+$/),actorName:z.string().min(1).max(120),title:z.string().min(1).max(120)}).strict();
export const combatActionSchema=z.discriminatedUnion('type',[
 base.extend({type:z.literal('damage'),amount:num,resistance:num,incomingElement:z.string().max(80).optional(),primaryDefenses:z.record(z.string().max(40),num).optional(),bypassShield:z.boolean().optional()}),
 base.extend({type:z.literal('summon'),invocationId:z.string().min(1).max(80),operation:z.enum(['call','maintain','life','dismiss','fracture']),delta:delta.optional()}),
 base.extend({type:z.literal('heal'),amount:num}),
 base.extend({type:z.literal('resource'),resource:z.enum(['karma','life','shield','saturation','charge','reactions','favor']),delta}),
 base.extend({type:z.literal('condition'),condition:z.string().min(1).max(80),remove:z.boolean(),rounds:z.number().int().min(1).max(99).optional()}),
 base.extend({type:z.literal('inventoryUse'),itemId:z.string().min(1).max(120),location:z.enum(['backpack','ready','external']).optional(),equipped:z.boolean().optional(),consume:z.number().int().min(1).max(999).optional()}).strict(),
 base.extend({type:z.literal('execute'),techniqueId:z.string().min(1).max(80).optional(),succeeded:z.boolean().optional(),impetus:z.boolean().optional(),cost:num,kind:z.enum(['skill','attack','technique','ability']),selection:z.enum(['maior','menor']).optional(),rollFormula:z.string().max(120).optional(),diceResults:z.array(z.number().int().min(1).max(100)).max(60).optional(),total:z.number().finite().min(-99999).max(99999).optional(),details:z.string().max(1500).optional()}),
 base.extend({type:z.literal('phase'),phase:phaseNoticeSchema}),
 base.extend({type:z.literal('spectacle'),rollFormula:z.string().max(120),diceResults:z.array(z.number().int().min(1).max(20)).min(1).max(30),total:z.number().finite().min(-99999).max(99999),selection:z.enum(['maior','menor']),details:z.string().max(1500).optional()}),
 base.extend({type:z.literal('armRune'),runeId:z.number().int().min(1).max(25),weaponId:z.string().min(1).max(120).optional()}),
 base.extend({type:z.literal('burstRune'),inscriptionId:z.string().min(1).max(80)}),
 base.extend({type:z.literal('domain'),name:z.string().max(80)}),base.extend({type:z.literal('form'),active:z.boolean()}),
 base.extend({type:z.literal('barrier'),reinforced:z.boolean()}),
 base.extend({type:z.literal('round')}),base.extend({type:z.literal('scene')}),base.extend({type:z.literal('rest')}),base.extend({type:z.literal('toggle'),active:z.boolean()}),
]);
export const combatRequestSchema=z.object({id:z.string().min(12).max(80).regex(/^[a-zA-Z0-9-]+$/),action:combatActionSchema}).strict();
