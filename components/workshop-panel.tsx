"use client";
import { useState } from "react";
import { combatId } from "@/lib/combat-id";
import type { CharacterPayload } from "@/lib/character-model";
import { workshopProfile } from "@/lib/workshop-rules";

type Device = NonNullable<CharacterPayload["workshopDevices"]>[number];
const kinds: Device["kind"][] = ["Ofensivo", "Ferramenta", "Manipulação", "Emissor de Escudo Cinético"];

export function WorkshopPanel({ draft, onChange }: { draft: CharacterPayload; onChange?: (draft: CharacterPayload) => void }) {
  const [name, setName] = useState("");
  const [kind, setKind] = useState<Device["kind"]>("Ofensivo");
  if (draft.className !== "Inventor") return null;
  const profile = workshopProfile(draft.stage);
  const devices = draft.workshopDevices ?? [];
  const active = devices.filter(device => device.active);
  const setDevices = (next: Device[]) => onChange?.({ ...draft, workshopDevices: next });

  return (
    <section className="workshop-panel" aria-label="Dispositivos preparados da Oficina">
      <h3>Dispositivos preparados da Oficina</h3>
      <p>{profile.stage} · {devices.length}/{profile.prepared} preparados · {active.length}/{profile.active} ativos</p>
      <p>CA {profile.ca} · Vida {profile.life} · Ataque {profile.damage} · Alcance {profile.range} m · Principal e 3 Karma por {profile.duration} rodadas.</p>
      <p>Emissor de Escudo Cinético · CA 14 · 8 Vida · 14 de proteção compartilhada · Principal e 6 Karma · raio de 5 m.</p>
      <p>Preparação do chassi: {profile.parts} M$ em peças e {profile.timeTE} TE. {profile.complexity}</p>
      {devices.length > 0 && <ul>{devices.map(device => (
        <li key={device.id}>
          <strong>{device.name}</strong> · {device.kind} · {device.active ? "Ativo" : "Preparado"}
          {onChange && <div className="live-controls">
            <button type="button" disabled={!device.active && (active.length >= profile.active || (device.kind === kinds[3] && active.some(entry => entry.kind === kinds[3])))} onClick={() => setDevices(devices.map(entry => entry.id === device.id ? { ...entry, active: !entry.active } : entry))}>{device.active ? "Marcar encerrado" : "Marcar ativo"}</button>
            <button type="button" onClick={() => setDevices(devices.filter(entry => entry.id !== device.id))}>Retirar da preparação</button>
          </div>}
        </li>
      ))}</ul>}
      {onChange && <>
        <p>Registre os dispositivos da Oficina. Ao marcar uma ativação, pague o custo e controle a duração na mesa.</p>
        <div className="live-controls">
          <label>Nome<input value={name} maxLength={80} onChange={event => setName(event.target.value)} /></label>
          <label>Função<select value={kind} onChange={event => setKind(event.target.value as Device["kind"])}>{kinds.map(option => <option key={option}>{option}</option>)}</select></label>
          <button type="button" disabled={!name.trim() || devices.length >= profile.prepared} onClick={() => {setDevices([...devices, { id: combatId(), name: name.trim(), kind, active: false }]); setName("");}}>Registrar preparado</button>
        </div>
      </>}
    </section>
  );
}
