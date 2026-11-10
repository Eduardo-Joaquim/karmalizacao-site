"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { DAMAGE_TYPES, MATRICES, techniqueGradeIndex, techniqueProfile, type TechniqueMatrix } from "@/lib/technique-matrices";
import { LINEAGE_CATALYSTS, doctrineOptions, doctrineDiscount } from "@/lib/technique-lineage";
import type { TechniqueRecord } from "@/lib/character-model";

export function TechniqueMatrixEditor({ technique, race, className, onChange }: {
  technique: TechniqueRecord;
  race: string;
  className: string;
  onChange: (patch: Partial<TechniqueRecord>) => void;
}) {
  const matrix = technique.matrix ?? "Kármico";
  const grade = techniqueGradeIndex(technique.grade);
  const extras = technique.matrixExtras ?? 0;
  const baseDiscount = technique.matrixDiscount ?? 0;
  const doctrine = technique.doctrine ?? "";
  const doctrines = doctrineOptions(className);
  const profile = grade >= 0 ? techniqueProfile(matrix, grade, extras, baseDiscount + doctrineDiscount(className, doctrine, extras)) : null;
  const elemental = DAMAGE_TYPES.filter((type) => type.startsWith("Elemental / "));
  const damage = matrix === "Elemental"
    ? technique.damageType?.startsWith("Elemental / ") ? technique.damageType : elemental[0]
    : matrix;
  const catalyst = LINEAGE_CATALYSTS[race];
  const calculation = profile ? `Base ${profile.base} + efeitos ${extras} − redução ${profile.discount} = ${profile.cost} Karma` : "";

  function apply(offensive: boolean) {
    if (!profile) return;
    onChange({
      matrix,
      damageType: damage as TechniqueRecord["damageType"],
      cost: String(profile.cost),
      calculation,
      ...(offensive ? {
        totalSuccess: `${profile.damage} de dano ${damage}.`,
        partialSuccess: "Metade do dano antes de Resistência e Escudo.",
        failure: "Sem dano. Os custos permanecem gastos.",
      } : {}),
    });
  }

  return (
    <fieldset className="technique-form-group matrix-builder">
      <legend>Da linhagem à técnica</legend>
      <p className="matrix-hint">Configure a matriz para calcular o custo e o dano-base. Escolha quais valores aplicar à técnica.</p>
      <div className="character-form-grid technique-matrix-fields">
        <label className="character-field">
          <span>Matriz</span>
          <NativeSelect value={matrix} onChange={(event) => onChange({ matrix: event.target.value as TechniqueMatrix, damageType: undefined })}>
            {MATRICES.map((option) => <NativeSelectOption key={option}>{option}</NativeSelectOption>)}
          </NativeSelect>
        </label>
        {matrix === "Elemental" && (
          <label className="character-field">
            <span>Elemento ou subdobra</span>
            <NativeSelect value={damage} onChange={(event) => onChange({ damageType: event.target.value as TechniqueRecord["damageType"] })}>
              {elemental.map((option) => <NativeSelectOption key={option}>{option}</NativeSelectOption>)}
            </NativeSelect>
          </label>
        )}
        <label className="character-field">
          <span>Catalisador de linhagem</span>
          <NativeSelect value={technique.lineageCatalyst === race ? race : ""} onChange={(event) => onChange({ lineageCatalyst: event.target.value })}>
            <NativeSelectOption value="">Sem catalisador</NativeSelectOption>
            {catalyst && <NativeSelectOption value={race}>{race}</NativeSelectOption>}
          </NativeSelect>
        </label>
        <label className="character-field">
          <span>Doutrina de {className || "classe"}</span>
          <NativeSelect value={doctrines.includes(doctrine) ? doctrine : ""} onChange={(event) => onChange({ doctrine: event.target.value })}>
            <NativeSelectOption value="">Sem desconto de doutrina</NativeSelectOption>
            {doctrines.map((option) => <NativeSelectOption key={option}>{option}</NativeSelectOption>)}
          </NativeSelect>
        </label>
        <label className="character-field">
          <span>Ampliações e efeitos (Karma)</span>
          <Input type="number" min={0} max={999} value={extras} onChange={(event) => onChange({ matrixExtras: Math.max(0, Math.min(999, Number(event.target.value))) })} />
        </label>
        <label className="character-field">
          <span>Outros redutores (Karma)</span>
          <Input type="number" min={0} max={3} value={baseDiscount} onChange={(event) => onChange({ matrixDiscount: Math.max(0, Math.min(3, Number(event.target.value))) })} />
        </label>
      </div>
      {technique.lineageCatalyst === race && catalyst && <p className="matrix-hint">{catalyst} Aplique o gatilho e os limites da linhagem na mesa.</p>}
      {matrix === "Corrupto" && <p className="matrix-hint">Controle: CD 16 mais Cargas. Grau III exige Controle no fim do turno; IV e V, imediato. No Grau V, com Desvantagem.</p>}
      {profile ? <output className="matrix-result">
        <span><strong>{profile.cost} Karma</strong><small>{calculation}</small></span>
        <span><strong>{profile.damage}</strong><small>Dano-base ofensivo</small></span>
      </output> : <p className="matrix-hint">Selecione um grau em Identidade e execução para calcular o custo e o dano-base.</p>}
      <div className="matrix-actions">
        <Button type="button" variant="outline" disabled={!profile} onClick={() => apply(false)}>Aplicar apenas o custo</Button>
        <Button type="button" className="karma-button" disabled={!profile} onClick={() => apply(true)}>Aplicar custo e dano-base</Button>
      </div>
    </fieldset>
  );
}
