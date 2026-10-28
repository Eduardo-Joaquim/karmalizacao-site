"use client";
import type { CombatLog } from '@/lib/combat-types';
export const COMBAT_EFFECT_EVENT='karmalizacao:combat-effect';
export type EffectSettings={sound:boolean;haptics:boolean;motion:boolean};
const defaults:EffectSettings={sound:false,haptics:false,motion:true};
export function effectSettings():EffectSettings{if(typeof window==='undefined')return defaults;try{return {...defaults,...JSON.parse(localStorage.getItem('karmalizacao:effects:v1')??'{}')};}catch{return defaults;}}
const activeOscillators=new Set<OscillatorNode>();
export function saveEffectSettings(value:EffectSettings){if(!value.sound){for(const node of activeOscillators){try{node.stop();node.disconnect();}catch{}}activeOscillators.clear();}try{localStorage.setItem('karmalizacao:effects:v1',JSON.stringify(value));}catch{}window.dispatchEvent(new Event('karmalizacao:effects-settings'));}
let audio:AudioContext|null=null;
export async function unlockCombatAudio(){try{audio??=new AudioContext();if(audio.state==='suspended')await audio.resume();}catch{}}
export function combatSound(kind:'roll'|'impact'|'karma'|'phase'){
 if(!effectSettings().sound||!audio||audio.state!=='running')return;
 try{const now=audio.currentTime;
 const notes=kind==='roll'?[[330,.035],[220,.09],[430,.15]]:kind==='impact'?[[95,0],[48,.05]]:kind==='karma'?[[840,0],[1260,.055]]:[[80,0],[120,.15],[180,.3]];
 for(const [frequency,offset] of notes){const oscillator=audio.createOscillator(),gain=audio.createGain();oscillator.type=kind==='karma'?'triangle':'sine';oscillator.frequency.setValueAtTime(frequency,now+offset);oscillator.frequency.exponentialRampToValueAtTime(Math.max(25,frequency*.5),now+offset+.18);gain.gain.setValueAtTime(0,now+offset);gain.gain.linearRampToValueAtTime(.045,now+offset+.008);gain.gain.exponentialRampToValueAtTime(.0001,now+offset+.22);oscillator.connect(gain);gain.connect(audio.destination);activeOscillators.add(oscillator);oscillator.start(now+offset);oscillator.stop(now+offset+.23);oscillator.onended=()=>{activeOscillators.delete(oscillator);oscillator.disconnect();gain.disconnect();};}
 }catch{}
}
export function emitCombatEffect(log:CombatLog){if(typeof window!=='undefined')window.dispatchEvent(new CustomEvent(COMBAT_EFFECT_EVENT,{detail:log}));}
