"use client";
import type { CombatLog } from '@/lib/combat-types';
export const COMBAT_EFFECT_EVENT='karmalizacao:combat-effect';
export type EffectSettings={motion:boolean};
export function effectSettings():EffectSettings{if(typeof window==='undefined')return {motion:true};try{return {motion:JSON.parse(localStorage.getItem('karmalizacao:effects:v1')??'{}').motion!==false};}catch{return {motion:true};}}
export function saveEffectSettings(value:EffectSettings){try{localStorage.setItem('karmalizacao:effects:v1',JSON.stringify({motion:value.motion}));}catch{}window.dispatchEvent(new Event('karmalizacao:effects-settings'));}
export function emitCombatEffect(log:CombatLog){if(typeof window!=='undefined')window.dispatchEvent(new CustomEvent(COMBAT_EFFECT_EVENT,{detail:log}));}
