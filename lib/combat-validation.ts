import { z } from 'zod';
const num=z.number().int().min(0).max(99999), delta=z.number().int().min(-99999).max(99999);
const base=z.object({id:z.string().min(12).max(80).regex(/^[a-zA-Z0-9-]+$/),actorName:z.string().min(1).max(120),title:z.string().min(1).max(120)});
export const combatActionSchema=z.discriminatedUnion('type',[
 base.extend({type:z.literal('damage'),amount:num,resistance:num,bypassShield:z.boolean().optional()}),
 base.extend({type:z.literal('heal'),amount:num}),
 base.extend({type:z.literal('resource'),resource:z.enum(['karma','life','shield','saturation','charge','reactions']),delta}),
 base.extend({type:z.literal('condition'),condition:z.string().min(1).max(80),remove:z.boolean()}),
 base.extend({type:z.literal('execute'),cost:num,kind:z.enum(['skill','attack','technique','ability']),rollFormula:z.string().max(120).optional(),diceResults:z.array(z.number().int().min(1).max(100)).max(60).optional(),total:z.number().finite().min(-99999).max(99999).optional(),details:z.string().max(1500).optional()}),
 base.extend({type:z.literal('domain'),name:z.string().max(80)}),base.extend({type:z.literal('form'),active:z.boolean()}),
 base.extend({type:z.literal('round')}),base.extend({type:z.literal('scene')}),base.extend({type:z.literal('toggle'),active:z.boolean()}),
]);
export const combatRequestSchema=z.object({id:z.string().min(12).max(80).regex(/^[a-zA-Z0-9-]+$/),action:combatActionSchema}).strict();
