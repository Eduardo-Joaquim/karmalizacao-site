"use client";

import {
  BookOpen,
  CircleDot,
  Flame,
  Landmark,
  Plus,
  ShieldCheck,
  Skull,
  Sparkles,
  Swords,
  Trash2,
  Zap,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { CorruptedFormEditor } from "@/components/corrupted-form-editor";
import { InvocationEditor } from "@/components/invocation-editor";
import { VowEditor } from "@/components/vow-editor";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  AFFINITIES,
  ALL_SKILLS,
  ATTRIBUTES,
  ELEMENTS,
  type CharacterPayload,
  type DivineState,
  type DomainState,
  type ElementalState,
  type TechniqueRecord,
} from "@/lib/character-data";
import {
  DOMAIN_RULES,
  PANTHEONS,
  PATH_PRICES,
  PATH_RUPTURES,
  getClassAbilityLimit,
  getClassAmplificationLimit,
  getClassDefinition,
  getDomainRegentAttribute,
  getFinalAttribute,
  getRaceRule,
  PRESENCE_SKILLS,
  type AutomaticBonuses,
} from "@/lib/character-rules";

type PowerEditorProps = {
  draft: CharacterPayload;
  automatic: AutomaticBonuses;
  onChange: (next: CharacterPayload) => void;
};

type TextFieldProps = {
  id: string;
  label: string;
  value: string;
  placeholder?: string;
  wide?: boolean;
  multiline?: boolean;
  onChange: (value: string) => void;
};

const REFINEMENTS = ["Eficiência", "Permanência", "Precisão"] as const;
const POWER_TOPICS = [
  ["poder-raca-classe", "Raça & classe"],
  ["poder-dominios", "Domínios"],
  ["poder-elemental", "Elemental"],
  ["poder-corrupcao", "Corrupção"],
  ["poder-divino", "Poder divino"],
  ["poder-invocacoes", "Invocações"],
  ["poder-votos", "Votos Vinculativos"],
  ["poder-tecnicas", "Técnicas"],
] as const;

function TextField({
  id,
  label,
  value,
  placeholder,
  wide,
  multiline,
  onChange,
}: TextFieldProps) {
  return (
    <div className={`character-field${wide ? " field-full" : ""}`}>
      <Label htmlFor={id} className="character-label">
        {label}
      </Label>
      {multiline ? (
        <Textarea
          id={id}
          value={value}
          maxLength={2500}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : (
        <Input
          id={id}
          value={value}
          maxLength={500}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
    </div>
  );
}

function SectionHeading({
  icon: Icon,
  kicker,
  title,
  children,
}: {
  icon: typeof Sparkles;
  kicker: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <header className="power-section-heading">
      <span className="power-section-icon" aria-hidden="true">
        <Icon />
      </span>
      <div>
        <small>{kicker}</small>
        <h2>{title}</h2>
        <p>{children}</p>
      </div>
    </header>
  );
}

function createTechnique(): TechniqueRecord {
  return {
    id: crypto.randomUUID(),
    name: "",
    concept: "",
    source: "",
    attribute: "",
    skill: "",
    grade: "Comum",
    action: "Ação principal",
    range: "",
    targetAreaDuration: "",
    cost: "",
    calculation: "",
    test: "",
    totalSuccess: "",
    partialSuccess: "",
    failure: "",
    limits: "",
    signature: false,
  };
}

export function CharacterPowerEditor({ draft, automatic, onChange }: PowerEditorProps) {
  const race = getRaceRule(draft.race);
  const classDefinition = getClassDefinition(draft.className);
  const abilityLimit = getClassAbilityLimit(draft.stage);
  const amplificationLimit = getClassAmplificationLimit(draft.stage);

  function update<K extends keyof CharacterPayload>(
    key: K,
    value: CharacterPayload[K],
  ) {
    onChange({ ...draft, [key]: value });
  }

  function updateDomain(name: DomainState["name"], patch: Partial<DomainState>) {
    update(
      "domains",
      draft.domains.map((domain) =>
        domain.name === name ? { ...domain, ...patch } : domain,
      ),
    );
  }

  function updateElemental(patch: Partial<ElementalState>) {
    update("elemental", { ...draft.elemental, ...patch });
  }

  function updateDivine(patch: Partial<DivineState>) {
    update("divine", { ...draft.divine, ...patch });
  }

  function toggleClassAbility(name: string, checked: boolean) {
    const selected = draft.classAbilities.includes(name);
    if (checked && !selected && draft.classAbilities.length < abilityLimit) {
      update("classAbilities", [...draft.classAbilities, name]);
    } else if (!checked && selected) {
      update(
        "classAbilities",
        draft.classAbilities.filter((ability) => ability !== name),
      );
    }
  }

  function toggleAmplification(name: string, checked: boolean) {
    const selected = draft.classAmplifications.includes(name);
    const abilityName = name.split(" — ")[0];
    const abilityAlreadyAmplified = draft.classAmplifications.some(
      (item) => item !== name && item.startsWith(`${abilityName} —`),
    );
    if (
      checked &&
      !selected &&
      !abilityAlreadyAmplified &&
      draft.classAmplifications.length < amplificationLimit
    ) {
      update("classAmplifications", [...draft.classAmplifications, name]);
    } else if (!checked && selected) {
      update(
        "classAmplifications",
        draft.classAmplifications.filter((amplification) => amplification !== name),
      );
    }
  }

  function updateTechnique(id: string, patch: Partial<TechniqueRecord>) {
    update(
      "techniques",
      draft.techniques.map((technique) =>
        technique.id === id ? { ...technique, ...patch } : technique,
      ),
    );
  }

  return (
    <div className="power-editor-layout">
      <div className="power-editor-content">
        <section className="power-section" id="poder-raca-classe">
          <SectionHeading icon={ShieldCheck} kicker="Fontes automáticas" title="Raça & classe">
            As características escolhidas no primeiro capítulo aparecem aqui sem
            precisar copiá-las. Escolha as habilidades liberadas pela etapa atual.
          </SectionHeading>

          <div className="power-source-grid">
            <article className="power-source-card">
              <div className="power-card-title">
                <div>
                  <small>Raça escolhida</small>
                  <h3>{race?.name ?? "Escolha uma raça na Essência"}</h3>
                </div>
                {race ? <Badge variant="outline">automática</Badge> : null}
              </div>
              {race ? (
                <>
                  <p className="power-rule-summary">{race.summary}</p>
                  <div className="feature-list">
                    {race.features.map((feature) => (
                      <div className="feature-entry" data-kind={feature.kind} key={feature.name}>
                        <span>{feature.kind}</span>
                        <strong>{feature.name}</strong>
                        <p>{feature.description}</p>
                      </div>
                    ))}
                  </div>
                  {race.customizationLabel ? (
                    <TextField
                      id="race-customization"
                      label={race.customizationLabel}
                      value={draft.racialCustomization}
                      placeholder={race.customizationPlaceholder}
                      multiline
                      wide
                      onChange={(value) => update("racialCustomization", value)}
                    />
                  ) : null}
                </>
              ) : (
                <p className="empty-power-copy">Volte à etapa 1 para definir a herança racial.</p>
              )}
            </article>

            <article className="power-source-card">
              <div className="power-card-title">
                <div>
                  <small>Classe primordial</small>
                  <h3>{classDefinition?.name ?? "Escolha uma classe na Essência"}</h3>
                </div>
                {classDefinition ? (
                  <Badge variant="outline">
                    {draft.classAbilities.length}/{abilityLimit} escolhidas
                  </Badge>
                ) : null}
              </div>
              {classDefinition ? (
                <>
                  <div className="class-trait-card">
                    <Badge>Traço de classe</Badge>
                    <strong>{classDefinition.trait.name}</strong>
                    <p>{classDefinition.trait.description}</p>
                  </div>
                  <div className="ability-choice-list">
                    {classDefinition.abilities.map((ability) => {
                      const selected = draft.classAbilities.includes(ability.name);
                      const atLimit = !selected && draft.classAbilities.length >= abilityLimit;
                      return (
                        <label className="ability-choice" data-selected={selected} key={ability.name}>
                          <Checkbox
                            checked={selected}
                            disabled={atLimit}
                            onCheckedChange={(checked) =>
                              toggleClassAbility(ability.name, checked === true)
                            }
                            aria-label={`Escolher ${ability.name}`}
                          />
                          <span>
                            <strong>{ability.name}</strong>
                            <small>{ability.usage}</small>
                            <p>{ability.effect}</p>
                          </span>
                        </label>
                      );
                    })}
                  </div>
                  <p className="selection-rule">
                    Na {draft.stage}, a classe libera {abilityLimit} de suas 3 habilidades.
                    As demais continuam visíveis para planejar a progressão.
                  </p>

                  {classDefinition.amplifications.length ? (
                    <div className="amplification-block">
                      <div className="subsection-title">
                        <Zap aria-hidden="true" />
                        <div>
                          <h4>Amplificações</h4>
                          <p>
                            {amplificationLimit
                              ? `Escolha até ${amplificationLimit} na etapa atual.`
                              : "Disponíveis a partir da Etapa VI."}
                          </p>
                        </div>
                      </div>
                      <div className="ability-choice-list compact">
                        {classDefinition.amplifications.map((amplification) => {
                          const id = `${amplification.abilityName} — ${amplification.name}`;
                          const selected = draft.classAmplifications.includes(id);
                          const abilityAlreadyAmplified = draft.classAmplifications.some(
                            (item) =>
                              item !== id &&
                              item.startsWith(`${amplification.abilityName} —`),
                          );
                          const atLimit =
                            !selected &&
                            (draft.classAmplifications.length >= amplificationLimit ||
                              abilityAlreadyAmplified);
                          return (
                            <label className="ability-choice" data-selected={selected} key={id}>
                              <Checkbox
                                checked={selected}
                                disabled={!amplificationLimit || atLimit}
                                onCheckedChange={(checked) =>
                                  toggleAmplification(id, checked === true)
                                }
                                aria-label={`Escolher amplificação ${amplification.name}`}
                              />
                              <span>
                                <strong>{amplification.name}</strong>
                                <small>{amplification.abilityName}</small>
                                <p>{amplification.description}</p>
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}
                </>
              ) : (
                <p className="empty-power-copy">Volte à etapa 1 para definir a classe.</p>
              )}
            </article>
          </div>
        </section>

        <section className="power-section" id="poder-dominios">
          <SectionHeading icon={CircleDot} kicker="Atributo em ápice" title="Domínios & Caminho Pessoal">
            Ative somente os Domínios conquistados. A ficha confere o Atributo regente e
            incorpora automaticamente as Essências de Velocidade e Resistência aos números.
          </SectionHeading>

          <div className="domain-grid">
            {draft.domains.map((domain) => {
              const rule = DOMAIN_RULES[domain.name];
              const regent = getDomainRegentAttribute(domain.name);
              const regentValue = regent
                ? getFinalAttribute(draft, automatic, regent)
                : Math.max(
                    getFinalAttribute(draft, automatic, "Presença"),
                    getFinalAttribute(draft, automatic, "Espírito"),
                  );
              const eligible = regentValue >= 5;
              return (
                <article className="domain-card" data-enabled={domain.enabled} key={domain.name}>
                  <div className="toggle-heading">
                    <div>
                      <small>{rule.regent}</small>
                      <h3>Domínio da {domain.name}</h3>
                    </div>
                    <Switch
                      checked={domain.enabled}
                      onCheckedChange={(enabled) => updateDomain(domain.name, { enabled })}
                      aria-label={`Ativar Domínio da ${domain.name}`}
                    />
                  </div>
                  <div className="eligibility-line" data-valid={eligible}>
                    <span>{eligible ? "Requisito alcançado" : "Requisito pendente"}</span>
                    <strong>{regentValue}/5</strong>
                  </div>
                  {domain.enabled ? (
                    <>
                      <div className="domain-mark-control">
                        <span>
                          <strong>{domain.marks}</strong>
                          <small>Marcas</small>
                        </span>
                        <Slider
                          min={0}
                          max={3}
                          step={1}
                          value={[domain.marks]}
                          onValueChange={(values) =>
                            updateDomain(domain.name, { marks: values[0] ?? 0 })
                          }
                          aria-label={`Marcas do Domínio da ${domain.name}`}
                        />
                      </div>
                      <label className="inline-toggle">
                        <Switch
                          checked={domain.awakened}
                          onCheckedChange={(awakened) =>
                            updateDomain(domain.name, { awakened })
                          }
                        />
                        <span>
                          <strong>Essência despertada</strong>
                          <small>{rule.essence}</small>
                        </span>
                      </label>
                      <div className="domain-rules">
                        <p><strong>Manifestação:</strong> {rule.manifestation}</p>
                        <p><strong>Fissura:</strong> {rule.fissure}</p>
                      </div>
                      <div className="refinement-picker">
                        <span>Refinamentos — até 2</span>
                        <div>
                          {[0,1].map(index => <NativeSelect key={index} aria-label={`Refinamento ${index+1} de ${domain.name}`} value={domain.refinements[index] ?? ""} onChange={event => { const refinements=[...domain.refinements]; refinements[index]=event.target.value; updateDomain(domain.name,{refinements:refinements.filter(Boolean)}); }}><NativeSelectOption value="">Sem refinamento</NativeSelectOption>{REFINEMENTS.map(value=><NativeSelectOption key={value} value={value}>{value}</NativeSelectOption>)}</NativeSelect>)}

                        </div>
                      </div>
                      <TextField
                        id={`domain-signal-${domain.name}`}
                        label="Sinal da Manifestação"
                        value={domain.signal}
                        placeholder="Como o Domínio se torna visível em cena?"
                        onChange={(signal) => updateDomain(domain.name, { signal })}
                      />
                      <TextField
                        id={`domain-notes-${domain.name}`}
                        label="Notas e escolhas fixadas"
                        value={domain.notes}
                        multiline
                        onChange={(notes) => updateDomain(domain.name, { notes })}
                      />
                    </>
                  ) : null}
                </article>
              );
            })}
          </div>

          <article className="personal-path-card" data-enabled={draft.personalPath.enabled}>
            <div className="toggle-heading">
              <div>
                <small>Progressão singular</small>
                <h3>Caminho Pessoal</h3>
              </div>
              <Switch
                checked={draft.personalPath.enabled}
                onCheckedChange={(enabled) =>
                  update("personalPath", { ...draft.personalPath, enabled })
                }
                aria-label="Ativar Caminho Pessoal"
              />
            </div>
            {draft.personalPath.enabled ? (
              <div className="character-form-grid two-columns compact-form">
                <TextField
                  id="personal-path-name"
                  label="Nome do Caminho"
                  value={draft.personalPath.name}
                  onChange={(name) => update("personalPath", { ...draft.personalPath, name })}
                />
                <TextField
                  id="personal-path-technique"
                  label="Técnica de assinatura"
                  value={draft.personalPath.signatureTechnique}
                  onChange={(signatureTechnique) =>
                    update("personalPath", { ...draft.personalPath, signatureTechnique })
                  }
                />
                <p className="field-full">Exige Técnica de Assinatura, um Domínio com dois Refinamentos e arco de Confronto, Escolha e Resposta. Imposição: Extra, 8 Karma, uma vez por cena; manutenção 1 Karma por turno.</p>
                <TextField id="personal-path-rupture" label="Afirmação — resolução, alvos e limites" value={draft.personalPath.rupture} multiline wide onChange={(rupture)=>update("personalPath",{...draft.personalPath,rupture})}/>
                <TextField id="personal-path-price" label="Culminação — efeito, preço e encerramento" value={draft.personalPath.price} multiline wide onChange={(price)=>update("personalPath",{...draft.personalPath,price})}/>
                <TextField
                  id="personal-path-principle"
                  label="Lei pessoal — intenções, fronteira, oposição e regente"
                  value={draft.personalPath.principle}
                  multiline
                  wide
                  onChange={(principle) =>
                    update("personalPath", { ...draft.personalPath, principle })
                  }
                />
              </div>
            ) : null}
          </article>
        </section>

        <section className="power-section" id="poder-elemental">
          <SectionHeading icon={Flame} kicker="Dobra e manifestação" title="Poder elemental & subdobras">
            Registre afinidade, elementos efetivamente controlados, domínio atual e cada
            subdobra autorizada. Afinidade por si só não concede uma técnica.
          </SectionHeading>

          <div className="character-form-grid two-columns compact-form">
            <div className="character-field">
              <Label htmlFor="elemental-affinity" className="character-label">Afinidade latente</Label>
              <NativeSelect
                id="elemental-affinity"
                value={draft.affinity}
                onChange={(event) => update("affinity", event.target.value)}
              >
                {AFFINITIES.map((affinity) => (
                  <NativeSelectOption key={affinity} value={affinity}>{affinity}</NativeSelectOption>
                ))}
              </NativeSelect>
            </div>
            <p>Registre o treinamento de cada elemento separadamente na página de Perícias. Controle 1: Graus I–II; Etapa III: Grau III; Etapa V e Controle 2: Grau IV; Etapa VII e Controle 3: Grau V. Afinidade não treina outro elemento.</p>
            <div className="element-picker field-full">
              <span>Elementos controlados</span>
              <div>
                {ELEMENTS.map((element) => {
                  const checked = draft.elemental.controlledElements.includes(element);
                  return (
                    <label data-selected={checked} key={element}>
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(value) =>
                          updateElemental({
                            controlledElements:
                              value === true
                                ? [...draft.elemental.controlledElements, element]
                                : draft.elemental.controlledElements.filter((item) => item !== element),
                          })
                        }
                      />
                      {element}
                    </label>
                  );
                })}
              </div>
            </div>
            <TextField
              id="elemental-manifestation"
              label="Manifestação visual"
              value={draft.elemental.manifestation}
              multiline
              onChange={(manifestation) => updateElemental({ manifestation })}
            />
            <TextField
              id="elemental-passive"
              label="Passiva elemental"
              value={draft.elemental.passive}
              multiline
              onChange={(passive) => updateElemental({ passive })}
            />
            <TextField
              id="elemental-notes"
              label="Limites, fontes e observações"
              value={draft.elemental.notes}
              multiline
              wide
              onChange={(notes) => {
                updateElemental({ notes });
              }}
            />
          </div>

          <div className="dynamic-list-heading">
            <div>
              <h3>Subdobras</h3>
              <p>Cada derivação mantém elemento de origem, conceito, passiva e limites próprios.</p>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                updateElemental({
                  subBendings: [
                    ...draft.elemental.subBendings,
                    {
                      id: crypto.randomUUID(),
                      name: "",
                      parentElement: "",
                      concept: "",
                      passive: "",
                      limits: "",
                    },
                  ],
                })
              }
            >
              <Plus aria-hidden="true" /> Adicionar subdobra
            </Button>
          </div>
          <div className="dynamic-card-list">
            {draft.elemental.subBendings.map((subBending, index) => (
              <article className="dynamic-editor-card" key={subBending.id}>
                <header>
                  <span>Subdobra {String(index + 1).padStart(2, "0")}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Remover subdobra ${index + 1}`}
                    onClick={() =>
                      updateElemental({
                        subBendings: draft.elemental.subBendings.filter(
                          (item) => item.id !== subBending.id,
                        ),
                      })
                    }
                  >
                    <Trash2 aria-hidden="true" />
                  </Button>
                </header>
                <div className="character-form-grid two-columns compact-form">
                  <TextField
                    id={`sub-bending-name-${subBending.id}`}
                    label="Nome"
                    value={subBending.name}
                    onChange={(name) =>
                      updateElemental({
                        subBendings: draft.elemental.subBendings.map((item) =>
                          item.id === subBending.id ? { ...item, name } : item,
                        ),
                      })
                    }
                  />
                  <div className="character-field">
                    <Label htmlFor={`sub-bending-parent-${subBending.id}`} className="character-label">
                      Elemento de origem
                    </Label>
                    <NativeSelect
                      id={`sub-bending-parent-${subBending.id}`}
                      value={subBending.parentElement}
                      onChange={(event) =>
                        updateElemental({
                          subBendings: draft.elemental.subBendings.map((item) =>
                            item.id === subBending.id
                              ? { ...item, parentElement: event.target.value }
                              : item,
                          ),
                        })
                      }
                    >
                      <NativeSelectOption value="">Escolha</NativeSelectOption>
                      {ELEMENTS.map((element) => (
                        <NativeSelectOption value={element} key={element}>{element}</NativeSelectOption>
                      ))}
                    </NativeSelect>
                  </div>
                  {(["concept", "passive", "limits"] as const).map((field) => (
                    <TextField
                      id={`sub-bending-${field}-${subBending.id}`}
                      label={{ concept: "Conceito", passive: "Passiva", limits: "Limites" }[field]}
                      value={subBending[field]}
                      multiline
                      wide={field === "limits"}
                      key={field}
                      onChange={(value) =>
                        updateElemental({
                          subBendings: draft.elemental.subBendings.map((item) =>
                            item.id === subBending.id ? { ...item, [field]: value } : item,
                          ),
                        })
                      }
                    />
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="power-section corruption-section" id="poder-corrupcao">
          <SectionHeading icon={Skull} kicker="A Marca e a Voz" title="Corrupção">
            A Carga representa pressão narrativa, não um recurso de compra. Registre a
            Marca, sua promessa, os sinais e as consequências que já entraram em jogo.
          </SectionHeading>

          <div className="system-activation-card" data-enabled={draft.corruption.enabled}>
            <div className="toggle-heading">
              <div>
                <small>Fonte opcional</small>
                <h3>Personagem marcado pela Corrupção</h3>
              </div>
              <Switch
                checked={draft.corruption.enabled}
                onCheckedChange={(enabled) =>
                  update("corruption", { ...draft.corruption, enabled })
                }
                aria-label="Ativar Corrupção"
              />
            </div>
            {draft.corruption.enabled ? (
              <>
                <div className="range-field corruption-range">
                  <span>
                    <Label>Carga atual</Label>
                    <strong>{draft.corruption.charge}/10</strong>
                  </span>
                  <Slider
                    min={0}
                    max={10}
                    step={1}
                    value={[draft.corruption.charge]}
                    onValueChange={(values) =>
                      update("corruption", {
                        ...draft.corruption,
                        charge: values[0] ?? 0,
                        ...((values[0]??0)>=10?{formActive:false,formBlocked:true}:{}),
                      })
                    }
                    aria-label="Carga de Corrupção"
                  />
                </div>
                <div className="character-form-grid two-columns compact-form">
                  <TextField
                    id="corruption-mark"
                    label="Nome ou título da Marca"
                    value={draft.corruption.markName}
                    onChange={(markName) =>
                      update("corruption", { ...draft.corruption, markName })
                    }
                  />
                  <TextField
                    id="corruption-sign"
                    label="Sinal visível"
                    value={draft.corruption.visibleSign}
                    onChange={(visibleSign) =>
                      update("corruption", { ...draft.corruption, visibleSign })
                    }
                  />
                  {([
                    ["voicePromise", "Promessa da Voz"],
                    ["mutation", "Mutação"],
                    ["fissure", "Fissura"],
                    ["formFunction", "Função da Forma corrompida"],
                    ["formLimitation", "Limitação da Forma"],
                    ["ruptureIntent", "Intenção da Ruptura"],
                  ] as const).map(([field, label]) => (
                    <TextField
                      id={`corruption-${field}`}
                      label={label}
                      value={draft.corruption[field]}
                      multiline
                      onChange={(value) =>
                        update("corruption", { ...draft.corruption, [field]: value })
                      }
                      key={field}
                    />
                  ))}
                </div>
                <CorruptedFormEditor draft={draft} onChange={onChange}/>
              </>
            ) : (
              <p className="empty-power-copy">Ative apenas se a personagem tiver recebido a Marca.</p>
            )}
          </div>
        </section>

        <section className="power-section divine-section" id="poder-divino">
          <SectionHeading icon={Landmark} kicker="Bênção e comunhão" title="Poder divino">
            Estruture Bênção, Comunhão Divina ou ambas: autoridade, divindade, limites,
            Favor, liturgias e milagres ficam reunidos no mesmo registro.
          </SectionHeading>

          <div className="system-activation-card" data-enabled={draft.divine.enabled}>
            <div className="toggle-heading">
              <div>
                <small>Fonte opcional</small>
                <h3>Vínculo com o divino</h3>
              </div>
              <Switch
                checked={draft.divine.enabled}
                onCheckedChange={(enabled) => updateDivine({ enabled })}
                aria-label="Ativar poder divino"
              />
            </div>
            {draft.divine.enabled ? (
              <div className="character-form-grid two-columns compact-form">
                <div className="character-field">
                  <Label htmlFor="divine-expression" className="character-label">Expressão</Label>
                  <NativeSelect
                    id="divine-expression"
                    value={draft.divine.expression}
                    onChange={(event) => updateDivine({ expression: event.target.value })}
                  >
                    {["Bênção", "Comunhão Divina", "Bênção + Comunhão Divina"].map((option) => (
                      <NativeSelectOption key={option} value={option}>{option}</NativeSelectOption>
                    ))}
                  </NativeSelect>
                </div>
                <TextField
                  id="divine-blessing-name"
                  label="Nome da Bênção"
                  value={draft.divine.blessingName}
                  onChange={(blessingName) => updateDivine({ blessingName })}
                />
                <div className="character-field">
                  <Label htmlFor="divine-regent" className="character-label">Regente da Bênção (não da Comunhão)</Label>
                  <NativeSelect
                    id="divine-regent"
                    value={draft.divine.regentAttribute}
                    onChange={(event) => updateDivine({ regentAttribute: event.target.value })}
                  >
                    <NativeSelectOption value="">Escolha</NativeSelectOption>
                    {ATTRIBUTES.map((attribute) => (
                      <NativeSelectOption value={attribute} key={attribute}>{attribute}</NativeSelectOption>
                    ))}
                  </NativeSelect>
                  <small>Comunhão Divina sempre usa Presença {getFinalAttribute(draft, automatic, "Presença")}, independentemente do regente da Bênção.</small>
                </div>
                <div className="character-field">
                  <Label htmlFor="divine-pantheon" className="character-label">Panteão / Asa</Label>
                  <NativeSelect
                    id="divine-pantheon"
                    value={draft.divine.pantheon}
                    onChange={(event) => updateDivine({ pantheon: event.target.value })}
                  >
                    <NativeSelectOption value="">Escolha o panteão</NativeSelectOption>
                    {PANTHEONS.map((pantheon) => (
                      <NativeSelectOption value={pantheon} key={pantheon}>{pantheon}</NativeSelectOption>
                    ))}
                  </NativeSelect>
                </div>
                <TextField id="divine-deity" label="Divindade" value={draft.divine.deity} onChange={(deity) => updateDivine({ deity })} />
                <TextField id="divine-jurisdictions" label="Jurisdições" value={draft.divine.jurisdictions} onChange={(jurisdictions) => updateDivine({ jurisdictions })} />
                <div className="range-field">
                  <span><Label>Favor</Label><strong>{draft.divine.favor}/3</strong></span>
                  <Slider min={0} max={3} step={1} value={[draft.divine.favor]} onValueChange={(values) => updateDivine({ favor: values[0] ?? 0 })} aria-label="Favor divino" />
                </div>
                <div className="range-field">
                  <span><Label>Nível de poder</Label><strong>{draft.divine.powerLevel}/5</strong></span>
                  <Slider min={0} max={5} step={1} value={[draft.divine.powerLevel]} onValueChange={(values) => updateDivine({ powerLevel: values[0] ?? 0 })} aria-label="Nível de poder divino" />
                </div>
                {([
                  ["core", "Núcleo da Bênção"],
                  ["initialGift", "Dádiva inicial"],
                  ["essentialLimits", "Limites essenciais"],
                  ["precept", "Preceito"],
                  ["profanation", "Profanação"],
                  ["liturgies", "Liturgias conhecidas"],
                  ["miracles", "Milagres registrados"],
                ] as const).map(([field, label]) => (
                  <TextField
                    id={`divine-${field}`}
                    label={label}
                    value={draft.divine[field]}
                    multiline
                    wide={field === "liturgies" || field === "miracles"}
                    onChange={(value) => updateDivine({ [field]: value })}
                    key={field}
                  />
                ))}
              </div>
            ) : (
              <p className="empty-power-copy">Ative para registrar uma Bênção ou Comunhão Divina.</p>
            )}
          </div>
        </section>

        <InvocationEditor draft={draft} onChange={onChange} />

        <VowEditor draft={draft} automatic={automatic} onChange={onChange} />

        <section className="power-section" id="poder-tecnicas">
          <SectionHeading icon={Swords} kicker="Registro mecânico" title="Criação de técnicas">
            Registre cada técnica por completo: fonte, teste, ação, custo, alcance,
            resultados e limites. A página final exibirá exatamente o que for consolidado aqui.
          </SectionHeading>

          <div className="dynamic-list-heading">
            <div>
              <h3>Técnicas registradas</h3>
              <p>{draft.techniques.length} técnica(s) na ficha.</p>
            </div>
            <Button
              type="button"
              className="karma-button"
              onClick={() => update("techniques", [...draft.techniques, createTechnique()])}
            >
              <Plus aria-hidden="true" /> Nova técnica
            </Button>
          </div>

          <div className="dynamic-card-list techniques-list">
            {draft.techniques.length ? (
              draft.techniques.map((technique, index) => (
                <article className="dynamic-editor-card technique-editor-card" key={technique.id}>
                  <header>
                    <span>Técnica {String(index + 1).padStart(2, "0")}</span>
                    <div>
                      <label className="signature-toggle">
                        <Checkbox
                          checked={technique.signature}
                          onCheckedChange={(checked) =>
                            updateTechnique(technique.id, { signature: checked === true })
                          }
                        />
                        Assinatura
                      </label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Remover técnica ${index + 1}`}
                        onClick={() =>
                          update(
                            "techniques",
                            draft.techniques.filter((item) => item.id !== technique.id),
                          )
                        }
                      >
                        <Trash2 aria-hidden="true" />
                      </Button>
                    </div>
                  </header>
                  <div className="character-form-grid two-columns compact-form">
                    <TextField id={`technique-name-${technique.id}`} label="Nome" value={technique.name} onChange={(name) => updateTechnique(technique.id, { name })} />
                    <TextField id={`technique-source-${technique.id}`} label="Fonte" value={technique.source} placeholder="Classe, elemento, bênção, Marca…" onChange={(source) => updateTechnique(technique.id, { source })} />
                    <div className="character-field">
                      <Label htmlFor={`technique-attribute-${technique.id}`} className="character-label">Atributo</Label>
                      <NativeSelect id={`technique-attribute-${technique.id}`} value={PRESENCE_SKILLS.includes(technique.skill) ? "Presença" : technique.attribute} disabled={PRESENCE_SKILLS.includes(technique.skill)} onChange={(event) => updateTechnique(technique.id, { attribute: event.target.value })}>
                        <NativeSelectOption value="">Escolha</NativeSelectOption>
                        {ATTRIBUTES.map((attribute) => <NativeSelectOption value={attribute} key={attribute}>{attribute}</NativeSelectOption>)}
                      </NativeSelect>
                    </div>
                    <div className="character-field">
                      <Label htmlFor={`technique-skill-${technique.id}`} className="character-label">Perícia</Label>
                      <NativeSelect id={`technique-skill-${technique.id}`} value={technique.skill} onChange={(event) => updateTechnique(technique.id, { skill: event.target.value, ...(PRESENCE_SKILLS.includes(event.target.value) ? { attribute: "Presença" } : {}) })}>
                        <NativeSelectOption value="">Escolha</NativeSelectOption>
                        {ALL_SKILLS.map((skill) => <NativeSelectOption value={skill} key={skill}>{skill}</NativeSelectOption>)}
                        <NativeSelectOption value="Conjuração Vincular">Conjuração Vincular (uso de Conjuração)</NativeSelectOption>
                      </NativeSelect>
                      {technique.skill === "Conjuração Vincular" ? <small>Usa o nível de Conjuração, mas exige Presença como regente.</small> : technique.skill === "Conjuração" ? <small>Conjuração comum: escolha o regente conforme a abordagem ou técnica; Espírito para contenção.</small> : null}
                    </div>
                    <div className="character-field">
                      <Label htmlFor={`technique-grade-${technique.id}`} className="character-label">Grau</Label>
                      <NativeSelect id={`technique-grade-${technique.id}`} value={technique.grade} onChange={(event) => updateTechnique(technique.id, { grade: event.target.value })}>
                        {["Comum", "Evolutiva", "Transcendental"].map((grade) => <NativeSelectOption value={grade} key={grade}>{grade}</NativeSelectOption>)}
                      </NativeSelect>
                    </div>
                    <div className="character-field">
                      <Label htmlFor={`technique-action-${technique.id}`} className="character-label">Ação</Label>
                      <NativeSelect id={`technique-action-${technique.id}`} value={technique.action} onChange={(event) => updateTechnique(technique.id, { action: event.target.value })}>
                        {["Ação Principal", "Ação de Movimento", "Ação Extra", "Ação Livre", "Reação", "Passiva", "Ritual"].map((action) => <NativeSelectOption value={action} key={action}>{action}</NativeSelectOption>)}
                      </NativeSelect>
                    </div>
                    {([
                      ["concept", "Conceito"],
                      ["range", "Alcance"],
                      ["targetAreaDuration", "Alvo, área e duração"],
                      ["cost", "Custo"],
                      ["calculation", "Cálculo / dano / cura"],
                      ["test", "Teste e oposição"],
                      ["totalSuccess", "Sucesso total"],
                      ["partialSuccess", "Sucesso parcial"],
                      ["failure", "Falha"],
                      ["limits", "Limites e condições"],
                    ] as const).map(([field, label]) => (
                      <TextField
                        id={`technique-${field}-${technique.id}`}
                        label={label}
                        value={technique[field]}
                        multiline={field !== "range"}
                        wide={["concept", "totalSuccess", "partialSuccess", "failure", "limits"].includes(field)}
                        onChange={(value) => updateTechnique(technique.id, { [field]: value })}
                        key={field}
                      />
                    ))}
                  </div>
                </article>
              ))
            ) : (
              <div className="empty-dynamic-state">
                <BookOpen aria-hidden="true" />
                <strong>Nenhuma técnica registrada.</strong>
                <p>Adicione somente técnicas aprovadas para esta personagem.</p>
              </div>
            )}
          </div>

          <div className="character-field campaign-notes-field">
            <Label htmlFor="character-notes" className="character-label">Notas de campanha</Label>
            <Textarea
              id="character-notes"
              value={draft.notes}
              maxLength={8000}
              rows={8}
              placeholder="História, aparência, contatos, compromissos e lembretes que devem aparecer na ficha final."
              onChange={(event) => update("notes", event.target.value)}
            />
          </div>
        </section>
      </div>

      <nav className="power-topic-nav" aria-label="Tópicos da página de poderes">
        <span>Nesta página</span>
        {POWER_TOPICS.map(([id, label], index) => (
          <a href={`#${id}`} key={id}>
            <small>{String(index + 1).padStart(2, "0")}</small>
            {label}
          </a>
        ))}
      </nav>
    </div>
  );
}
