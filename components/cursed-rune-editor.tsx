"use client";

import { useState } from "react";
import type { CharacterPayload, InventoryItem } from "@/lib/character-model";
import {
  cursedRunes,
  getCursedRuneError,
  getCursedRuneProfile,
  isCurseWeapon,
} from "@/lib/cursed-runes";

type Inscription = NonNullable<InventoryItem["cursedRune"]>;

const displayText = (value: string) => value.replace(/[*`]/g, "");

const normalized = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

export function CursedRuneEditor({
  draft,
  item,
  conventionalRunes = 0,
  readOnly = false,
  onSeal,
}: {
  draft: CharacterPayload;
  item: InventoryItem;
  conventionalRunes?: number;
  readOnly?: boolean;
  onSeal?: (inscription: Inscription) => void;
}) {
  const example = cursedRunes.effects.find((effect) => effect.example);
  const [inscription, setInscription] = useState<Inscription>(
    item.cursedRune ?? {
      effectId: example?.id ?? cursedRunes.effects[0].id,
      conditionIds: example?.defaultConditions ?? ["C1", "C4", "C5"],
      damageChoice: example?.damageOverride ?? "2d6",
      dcMode: "fixed",
      isolationMode: "isolated",
      tributeMode: "life",
      hungerPenalty: "damage",
      name: example?.name,
    },
  );
  const [query, setQuery] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [ritualCompleted, setRitualCompleted] = useState(false);
  const [saved, setSaved] = useState(false);
  const editable = !readOnly && Boolean(onSeal);
  const shown = editable ? inscription : item.cursedRune;
  const profile = shown && getCursedRuneProfile(draft, shown);
  const effect = cursedRunes.effects.find(
    (entry) => entry.id === shown?.effectId,
  );
  const savedEffect = cursedRunes.effects.find(
    (entry) => entry.id === item.cursedRune?.effectId,
  );
  const power = profile?.power;
  const adaptedExample = Boolean(
    shown &&
    effect?.example &&
    ([...shown.conditionIds].sort().join("|") !==
      [...(effect.defaultConditions ?? [])].sort().join("|") ||
      profile?.damage !== effect.damageOverride ||
      shown.dcMode !== "fixed"),
  );
  const error = editable
    ? item.quantity < 1
      ? "A gravação exige uma arma presente no inventário. Registre uma unidade."
      : getCursedRuneError(draft, item, inscription)
    : undefined;

  if (!isCurseWeapon(item)) return null;

  const update = (patch: Partial<Inscription>) => {
    setInscription((current) => ({ ...current, ...patch }));
    setRitualCompleted(false);
    setSaved(false);
  };
  const chooseEffect = (id: string) => {
    const selected = cursedRunes.effects.find((entry) => entry.id === id);
    update({
      effectId: id,
      ...(selected?.defaultConditions
        ? { conditionIds: [...selected.defaultConditions] }
        : {}),
      ...(selected?.damageOverride
        ? { damageChoice: selected.damageOverride }
        : {}),
      ...(selected?.example
        ? { dcMode: "fixed" as const, name: selected.name }
        : {}),
    });
  };

  return (
    <details
      className="inventory-cursed-rune"
      onToggle={(event) => setEditorOpen(event.currentTarget.open)}
    >
      <summary>
        {item.cursedRune
          ? `Runa Amaldiçoada · ${item.cursedRune.name || savedEffect?.name || "Maldição gravada"}`
          : "Runas Amaldiçoadas · catálogo e criação"}
      </summary>
      <p>
        Uma maldição por arma, sem Grau, Etapa, vaga pessoal ou Karma Retido. A
        maldição ocupa todos os encaixes da arma e impede Runas Kármicas
        convencionais.
      </p>
      <p>
        Criar, gravar, manipular, suprimir ou interagir exige Presença +
        Controle da Corrupção. Com Presença 0, use 1d20 −4 se destreinado;
        treinado usa 1d20 +2, +5 ou +10, sem o −4.
      </p>
      {profile && power && shown && (
        <div className="inventory-cursed-profile" aria-live="polite">
          <strong>
            {editable ? "Prévia da gravação · " : "Maldição gravada · "}
            {shown.name || effect?.name || "Runa Amaldiçoada"}
          </strong>
          <p>
            {shown.conditionIds.length} condições · {power.classification}
            {" · "}
            {profile.damage} no despertar · escape CD {profile.escapeDC}
            {" · "}forja CD {profile.forgeDC} · Fome CD {profile.hungerDC}.
          </p>
          <p>
            Presença final {profile.presence} + Controle da Corrupção nível{" "}
            {profile.controlLevel}.{" "}
            {shown.dcMode === "scaled"
              ? "A CD de escape acompanha esses valores."
              : "A CD de escape usa o valor fixo da faixa escolhida."}
          </p>
          {adaptedExample && (
            <p>
              Composição adaptada da Runa do Deus Selvagem: o exemplo canônico
              usa C1 + C4 + C5, 2d6 e CD 20. Registre com o Mestre como o
              efeito-base se aplica à nova composição.
            </p>
          )}
          {effect && <p>{displayText(effect.effect)}</p>}
          <ul>
            {shown.conditionIds.map((id) => {
              const condition = cursedRunes.conditions.find(
                (entry) => entry.id === id,
              );
              return (
                <li key={id}>
                  <strong>
                    {id} · {condition?.name ?? id}:
                  </strong>{" "}
                  {condition && displayText(condition.description)}
                </li>
              );
            })}
          </ul>
        </div>
      )}
      {!editable && !shown && <p>Esta arma não possui Runa Amaldiçoada.</p>}
      {editable && editorOpen && (
        <>
          <label>
            Nome da maldição na arma
            <input
              value={inscription.name ?? ""}
              maxLength={120}
              onChange={(event) => update({ name: event.target.value })}
            />
          </label>
          <details
            onToggle={(event) => setCatalogOpen(event.currentTarget.open)}
          >
            <summary>Catálogo · Runa do Deus Selvagem e 20 efeitos</summary>
            <label>
              Buscar efeito, nome ou epíteto
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>
            <div className="inventory-cursed-catalog">
              {catalogOpen &&
                cursedRunes.effects
                  .filter((entry) =>
                    normalized(
                      `${entry.name} ${entry.epithet} ${displayText(entry.effect)}`,
                    ).includes(normalized(query)),
                  )
                  .map((entry) => (
                    <article key={entry.id}>
                      <h4>{entry.name}</h4>
                      <p>
                        <em>{entry.epithet}</em>
                      </p>
                      <p>{displayText(entry.effect)}</p>
                      <button
                        type="button"
                        aria-pressed={inscription.effectId === entry.id}
                        onClick={() => chooseEffect(entry.id)}
                      >
                        {inscription.effectId === entry.id
                          ? "Efeito selecionado"
                          : "Usar este efeito"}
                      </button>
                    </article>
                  ))}
            </div>
          </details>
          <fieldset>
            <legend>Condições de Despertar · escolha de 1 a 5</legend>
            {cursedRunes.conditions.map((condition) => {
              const checked = inscription.conditionIds.includes(condition.id);
              const conflict =
                condition.id === "C1"
                  ? "C2"
                  : condition.id === "C2"
                    ? "C1"
                    : condition.id === "C3"
                      ? "C4"
                      : condition.id === "C4"
                        ? "C3"
                        : undefined;
              const disabled =
                Boolean(effect?.example) ||
                (!checked &&
                  (inscription.conditionIds.length >= 5 ||
                    Boolean(
                      conflict && inscription.conditionIds.includes(conflict),
                    )));
              return (
                <label key={condition.id}>
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={disabled}
                    onChange={(event) => {
                      const conditionIds = event.target.checked
                        ? [...inscription.conditionIds, condition.id]
                        : inscription.conditionIds.filter(
                            (id) => id !== condition.id,
                          );
                      const nextPower = cursedRunes.powerLevels.find(
                        (entry) => entry.conditions === conditionIds.length,
                      );
                      update({ conditionIds, damageChoice: nextPower?.damage });
                    }}
                  />
                  <strong>
                    {condition.id} · {condition.name}
                  </strong>{" "}
                  — {displayText(condition.description)}
                </label>
              );
            })}
          </fieldset>
          <p>
            C3 e C4 são alternativas. C1 e C2 exigem vetores incompatíveis no
            mesmo ataque.
          </p>
          {effect?.example && (
            <p>
              O exemplo canônico conserva C1 + C4 + C5, três marcas, 2d6 e CD
              20. Escolha outro efeito do catálogo para construir uma composição
              de uma a cinco condições.
            </p>
          )}
          <div className="inventory-item-fields">
            <label>
              Dano extra da faixa
              <select
                disabled={!power || Boolean(effect?.example)}
                value={profile?.damage ?? ""}
                onChange={(event) =>
                  update({ damageChoice: event.target.value })
                }
              >
                {power &&
                  [power.damage, ...power.alternatives].map((damage) => (
                    <option key={damage} value={damage}>
                      {damage}
                    </option>
                  ))}
              </select>
            </label>
            <label>
              CD de escape
              <select
                disabled={Boolean(effect?.example)}
                value={inscription.dcMode}
                onChange={(event) =>
                  update({
                    dcMode: event.target.value as Inscription["dcMode"],
                  })
                }
              >
                <option value="fixed">Valor fixo da faixa</option>
                <option value="scaled">
                  Base da faixa + Presença final + nível de Controle
                </option>
              </select>
            </label>
            <label>
              Fome na Falha Crítica
              <select
                value={inscription.hungerPenalty ?? "damage"}
                onChange={(event) =>
                  update({
                    hungerPenalty: event.target
                      .value as Inscription["hungerPenalty"],
                  })
                }
              >
                <option value="damage">
                  1d6 de dano Corrupto se falhar no Controle
                </option>
                <option value="temporaryCharge">
                  +1 Carga Temporária se falhar no Controle
                </option>
              </select>
            </label>
            {inscription.conditionIds.includes("C7") && (
              <label>
                C7 · situação escolhida
                <select
                  value={inscription.isolationMode ?? "isolated"}
                  onChange={(event) =>
                    update({
                      isolationMode: event.target
                        .value as Inscription["isolationMode"],
                    })
                  }
                >
                  <option value="isolated">
                    Alvo isolado: sem aliados dele a até 3m
                  </option>
                  <option value="flanked">
                    Alvo flanqueado: engajado com aliado seu
                  </option>
                </select>
              </label>
            )}
            {inscription.conditionIds.includes("C8") && (
              <label>
                C8 · tributo escolhido
                <select
                  value={inscription.tributeMode ?? "life"}
                  onChange={(event) =>
                    update({
                      tributeMode: event.target
                        .value as Inscription["tributeMode"],
                    })
                  }
                >
                  <option value="life">
                    Pagar 3 de Vida irreduzíveis no despertar
                  </option>
                  <option value="wounded">
                    Portador abaixo de 50% da Vida
                  </option>
                </select>
              </label>
            )}
          </div>
          {power && (
            <p>
              <strong>Estado da faixa:</strong>{" "}
              {displayText(power.stateDescription)}
            </p>
          )}
          <p>
            Confira com o Mestre a composição entre o estado permitido pela
            faixa e o efeito escolhido. O registro não torna um estado grave
            elegível para qualquer quantidade de condições; efeitos e estados
            são resolvidos em mesa.
          </p>
          {error && <p role="alert">{error}</p>}
          <p>
            Selar ou alterar a maldição exige concluir o ritual e resolver o
            teste de Presença + Controle da Corrupção em mesa. Este registro não
            concede sucesso automático, não paga materiais e não remove o torpor
            por si só.
          </p>
          {conventionalRunes > 0 && (
            <p role="alert">
              Ao selar, {conventionalRunes}{" "}
              {conventionalRunes === 1
                ? "Runa Kármica convencional será destruída"
                : "Runas Kármicas convencionais serão destruídas"}{" "}
              nesta arma. O Karma Retido segue seu prazo normal de retorno.
            </p>
          )}
          <label>
            <input
              type="checkbox"
              checked={ritualCompleted}
              onChange={(event) => setRitualCompleted(event.target.checked)}
            />
            O ritual foi concluído com sucesso e as condições foram registradas.
          </label>
          <button
            type="button"
            disabled={Boolean(error) || !ritualCompleted}
            onClick={() => {
              if (!error && ritualCompleted) {
                onSeal?.({
                  ...inscription,
                  damageChoice: inscription.damageChoice ?? profile?.damage,
                });
                setRitualCompleted(false);
                setSaved(true);
              }
            }}
          >
            {item.cursedRune
              ? "Registrar nova gravação na arma"
              : "Selar Runa Amaldiçoada nesta arma"}
          </button>
          {saved && (
            <p role="status">
              Maldição registrada. Salve a ficha para conservar a alteração.
            </p>
          )}
        </>
      )}
    </details>
  );
}
