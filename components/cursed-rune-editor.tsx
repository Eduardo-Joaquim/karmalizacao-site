"use client";

import { useState } from "react";
import type { CharacterPayload, InventoryItem } from "@/lib/character-model";
import { curseRulesVersion } from "@/lib/cursed-rune-model";
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

function newEngraving(current?: Inscription): Inscription {
  const example = cursedRunes.effects.find((effect) => effect.example);
  const selected = current
    ? cursedRunes.effects.find((effect) => effect.id === current.effectId)
    : (example ?? cursedRunes.effects[0]);
  const conditionIds = [
    ...(current?.conditionIds ??
      selected?.defaultConditions ?? ["C1", "C4", "C5"]),
  ];
  const tier = cursedRunes.powerLevels.find(
    (entry) => entry.conditions === conditionIds.length,
  );
  return {
    ...current,
    effectId: current?.effectId ?? selected?.id ?? cursedRunes.effects[0].id,
    conditionIds,
    damageChoice:
      current?.damageChoice ?? selected?.damageOverride ?? tier?.damage,
    name: current?.name ?? selected?.name,
    rulesVersion: 2,
    dcMode: "fixed",
    isolationMode: current?.isolationMode ?? "isolated",
    counterTimeMode: current?.counterTimeMode ?? "revenge",
    tributeMode: "life",
    hungerPenalty: "damage",
  };
}

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
  const [inscription, setInscription] = useState<Inscription>(() =>
    newEngraving(item.cursedRune),
  );
  const [query, setQuery] = useState("");
  const [conditionQuery, setConditionQuery] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [ritualCompleted, setRitualCompleted] = useState(false);
  const [forgeTotal, setForgeTotal] = useState("");
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
  const lockedComposition = Boolean(
    effect?.example || effect?.fixedComposition,
  );
  const legacy = Boolean(shown && curseRulesVersion(shown) === 1);
  const conditions = legacy
    ? (cursedRunes.legacyConditions ?? cursedRunes.conditions)
    : cursedRunes.conditions;
  const error = editable
    ? item.quantity < 1
      ? "A gravação exige uma arma presente no inventário. Registre uma unidade."
      : getCursedRuneError(draft, item, inscription)
    : undefined;
  const forgeSucceeded = Boolean(
    profile &&
    forgeTotal.trim() &&
    Number.isInteger(Number(forgeTotal)) &&
    Number(forgeTotal) >= profile.forgeDC,
  );

  if (!isCurseWeapon(item)) return null;

  const update = (patch: Partial<Inscription>) => {
    setInscription((current) => ({ ...current, ...patch }));
    setRitualCompleted(false);
    setForgeTotal("");
    setSaved(false);
  };
  const chooseEffect = (id: string) => {
    const selected = cursedRunes.effects.find((entry) => entry.id === id);
    const conditionIds = selected?.defaultConditions
      ? [...selected.defaultConditions]
      : inscription.conditionIds;
    const nextPower = cursedRunes.powerLevels.find(
      (entry) => entry.conditions === conditionIds.length,
    );
    const allowedDamage = nextPower
      ? [nextPower.damage, ...nextPower.alternatives]
      : [];
    update({
      effectId: id,
      name: selected?.name,
      conditionIds,
      damageChoice:
        selected?.damageOverride ??
        (allowedDamage.includes(inscription.damageChoice ?? "")
          ? inscription.damageChoice
          : nextPower?.damage),
    });
  };

  return (
    <details
      className="inventory-cursed-rune"
      onToggle={(event) => setEditorOpen(event.currentTarget.open)}
    >
      <summary>
        {item.cursedRune
          ? `Runa Amaldiçoada - ${item.cursedRune.name || savedEffect?.name || "Maldição gravada"}`
          : "Runas Amaldiçoadas - catálogo e criação"}
      </summary>
      <p>
        Uma maldição por arma, sem Grau, Etapa, vaga pessoal ou Karma Retido.
        Ela ocupa todos os encaixes e impede Runas Kármicas convencionais na
        mesma arma.
      </p>
      {profile && power && shown && (
        <div className="inventory-cursed-profile" aria-live="polite">
          <header>
            <small>
              {editable ? "Prévia da gravação" : "Maldição gravada"}
            </small>
            <strong>{shown.name || effect?.name || "Runa Amaldiçoada"}</strong>
            <p>
              {shown.conditionIds.length} condições - {power.classification} -{" "}
              {profile.damage} no despertar
            </p>
          </header>
          {effect?.fixedComposition && (
            <p className="cursed-rune-note">
              Receita oficial - composição fixa:{" "}
              {effect.defaultConditions?.join(" + ")} - {effect.damageOverride}{" "}
              no despertar. Nome e escolhas previstas pelas condições podem ser
              personalizados.
            </p>
          )}
          <dl className="cursed-dc-grid" aria-label="As três CDs da maldição">
            <div>
              <dt>Escape da vítima</dt>
              <dd>
                <strong>CD {profile.escapeDC}</strong>
                <p>
                  Maior entre a fixa {power.escapeDC} e a escalonada{" "}
                  {power.scalingBase} + {profile.presence} +{" "}
                  {profile.controlLevel} ={" "}
                  {power.scalingBase + profile.presence + profile.controlLevel}.
                </p>
              </dd>
            </div>
            <div>
              <dt>Forja</dt>
              <dd>
                <strong>CD {profile.forgeDC}</strong>
                <p>
                  Presença + Controle da Corrupção. Gravar ou alterar exige 1 TE
                  (2 horas).
                </p>
              </dd>
            </div>
            <div>
              <dt>Fome</dt>
              <dd>
                <strong>CD {profile.hungerDC}</strong>
                <p>
                  14 + {shown.conditionIds.length} condições. Teste ao
                  selecionar 1 natural no ataque.
                </p>
              </dd>
            </div>
          </dl>
          <p className="cursed-rune-note">
            A escalonada usa Presença final {profile.presence} e Controle da
            Corrupção nível {profile.controlLevel}. A faixa fixa de 16 a 24 não
            limita a CD calculada.
          </p>
          {legacy && (
            <p className="cursed-rune-note">
              Esta gravação conserva suas condições e seus custos anteriores até
              ser reforjada. A CD de escape já considera o maior valor.
            </p>
          )}
          {effect?.effect.split(/\n\s*\n/).map((paragraph, index) => (
            <p key={index}>{displayText(paragraph)}</p>
          ))}
          <details className="cursed-rune-reference">
            <summary>Condições gravadas ({shown.conditionIds.length})</summary>
            <ul>
              {shown.conditionIds.map((id) => {
                const condition = conditions.find((entry) => entry.id === id);
                return (
                  <li key={id}>
                    <strong>
                      {id} - {condition?.name ?? id}
                    </strong>
                    {condition && ` - ${displayText(condition.description)}`}
                  </li>
                );
              })}
            </ul>
          </details>
        </div>
      )}
      {!editable && !shown && <p>Esta arma não possui Runa Amaldiçoada.</p>}
      {editable && editorOpen && (
        <div className="cursed-rune-editor-fields">
          {item.cursedRune && curseRulesVersion(item.cursedRune) === 1 && (
            <p className="cursed-rune-note">
              A gravação atual permanece ativa até confirmar a reforja. A prévia
              aplica as 20 condições atuais: C8 exige estar ferido e pagar 4
              Vida; a falha na Fome causa 1d6 Corrupto.
            </p>
          )}
          <label>
            Nome da maldição na arma
            <input
              value={inscription.name ?? ""}
              maxLength={100}
              onChange={(event) => update({ name: event.target.value })}
            />
          </label>
          <details
            onToggle={(event) => setCatalogOpen(event.currentTarget.open)}
          >
            <summary>Catálogo - {cursedRunes.effects.length} maldições</summary>
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
                      `${entry.name} ${entry.epithet ?? ""} ${displayText(entry.effect)}`,
                    ).includes(normalized(query)),
                  )
                  .map((entry) => (
                    <article key={entry.id}>
                      <h4>{entry.name}</h4>
                      {entry.epithet && (
                        <p>
                          <em>{entry.epithet}</em>
                        </p>
                      )}
                      {entry.effect.split(/\n\s*\n/).map((paragraph, index) => (
                        <p key={index}>{displayText(paragraph)}</p>
                      ))}
                      {entry.defaultConditions && (
                        <p className="cursed-rune-note">
                          {entry.fixedComposition
                            ? "Receita oficial - composição fixa:"
                            : "Composição:"}{" "}
                          {entry.defaultConditions.join(" + ")} -{" "}
                          {entry.damageOverride}
                        </p>
                      )}
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
          <details>
            <summary>
              Condições de Despertar - {inscription.conditionIds.length} de até
              5{lockedComposition ? " - composição fixa" : ""}
            </summary>
            {!lockedComposition && (
              <label>
                Buscar entre as 20 condições
                <input
                  value={conditionQuery}
                  onChange={(event) => setConditionQuery(event.target.value)}
                />
              </label>
            )}
            <fieldset className="cursed-condition-options">
              <legend>
                {lockedComposition
                  ? "Condições da composição fixa"
                  : "Escolha de 1 a 5 condições compatíveis"}
              </legend>
              {cursedRunes.conditions
                .filter((condition) =>
                  lockedComposition
                    ? inscription.conditionIds.includes(condition.id)
                    : normalized(
                        `${condition.id} ${condition.name} ${condition.description}`,
                      ).includes(normalized(conditionQuery)),
                )
                .map((condition) => {
                  const checked = inscription.conditionIds.includes(
                    condition.id,
                  );
                  const conflicts = inscription.conditionIds.filter(
                    (id) =>
                      condition.incompatibleWith?.includes(id) ||
                      cursedRunes.conditions
                        .find((entry) => entry.id === id)
                        ?.incompatibleWith?.includes(condition.id),
                  );
                  const disabled =
                    lockedComposition ||
                    (!checked &&
                      (inscription.conditionIds.length >= 5 ||
                        conflicts.length > 0));
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
                          update({
                            conditionIds,
                            damageChoice: nextPower?.damage,
                          });
                        }}
                      />
                      <span>
                        <strong>
                          {condition.id} - {condition.name}
                        </strong>
                        <span>{displayText(condition.description)}</span>
                        {!checked && conflicts.length > 0 && (
                          <small>
                            Incompatível com {conflicts.join(", ")}.
                          </small>
                        )}
                      </span>
                    </label>
                  );
                })}
            </fieldset>
            {effect?.example && (
              <p className="cursed-rune-note">
                Esta receita conserva sua composição e seu dano. Escolha outro
                efeito para construir uma composição diferente.
              </p>
            )}
            {effect?.fixedComposition && (
              <p className="cursed-rune-note">
                Esta receita oficial conserva suas condições e seu dano. Escolha
                um efeito de composição livre para construir outra combinação.
              </p>
            )}
          </details>
          <div className="inventory-item-fields">
            <label>
              Dano extra da faixa
              <select
                disabled={!power || lockedComposition}
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
            {inscription.conditionIds.includes("C7") && (
              <label>
                C7 - situação escolhida
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
            {inscription.conditionIds.includes("C10") && (
              <label>
                C10 - Contra-Tempo escolhido
                <select
                  value={inscription.counterTimeMode ?? "revenge"}
                  onChange={(event) =>
                    update({
                      counterTimeMode: event.target
                        .value as Inscription["counterTimeMode"],
                    })
                  }
                >
                  <option value="revenge">
                    Vingança: sofreu dano daquele alvo desde o último turno
                  </option>
                  <option value="charge">
                    Investida: deslocou-se 4m ou mais
                  </option>
                </select>
              </label>
            )}
          </div>
          {inscription.conditionIds.includes("C8") && (
            <p className="cursed-rune-note">
              C8 - O portador precisa estar ferido e paga 4 de Vida no
              despertar.
            </p>
          )}
          {inscription.conditionIds.includes("C17") && (
            <p className="cursed-rune-note">
              C17 - Fechar o ciclo consome 2 de Karma da reserva do portador.
            </p>
          )}
          {power && (
            <details className="cursed-rune-reference">
              <summary>Referência geral da faixa</summary>
              <p>
                Nas receitas oficiais, prevalece o efeito descrito na entrada.
              </p>
              <p>{displayText(power.stateDescription)}</p>
              <p>
                Confira a composição com o Mestre. Dano e estados da vítima são
                resolvidos em mesa.
              </p>
            </details>
          )}
          <p>
            Toda interação exige Presença + Controle da Corrupção. Com Presença
            0: destreinado usa 1d20 −4; treinado usa 1d20 +2, +5 ou +10.
          </p>
          <p className="cursed-rune-note">
            Fome - Ao selecionar 1 natural no ataque, teste Presença + Controle
            contra a CD da Fome. Na falha, sofra 1d6 de dano Corrupto direto.
          </p>
          {error && <p role="alert">{error}</p>}
          {conventionalRunes > 0 && (
            <p role="alert">
              Ao selar, {conventionalRunes}{" "}
              {conventionalRunes === 1
                ? "Runa Kármica convencional será destruída"
                : "Runas Kármicas convencionais serão destruídas"}{" "}
              nesta arma. O Karma Retido segue seu prazo normal de retorno.
            </p>
          )}
          <fieldset className="cursed-forge-confirmation">
            <legend>Confirmar a forja - CD {profile?.forgeDC}</legend>
            <p>
              Resolva o teste e os materiais em mesa. O registro exige o tempo
              de forja e um teste bem-sucedido.
            </p>
            <label>
              Resultado de Presença + Controle da Corrupção
              <input
                type="number"
                step={1}
                value={forgeTotal}
                onChange={(event) => {
                  setForgeTotal(event.target.value);
                  setSaved(false);
                }}
              />
            </label>
            {forgeTotal.trim() && !forgeSucceeded && (
              <p role="alert">O resultado ainda não atinge a CD de Forja.</p>
            )}
            <label>
              <input
                type="checkbox"
                checked={ritualCompleted}
                onChange={(event) => setRitualCompleted(event.target.checked)}
              />
              Concluí 1 TE (2 horas) para gravar ou alterar esta runa.
            </label>
          </fieldset>
          <button
            type="button"
            disabled={Boolean(error) || !ritualCompleted || !forgeSucceeded}
            onClick={() => {
              if (!error && ritualCompleted && forgeSucceeded) {
                onSeal?.({
                  ...inscription,
                  rulesVersion: 2,
                  dcMode: "fixed",
                  tributeMode: "life",
                  hungerPenalty: "damage",
                  damageChoice: inscription.damageChoice ?? profile?.damage,
                });
                setRitualCompleted(false);
                setForgeTotal("");
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
        </div>
      )}
    </details>
  );
}
