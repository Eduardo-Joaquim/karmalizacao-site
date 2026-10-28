"use client";
import {useEffect,useState} from 'react';
import {effectSettings,saveEffectSettings,unlockCombatAudio,type EffectSettings} from '@/lib/combat-effects';
export function CombatEffectsControls(){
 const [s,set]=useState<EffectSettings>({sound:false,haptics:false,motion:true});
 useEffect(()=>{const read=()=>set(effectSettings());read();window.addEventListener('karmalizacao:effects-settings',read);window.addEventListener('storage',read);return()=>{window.removeEventListener('karmalizacao:effects-settings',read);window.removeEventListener('storage',read);};},[]);
 function toggle(key:keyof EffectSettings){const next={...s,[key]:!s[key]};set(next);saveEffectSettings(next);if(key==='sound'&&next.sound)void unlockCombatAudio();}
 return <div className="combat-effects-controls" aria-label="Preferências dos efeitos"><button type="button" aria-pressed={s.sound} onClick={()=>toggle('sound')} title="Som sintetizado, desligado por padrão">{s.sound?'Som ligado':'Som desligado'}</button><button type="button" aria-pressed={s.motion} onClick={()=>toggle('motion')}>{s.motion?'Animações ligadas':'Movimento reduzido'}</button><button type="button" aria-pressed={s.haptics} onClick={()=>toggle('haptics')}>{s.haptics?'Vibração ligada':'Vibração desligada'}</button></div>;
}
