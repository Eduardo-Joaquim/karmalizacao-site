"use client";
import {useEffect,useState} from 'react';
import {effectSettings,saveEffectSettings,type EffectSettings} from '@/lib/combat-effects';
export function CombatEffectsControls(){
 const [s,set]=useState<EffectSettings>({motion:true});
 useEffect(()=>{const read=()=>set(effectSettings());read();window.addEventListener('karmalizacao:effects-settings',read);window.addEventListener('storage',read);return()=>{window.removeEventListener('karmalizacao:effects-settings',read);window.removeEventListener('storage',read);};},[]);
 function toggle(key:keyof EffectSettings){const next={...s,[key]:!s[key]};set(next);saveEffectSettings(next);}
 return <div className="combat-effects-controls" aria-label="Preferências visuais"><button type="button" aria-pressed={s.motion} onClick={()=>toggle('motion')}>{s.motion?'Animações ligadas':'Movimento reduzido'}</button></div>;
}
