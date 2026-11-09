"use client";

import { useState } from "react";
import type { CharacterPayload } from "@/lib/character-model";
import type { LiveCombatState } from "@/lib/combat-types";
import { availableKarma, equippedRuneWeapons, karmicRunes, personalRuneLimit, retainedKarma } from "@/lib/karmic-runes";

export function RuneCombat({ draft, state, pending, onArm, onBurst }: {
  draft: CharacterPayload;
  state: LiveCombatState;
  pending: boolean;
  onArm: (runeId:number, title:string, weaponId?:string)=>void;
  onBurst: (id:string, title:string)=>void;
}) {
  const [runeId, setRuneId] = useState(1);
  const [weaponId, setWeaponId] = useState("");
  const support = equippedRuneWeapons(draft);
  const active = (state.runes ?? []).filter(rune => !rune.spent);
  const picked = karmicRunes.find(rune => rune.id === runeId)!;
  return <details className="live-rune-controls">
    <summary>Runas Kármicas · {retainedKarma(state)} Karma retidos</summary>
    <p>{availableKarma(state)} Karma disponíveis. {active.filter(rune => !rune.weaponId).length}/{personalRuneLimit(draft)} espaços pessoais ocupados.</p>
    <div className="live-controls">
      <label>Runa <select value={runeId} onChange={event => setRuneId(Number(event.target.value))}>{karmicRunes.map(rune => <option key={rune.id} value={rune.id}>{rune.name} · {rune.retained} Karma</option>)}</select></label>
      <label>Suporte <select value={weaponId} onChange={event => setWeaponId(event.target.value)}><option value="">Espaço pessoal</option>{support.map(({item,weapon}) => <option key={item.id} value={item.id}>{item.name} · {active.filter(rune => rune.weaponId === item.id).length}/{weapon.slots}</option>)}</select></label>
      <button type="button" disabled={pending || availableKarma(state) < picked.retained} onClick={() => onArm(runeId, `Armar ${picked.name}`, weaponId || undefined)}>Armar após resolver a inscrição</button>
    </div>
    <p>{picked.category} · Grau {picked.grade}. {picked.passive}</p>
    <p>Estouro. {picked.burst}</p>
    {active.map(inscription => {
      const rune = karmicRunes.find(entry => entry.id === inscription.runeId);
      return rune && <article key={inscription.id}><h3>{rune.name}</h3><p>{rune.passive}</p><p>{rune.burst}</p><button type="button" disabled={pending} onClick={() => onBurst(inscription.id, `Estourar ${rune.name}`)}>Registrar Estouro</button></article>;
    })}
    <small>Resolva o gatilho, a ação e o efeito em mesa. O registro controla vagas e Karma Retido.</small>
  </details>;
}
