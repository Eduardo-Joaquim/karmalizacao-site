"use client";
import { TechniqueCost } from "@/components/technique-cost";
import { CorruptedFormEditor } from "@/components/corrupted-form-editor";
import { InventoryManager } from "@/components/inventory-manager";

import {
  Backpack,
  BookOpen,
  CircleDot,
  Flame,
  Ghost,
  Heart,
  Landmark,
  Package,
  Plus,
  Shield,
  Skull,
  Sparkles,
  Trash2,
  UserRound,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  ATTRIBUTES,
  SKILL_GROUPS,
  type CharacterPayload,
} from "@/lib/character-data";
import {
  DOMAIN_RULES,
  getClassDefinition,
  getFinalAttribute,
  getFinalSkill,
  getRaceRule,
  getSkillTest,
  getSacrificedPoints,
  VOW_WEIGHTS,
  type AutomaticBonuses,
} from "@/lib/character-rules";
import { calculateInvocationStats } from "@/lib/invocation-rules";
import { hasElementalContent, hasInvocationContent, hasSheetText, hasSubBendingContent, hasTechniqueContent } from "@/lib/sheet-visibility";

export type DerivedStats = {
  life: number;
  karma: number;
  armor: number;
  movement: number;
  load: number;
  resistance: number;
};

type CharacterSheetViewProps = {
  draft: CharacterPayload;
  automatic: AutomaticBonuses;
  derived: DerivedStats;
  onChange?: (next: CharacterPayload) => void;
  readOnly?: boolean;
};

function ReadonlyValue({ label, children }: { label: string; children?: React.ReactNode }) {
  const hasValue = typeof children === "string" ? hasSheetText(children) : children !== undefined && children !== null;
  if (!hasValue) return null;
  return (
    <div className="sheet-readonly-value">
      <span>{label}</span>
      <strong>{children}</strong>
    </div>
  );
}

function SheetSection({
  id,
  icon: Icon,
  title,
  description,
  children,
}: {
  id?: string;
  icon: typeof UserRound;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="sheet-section" id={id}>
      <header>
        <Icon aria-hidden="true" />
        <div>
          <h2>{title}</h2>
          {description ? <p>{description}</p> : null}
        </div>
      </header>
      {children}
    </section>
  );
}

export function CharacterSheetView({
  draft,
  automatic,
  derived,
  onChange,
  readOnly = false,
}: CharacterSheetViewProps) {
  const race = getRaceRule(draft.race);
  const classDefinition = getClassDefinition(draft.className);
  const activeDomains = draft.domains.filter((domain) => domain.enabled);
  const visibleInvocations = draft.invocations.filter(hasInvocationContent);
  return (
    <div className="character-sheet-view">
      <header className="sheet-cover">
        {draft.portraitImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="sheet-portrait" src={draft.portraitImage} alt={`Retrato de ${draft.name || "personagem"}`} />
        ) : <div className="sheet-monogram" aria-hidden="true">{(draft.name || "K").slice(0, 1).toUpperCase()}</div>}
        <div className="sheet-cover-copy">
          <small>Registro consolidado</small>
          <h1>{draft.name || "Personagem sem nome"}</h1>
            {hasSheetText(draft.concept) ? <p>{draft.concept}</p> : null}
          <div>
            {[draft.race, draft.className, draft.stage].filter(Boolean).map((value) => (
              <Badge variant="outline" key={value}>{value}</Badge>
            ))}
          </div>
        </div>
        <div className="sheet-lock-note">
          <Shield aria-hidden="true" />
          <span>
            <strong>{readOnly ? "Visualização compartilhada" : "Ficha protegida"}</strong>
            {readOnly ? "Este link permite consultar a ficha, nunca editá-la." : "Esta página é somente leitura. Apenas o inventário pode ser alterado aqui."}
          </span>
        </div>
      </header>

      <div className="sheet-stat-grid" aria-label="Valores derivados">
        {[
          [Heart, "Vida", derived.life, "life"],
          [Sparkles, "Karma", derived.karma, "karma"],
          [Shield, "CA", derived.armor, "armor"],
          [CircleDot, "Movimento", `${derived.movement}m`, "move"],
          [Package, "Carga", derived.load, "load"],
          [Shield, "Resistência", derived.resistance, "resistance"],
        ].filter(([, label, value]) => label !== "Resistência" || Number(value) > 0).map(([Icon, label, value, tone]) => {
          const StatIcon = Icon as typeof Heart;
          return (
            <div className="sheet-stat" data-tone={tone} key={String(label)}>
              <StatIcon aria-hidden="true" />
              <span>{String(label)}</span>
              <strong>{String(value)}</strong>
            </div>
          );
        })}
      </div>

      <SheetSection icon={UserRound} title="Essência e identidade">
        <div className="sheet-readonly-grid">
          <ReadonlyValue label="Nome">{draft.name}</ReadonlyValue>
          <ReadonlyValue label="Pronomes">{draft.pronouns}</ReadonlyValue>
          <ReadonlyValue label="Tamanho">{draft.size}</ReadonlyValue>
          <ReadonlyValue label="Altura">{draft.heightCm === null ? null : `${draft.heightCm} cm`}</ReadonlyValue>
          <ReadonlyValue label="Origem">{draft.origin}</ReadonlyValue>
          <ReadonlyValue label="Raça">{draft.race}</ReadonlyValue>
          <ReadonlyValue label="Classe primordial">{draft.className}</ReadonlyValue>
          <ReadonlyValue label="Caminho">{draft.path}</ReadonlyValue>
          <ReadonlyValue label="Etapa">{draft.stage}</ReadonlyValue>
          <ReadonlyValue label="Idioma comum">{draft.commonLanguage}</ReadonlyValue>
          <ReadonlyValue label="Afinidade">{draft.affinity}</ReadonlyValue>
          <ReadonlyValue label="Vínculo">{draft.bond}</ReadonlyValue>
          <ReadonlyValue label="Conceito">{draft.concept}</ReadonlyValue>
          {race?.customizationLabel ? (
            <ReadonlyValue label={race.customizationLabel}>{draft.racialCustomization}</ReadonlyValue>
          ) : null}
        </div>
      </SheetSection>

      <SheetSection icon={Shield} title="Atributos">
        <div className="sheet-attribute-grid">
          {ATTRIBUTES.map((attribute) => {
            const points = draft.attributes[attribute];
            const automaticBonus = automatic.attributes[attribute];
            const total = getFinalAttribute(draft, automatic, attribute);
            return (
              <article key={attribute}>
                <small>{attribute.slice(0, 3).toUpperCase()}</small>
                <h3>{attribute}</h3>
                <strong>{total}</strong>
                <span>
                  {points.base} base
                  {automaticBonus ? ` · +${automaticBonus} automático` : ""}
                  {points.bonus ? ` · +${points.bonus} ajuste` : ""}
                </span>
              </article>
            );
          })}
        </div>
      </SheetSection>

      {SKILL_GROUPS.some((group) => group.skills.some((skill) => getFinalSkill(draft, automatic, skill) > 0)) ? <SheetSection icon={BookOpen} title="Perícias">
        <div className="sheet-skill-groups">
          {SKILL_GROUPS.filter((group) => group.skills.some((skill) => getFinalSkill(draft, automatic, skill) > 0)).map((group) => (
            <article key={group.name}>
              <h3>{group.name}</h3>
              <div>
                {group.skills.filter((skill) => getFinalSkill(draft, automatic, skill) > 0).map((skill) => {
                  const total = getFinalSkill(draft, automatic, skill);
                  const test = getSkillTest(draft, automatic, skill);
                  return (
                    <div key={skill} data-trained={total > 0}>
                      <span>{skill}</span>
                      <strong>{total}</strong>
                      <small>+{([0, 2, 5, 10][total] ?? 0)}{test.analyticBonus ? ` · análise +${test.analyticBonus}` : ""}</small>
                    </div>
                  );
                })}
              </div>
            </article>
          ))}
        </div>
      </SheetSection> : null}

      {race || classDefinition ? <SheetSection icon={Shield} title="Raça, classe e habilidades">
        <div className="sheet-feature-columns">
          {race ? <article>
            <div className="sheet-subheading">
              <span>Raça</span>
              <h3>{race?.name ?? "Não escolhida"}</h3>
            </div>
            {race?.features.length ? (
              <div className="sheet-ability-list">
                {race.features.map((feature) => (
                  <div key={feature.name}>
                    <Badge variant="outline">{feature.kind}</Badge>
                    <strong>{feature.name}</strong>
                    <p>{feature.description}</p>
                  </div>
                ))}
              </div>
            ) : <p className="sheet-empty">Nenhuma característica racial registrada.</p>}
          </article> : null}
          {classDefinition ? <article>
            <div className="sheet-subheading">
              <span>Classe</span>
              <h3>{classDefinition?.name ?? "Não escolhida"}</h3>
            </div>
            {classDefinition ? (
              <div className="sheet-ability-list">
                <div>
                  <Badge>Traço</Badge>
                  <strong>{classDefinition.trait.name}</strong>
                  <p>{classDefinition.trait.description}</p>
                </div>
                {draft.classAbilities.map((abilityName) => {
                  const ability = classDefinition.abilities.find((item) => item.name === abilityName);
                  return (
                    <div key={abilityName}>
                      <Badge variant="outline">Habilidade</Badge>
                      <strong>{abilityName}</strong>
                      {ability ? <small>{ability.usage}</small> : null}
                      <p>{ability?.effect ?? "Habilidade selecionada para a classe."}</p>
                    </div>
                  );
                })}
                {draft.classAmplifications.map((amplification) => (
                  <div key={amplification}>
                    <Badge variant="outline">Amplificação</Badge>
                    <strong>{amplification}</strong>
                  </div>
                ))}
              </div>
            ) : <p className="sheet-empty">Nenhuma classe registrada.</p>}
          </article> : null}
        </div>
      </SheetSection> : null}

      {activeDomains.length || draft.personalPath.enabled ? <SheetSection icon={CircleDot} title={activeDomains.length && draft.personalPath.enabled ? "Domínios & Caminho Pessoal" : activeDomains.length ? "Domínios" : "Caminho Pessoal"}>
        {activeDomains.length ? (
          <div className="sheet-domain-grid">
            {activeDomains.map((domain) => (
              <article key={domain.name}>
                <div>
                  <small>{DOMAIN_RULES[domain.name].regent}</small>
                  <h3>Domínio da {domain.name}</h3>
                  <Badge variant="outline">{domain.marks} Marca(s)</Badge>
                </div>
                {domain.awakened ? <p><strong>Essência:</strong> {DOMAIN_RULES[domain.name].essence}</p> : null}
                {domain.refinements.some(hasSheetText) ? <p><strong>Refinamentos:</strong> {domain.refinements.filter(hasSheetText).join(", ")}</p> : null}
                {domain.signal ? <p><strong>Sinal:</strong> {domain.signal}</p> : null}
                {domain.notes ? <p><strong>Notas:</strong> {domain.notes}</p> : null}
              </article>
            ))}
          </div>
        ) : null}
        {draft.personalPath.enabled ? (
          <article className="sheet-personal-path">
            <div className="sheet-subheading">
              <span>Caminho Pessoal</span>
              {hasSheetText(draft.personalPath.name) ? <h3>{draft.personalPath.name}</h3> : null}
            </div>
            <div className="sheet-readonly-grid compact">
              <ReadonlyValue label="Técnica de assinatura">{draft.personalPath.signatureTechnique}</ReadonlyValue>
              <ReadonlyValue label="Afirmação">{draft.personalPath.rupture}</ReadonlyValue>
              <ReadonlyValue label="Culminação">{draft.personalPath.price}</ReadonlyValue>
              <ReadonlyValue label="Lei pessoal">{draft.personalPath.principle}</ReadonlyValue>
            </div>
          </article>
        ) : null}
      </SheetSection> : null}

      {hasElementalContent(draft) ? <SheetSection icon={Flame} title="Poder elemental & subdobras">
        <div className="sheet-readonly-grid compact">
          <ReadonlyValue label="Afinidade">{draft.affinity}</ReadonlyValue>
          <ReadonlyValue label="Elementos controlados">{draft.elemental.controlledElements.join(", ")}</ReadonlyValue>
          {draft.elemental.masteryLevel > 0 ? <ReadonlyValue label="Nível de domínio">{draft.elemental.masteryLevel}/5</ReadonlyValue> : null}
          <ReadonlyValue label="Manifestação">{draft.elemental.manifestation}</ReadonlyValue>
          <ReadonlyValue label="Passiva">{draft.elemental.passive}</ReadonlyValue>
          <ReadonlyValue label="Limites e notas">{draft.elemental.notes}</ReadonlyValue>
        </div>
        {draft.elemental.subBendings.length ? (
          <div className="sheet-record-grid">
            {draft.elemental.subBendings.filter(hasSubBendingContent).map((subBending) => (
              <article key={subBending.id}>
                {hasSheetText(subBending.parentElement) ? <Badge variant="outline">{subBending.parentElement}</Badge> : null}
                <h3>{subBending.name || "Subdobra sem nome"}</h3>
                <ReadonlyValue label="Conceito">{subBending.concept}</ReadonlyValue>
                <ReadonlyValue label="Passiva">{subBending.passive}</ReadonlyValue>
                <ReadonlyValue label="Limites">{subBending.limits}</ReadonlyValue>
              </article>
            ))}
          </div>
        ) : null}
      </SheetSection> : null}

      {draft.corruption.enabled ? (
        <SheetSection icon={Skull} title="Corrupção">
          <div className="sheet-readonly-grid compact">
            <ReadonlyValue label="Marca">{draft.corruption.markName}</ReadonlyValue>
            <ReadonlyValue label="Carga">{draft.corruption.charge}/10</ReadonlyValue>
            <ReadonlyValue label="Promessa da Voz">{draft.corruption.voicePromise}</ReadonlyValue>
            <ReadonlyValue label="Sinal visível">{draft.corruption.visibleSign}</ReadonlyValue>
            <ReadonlyValue label="Mutação">{draft.corruption.mutation}</ReadonlyValue>
            <ReadonlyValue label="Fissura">{draft.corruption.fissure}</ReadonlyValue>
            <ReadonlyValue label="Função da Forma">{draft.corruption.formFunction}</ReadonlyValue>
            <ReadonlyValue label="Limitação da Forma">{draft.corruption.formLimitation}</ReadonlyValue>
            <ReadonlyValue label="Intenção da Ruptura">{draft.corruption.ruptureIntent}</ReadonlyValue>
          </div>
          <CorruptedFormEditor draft={draft} onChange={onChange} readOnly={readOnly}/>
        </SheetSection>
      ) : null}

      {draft.divine.enabled ? (
        <SheetSection icon={Landmark} title="Poder divino">
          <div className="sheet-readonly-grid compact">
            <ReadonlyValue label="Expressão">{draft.divine.expression}</ReadonlyValue>
            <ReadonlyValue label="Bênção">{draft.divine.blessingName}</ReadonlyValue>
            <ReadonlyValue label="Regente da Bênção">{draft.divine.expression.includes("Bênção") ? draft.divine.regentAttribute : null}</ReadonlyValue>
            {draft.divine.expression.includes("Comunhão") ? <ReadonlyValue label="Comunhão Divina">Presença {getFinalAttribute(draft, automatic, "Presença")}</ReadonlyValue> : null}
            <ReadonlyValue label="Panteão / Asa">{draft.divine.pantheon}</ReadonlyValue>
            <ReadonlyValue label="Divindade">{draft.divine.deity}</ReadonlyValue>
            <ReadonlyValue label="Jurisdições">{draft.divine.jurisdictions}</ReadonlyValue>
            {draft.divine.expression.includes("Comunhão") ? <ReadonlyValue label="Favor">{draft.divine.favor}/3</ReadonlyValue> : null}
            {draft.divine.expression.includes("Comunhão") || draft.divine.powerLevel > 0 ? <ReadonlyValue label="Nível de poder">{draft.divine.powerLevel}/5</ReadonlyValue> : null}
            <ReadonlyValue label="Núcleo">{draft.divine.core}</ReadonlyValue>
            <ReadonlyValue label="Dádiva inicial">{draft.divine.initialGift}</ReadonlyValue>
            <ReadonlyValue label="Limites essenciais">{draft.divine.essentialLimits}</ReadonlyValue>
            <ReadonlyValue label="Preceito">{draft.divine.precept}</ReadonlyValue>
            <ReadonlyValue label="Profanação">{draft.divine.profanation}</ReadonlyValue>
            <ReadonlyValue label="Liturgias">{draft.divine.liturgies}</ReadonlyValue>
            <ReadonlyValue label="Milagres">{draft.divine.miracles}</ReadonlyValue>
          </div>
        </SheetSection>
      ) : null}

      {visibleInvocations.length ? <SheetSection icon={Ghost} title="Invocações">
        <div className="sheet-invocation-list">
          {visibleInvocations.map((invocation) => {
            const stats = calculateInvocationStats(invocation);
            const otherAttributes = ATTRIBUTES.filter((attribute) => attribute !== invocation.mainAttribute && !invocation.secondaryAttributes.includes(attribute));
            return <article className="sheet-invocation-card" key={invocation.id}>
              <header>
                {invocation.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={invocation.image} alt={`Imagem de ${invocation.name || "Invocação"}`} />
                ) : <span className="sheet-invocation-mark" aria-hidden="true"><Ghost /></span>}
                <div><small>{invocation.nature || "Natureza não registrada"}</small><h3>{invocation.name || "Invocação sem nome"}</h3><div><Badge>Grau {invocation.grade}</Badge>{invocation.profile !== "Sem ajuste" ? <Badge variant="outline">{invocation.profile}</Badge> : null}<Badge variant="outline">{invocation.callForm}</Badge></div></div>
              </header>
              <div className="invocation-stat-preview sheet-invocation-stats">
                {[['CA', stats.armor], ['Vida', stats.life], ['Dano', stats.damage], ['Movimento', `${stats.movement} m`], ['Chamada', `${stats.callCost} Karma`], ['Manutenção', `${stats.maintenance} Karma`]].map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}
              </div>
              <div className="sheet-readonly-grid compact">
                <ReadonlyValue label="Desejo">{invocation.desire}</ReadonlyValue>
                <ReadonlyValue label="Serviço">{invocation.service}</ReadonlyValue>
                <ReadonlyValue label="Limite ou recusa">{invocation.limit}</ReadonlyValue>
                <ReadonlyValue label="Preço">{invocation.price}</ReadonlyValue>
                <ReadonlyValue label="Sinal">{invocation.sign}</ReadonlyValue>
                <ReadonlyValue label="Fraturas">{invocation.fractures}/3</ReadonlyValue>
                <ReadonlyValue label="Atributo principal">{invocation.mainAttribute ? `${invocation.mainAttribute} ${stats.mainAttribute}` : ""}</ReadonlyValue>
                <ReadonlyValue label="Atributo secundário">{invocation.secondaryAttributes.length ? `${invocation.secondaryAttributes[0]} ${stats.secondaryAttribute}` : ""}</ReadonlyValue>
                <ReadonlyValue label="Demais Atributos">{otherAttributes.length ? `${otherAttributes.join(", ")} ${stats.otherAttribute}` : ""}</ReadonlyValue>
                <ReadonlyValue label="Perícias principais">{invocation.mainSkills.length ? `${invocation.mainSkills.join(", ")} ${stats.mainSkill}` : ""}</ReadonlyValue>
                <ReadonlyValue label="Perícia fraca">{invocation.weakSkill ? `${invocation.weakSkill} ${stats.weakSkill}` : ""}</ReadonlyValue>
                <ReadonlyValue label="Movimento">{invocation.movementType}</ReadonlyValue>
                <ReadonlyValue label="Sentidos">{invocation.senses}</ReadonlyValue>
                <ReadonlyValue label="Traço">{invocation.trait}</ReadonlyValue>
                <ReadonlyValue label="Fraqueza">{invocation.weakness}</ReadonlyValue>
                <ReadonlyValue label="Comando e instinto">{invocation.command}</ReadonlyValue>
                <ReadonlyValue label="Dissipação e retorno">{invocation.dissipation}</ReadonlyValue>
              </div>
              {stats.notes.length ? <div className="sheet-invocation-notes">{stats.notes.map((note) => <p key={note}>{note}</p>)}</div> : null}
              {[invocation.ability.name, invocation.ability.concept, invocation.ability.calculation, invocation.ability.effect, invocation.ability.limits].some(hasSheetText) ? <section className="sheet-invocation-ability"><small>Habilidade da Invocação · Grau {invocation.ability.grade}</small><h4>{invocation.ability.name || "Habilidade sem nome"}</h4><ReadonlyValue label="Conceito">{invocation.ability.concept}</ReadonlyValue><ReadonlyValue label="Cálculo">{invocation.ability.calculation}</ReadonlyValue><ReadonlyValue label="Efeito">{invocation.ability.effect}</ReadonlyValue><ReadonlyValue label="Limites">{invocation.ability.limits}</ReadonlyValue></section> : null}
            </article>;
          })}
        </div>
      </SheetSection> : null}

      {draft.techniques.some(hasTechniqueContent) ? <SheetSection icon={BookOpen} title="Técnicas">
        {draft.techniques.length ? (
          <div className="sheet-technique-list">
            {draft.techniques.filter(hasTechniqueContent).map((technique) => (
              <article key={technique.id}>
                <header>
                  <div>
                    {hasSheetText(technique.source) ? <span>{technique.source}</span> : null}
                    <h3>{technique.name || "Técnica sem nome"}</h3>
                  </div>
                  <div>
                    {technique.signature ? <Badge>Assinatura</Badge> : null}
                    {hasSheetText(technique.grade) ? <Badge variant="outline">{technique.grade}</Badge> : null}
                  </div>
                </header>
                {hasSheetText(technique.concept) ? <p className="technique-concept">{technique.concept}</p> : null}
                <div className="technique-facts">
                  <ReadonlyValue label="Teste">{[technique.attribute, technique.skill].filter(hasSheetText).join(" + ") || technique.test}</ReadonlyValue>
                  <ReadonlyValue label="Ação">{technique.action}</ReadonlyValue>
                  <ReadonlyValue label="Alcance">{technique.range}</ReadonlyValue>
                  <ReadonlyValue label="Custo">{technique.cost}</ReadonlyValue>
                  <ReadonlyValue label="Alvo / área / duração">{technique.targetAreaDuration}</ReadonlyValue>
                  
                </div>
                <TechniqueCost>{technique.calculation?.trim() || "Esta técnica ainda não possui uma composição de custo registrada."}</TechniqueCost>
                <div className="technique-results">
                  <ReadonlyValue label="Sucesso total">{technique.totalSuccess}</ReadonlyValue>
                  <ReadonlyValue label="Sucesso parcial">{technique.partialSuccess}</ReadonlyValue>
                  <ReadonlyValue label="Falha">{technique.failure}</ReadonlyValue>
                  <ReadonlyValue label="Limites">{technique.limits}</ReadonlyValue>
                </div>
              </article>
            ))}
          </div>
        ) : null}
      </SheetSection> : null}

      {draft.vows.some((vow) => vow.status !== "draft") ? <SheetSection icon={BookOpen} title="Votos Vinculativos">
        <div className="sheet-record-grid">
          {draft.vows.filter((vow) => vow.status !== "draft").map((vow) => <article key={vow.id}>
            <Badge variant="outline">{({ sealed: "Selado", spent: "Uso consumido; marco pendente", broken: "Quebrado", completed: "Marco concluído" } as const)[vow.status as "sealed" | "spent" | "broken" | "completed"]}</Badge>
            <h3>{vow.name}</h3>
            <ReadonlyValue label="Peso">{VOW_WEIGHTS[vow.weight - 1].name}</ReadonlyValue>
            <ReadonlyValue label="Restrição">{vow.restriction}</ReadonlyValue>
            <ReadonlyValue label="Benefício">{vow.benefit}</ReadonlyValue>
            <ReadonlyValue label="Gatilho">{vow.trigger}</ReadonlyValue>
            <ReadonlyValue label="Duração">{vow.duration}</ReadonlyValue>
            <ReadonlyValue label="Quebra e reparação">{vow.breach}</ReadonlyValue>
            {vow.kind === "sacrifice" ? <p>{vow.targetSkill}: treinamento +10 em um único teste, mantendo nível 2 {vow.status === "sealed" ? "disponível" : "indisponível"}. {vow.sacrifices.map((entry) => `${entry.skill} −${entry.points}`).join("; ")}. Os pontos ficam suspensos até a conclusão do marco.</p> : null}
          </article>)}
        </div>
        {getSacrificedPoints(draft) > 0 ? <p>{getSacrificedPoints(draft)} pontos-base comuns sacrificados; não retornam ao orçamento.</p> : null}
      </SheetSection> : null}

      {draft.notes ? (
        <SheetSection icon={BookOpen} title="Notas de campanha">
          <p className="sheet-long-copy">{draft.notes}</p>
        </SheetSection>
      ) : null}

      <InventoryManager draft={draft} onChange={onChange} readOnly={readOnly}/>
    </div>
  );
}
