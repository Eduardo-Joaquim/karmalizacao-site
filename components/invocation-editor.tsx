"use client";

import { Ghost, Plus, Trash2, TriangleAlert } from "lucide-react";
import Link from "next/link";

import { ImageUploader } from "@/components/image-uploader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import {
  ALL_SKILLS,
  ATTRIBUTES,
  INVOCATION_CALL_FORMS,
  INVOCATION_GRADES,
  INVOCATION_NATURES,
  INVOCATION_PROFILES,
  type CharacterPayload,
  type InvocationGrade,
  type InvocationRecord,
} from "@/lib/character-data";
import {
  calculateInvocationStats,
  getInvocationWarnings,
  invocationGradeIndex,
} from "@/lib/invocation-rules";

function createInvocation(): InvocationRecord {
  return {
    id: crypto.randomUUID(),
    name: "",
    image: "",
    nature: "",
    desire: "",
    service: "",
    limit: "",
    price: "",
    callForm: "Manifestação",
    sign: "",
    fractures: 0,
    grade: "I",
    profile: "Sem ajuste",
    mainAttribute: "",
    secondaryAttributes: [],
    mainSkills: [],
    weakSkill: "",
    movementType: "Terrestre",
    senses: "",
    trait: "",
    weakness: "",
    command: "",
    dissipation: "",
    ability: { name: "", grade: "I", concept: "", calculation: "", effect: "", limits: "" },
  };
}

function InvocationField({ id, label, value, placeholder, onChange, wide = false }: {
  id: string;
  label: string;
  value: string;
  placeholder?: string;
  wide?: boolean;
  onChange: (value: string) => void;
}) {
  return <div className={`character-field${wide ? " field-full" : ""}`}>
    <Label htmlFor={id} className="character-label">{label}</Label>
    <Textarea id={id} rows={3} maxLength={1500} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />
  </div>;
}

export function InvocationEditor({ draft, onChange }: { draft: CharacterPayload; onChange: (next: CharacterPayload) => void }) {
  function updateInvocations(invocations: InvocationRecord[]) {
    onChange({ ...draft, invocations });
  }

  function updateInvocation(id: string, patch: Partial<InvocationRecord>) {
    updateInvocations(draft.invocations.map((invocation) => invocation.id === id ? { ...invocation, ...patch } : invocation));
  }

  return <section className="power-section invocation-section" id="poder-invocacoes">
    <header className="power-section-heading">
      <span className="power-section-icon" aria-hidden="true"><Ghost /></span>
      <div>
        <small>Pacto · criatura · comando</small>
        <h2>Criação de Invocações</h2>
        <p>Registre as oito cláusulas do pacto, monte a ficha pela linha do Grau e aplique no máximo um perfil. Cada Grau define o Atributo principal; somente um Atributo secundário é escolhido e todos os demais ficam no nível 1.</p>
      </div>
    </header>

    <div className="invocation-intro">
      <div><strong>{draft.invocations.length}/10 pactos registrados</strong><p>O limite efetivamente disponível depende do nível de Conjuração. A ficha não transforma derrota em obediência nem aprova pactos forçados.</p></div>
      <Link href="/regras/15-invocacoes">Consultar regras completas de Invocações</Link>
    </div>

    <div className="dynamic-card-list invocation-list">
      {draft.invocations.map((invocation, index) => {
        const stats = calculateInvocationStats(invocation);
        const warnings = getInvocationWarnings(invocation);
        return <article className="dynamic-editor-card invocation-editor-card" key={invocation.id}>
          <header>
            <span>Invocação {String(index + 1).padStart(2, "0")}</span>
            <Button type="button" variant="ghost" size="icon-sm" aria-label={`Remover invocação ${index + 1}`} onClick={() => updateInvocations(draft.invocations.filter((item) => item.id !== invocation.id))}><Trash2 aria-hidden="true" /></Button>
          </header>

          <ImageUploader id={`invocation-image-${invocation.id}`} label="Imagem da Invocação" value={invocation.image} alt={invocation.name ? `Retrato de ${invocation.name}` : `Imagem da Invocação ${index + 1}`} onChange={(image) => updateInvocation(invocation.id, { image })} />

          <div className="character-form-grid two-columns compact-form invocation-basics">
            <div className="character-field">
              <Label htmlFor={`invocation-name-${invocation.id}`} className="character-label">Nome</Label>
              <Input id={`invocation-name-${invocation.id}`} maxLength={120} value={invocation.name} placeholder="Nome ou título da criatura" onChange={(event) => updateInvocation(invocation.id, { name: event.target.value })} />
            </div>
            <div className="character-field">
              <Label htmlFor={`invocation-nature-${invocation.id}`} className="character-label">Natureza</Label>
              <NativeSelect id={`invocation-nature-${invocation.id}`} value={invocation.nature} onChange={(event) => updateInvocation(invocation.id, { nature: event.target.value })}>
                <NativeSelectOption value="">Escolha a natureza</NativeSelectOption>
                {INVOCATION_NATURES.map((nature) => <NativeSelectOption key={nature} value={nature}>{nature}</NativeSelectOption>)}
              </NativeSelect>
            </div>
            <div className="character-field">
              <Label htmlFor={`invocation-grade-${invocation.id}`} className="character-label">Grau</Label>
              <NativeSelect id={`invocation-grade-${invocation.id}`} value={invocation.grade} onChange={(event) => {
                const grade = event.target.value as InvocationGrade;
                updateInvocation(invocation.id, {
                  grade,
                  ...(grade !== "III" && grade !== "IV" && grade !== "V" && invocation.callForm === "Fusão" ? { callForm: "Manifestação" } : {}),
                  ability: invocationGradeIndex(invocation.ability.grade) > invocationGradeIndex(grade) ? { ...invocation.ability, grade } : invocation.ability,
                });
              }}>{INVOCATION_GRADES.map((grade) => <NativeSelectOption key={grade} value={grade}>Grau {grade}</NativeSelectOption>)}</NativeSelect>
            </div>
            <div className="character-field">
              <Label htmlFor={`invocation-profile-${invocation.id}`} className="character-label">Ajuste de perfil</Label>
              <NativeSelect id={`invocation-profile-${invocation.id}`} value={invocation.profile} onChange={(event) => updateInvocation(invocation.id, { profile: event.target.value })}>{INVOCATION_PROFILES.map((profile) => <NativeSelectOption key={profile} value={profile}>{profile}</NativeSelectOption>)}</NativeSelect>
            </div>
            <div className="character-field">
              <Label htmlFor={`invocation-form-${invocation.id}`} className="character-label">Forma de chamada</Label>
              <NativeSelect id={`invocation-form-${invocation.id}`} value={invocation.callForm} onChange={(event) => updateInvocation(invocation.id, { callForm: event.target.value })}>{INVOCATION_CALL_FORMS.map((form) => <NativeSelectOption key={form} value={form} disabled={form === "Fusão" && invocationGradeIndex(invocation.grade) < 3}>{form}{form === "Fusão" ? " · Grau III+" : ""}</NativeSelectOption>)}</NativeSelect>
            </div>
            <div className="range-field">
              <span><Label>Fraturas do pacto</Label><strong>{invocation.fractures}/3</strong></span>
              <Slider min={0} max={3} step={1} value={[invocation.fractures]} onValueChange={(values) => updateInvocation(invocation.id, { fractures: values[0] ?? 0 })} aria-label={`Fraturas de ${invocation.name || `Invocação ${index + 1}`}`} />
            </div>
          </div>

          <section className="invocation-stat-preview" aria-label={`Valores calculados de ${invocation.name || `Invocação ${index + 1}`}`}>
            {[['CA', stats.armor], ['Vida', stats.life], ['Dano', stats.damage], ['Movimento', `${stats.movement} m`], ['Chamada', `${stats.callCost} Karma`], ['Manutenção', `${stats.maintenance} Karma`]].map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}
            <p>Principal {stats.mainAttribute} · 1 secundário {stats.secondaryAttribute} · demais {stats.otherAttribute} · Perícias principais {stats.mainSkill}</p>
            {stats.notes.map((note) => <small key={note}>{note}</small>)}
          </section>

          {warnings.length ? <div className="invocation-warnings" role="alert"><TriangleAlert aria-hidden="true" /><div>{warnings.map((warning) => <p key={warning}>{warning}</p>)}</div></div> : null}

          <div className="invocation-subsection">
            <div className="subsection-title"><Ghost aria-hidden="true" /><div><h4>Cláusulas do pacto</h4><p>Escreva ações observáveis. Desejo, Serviço, Limite e Preço precisam poder entrar em conflito durante o jogo.</p></div></div>
            <div className="character-form-grid two-columns compact-form">
              {([
                ["desire", "Desejo da criatura", "O que ela busca ao aceitar a chamada?"],
                ["service", "Serviço incluído", "Quais ordens o vínculo realmente inclui?"],
                ["limit", "Limite ou recusa", "Qual ordem é recusada ou encerra sua presença?"],
                ["price", "Preço do pacto", "Karma, alimento, memória, manutenção, missão ou proteção."],
                ["sign", "Sinal identificável", "Marca visual, som, cheiro ou outra manifestação sensorial."],
                ["command", "Comando e instinto", "Como recebe ordens e o que pode fazer sem comando?"],
                ["dissipation", "Dissipação e retorno", "O que a dissipa e como o vínculo pode ser reparado?"],
                ["weakness", "Fraqueza", "Condição concreta que adversários podem explorar."],
              ] as const).map(([field, label, placeholder]) => <InvocationField key={field} id={`invocation-${field}-${invocation.id}`} label={label} value={invocation[field]} placeholder={placeholder} wide={field === "dissipation" || field === "weakness"} onChange={(value) => updateInvocation(invocation.id, { [field]: value })} />)}
            </div>
          </div>

          <div className="invocation-subsection">
            <div className="subsection-title"><Ghost aria-hidden="true" /><div><h4>Corpo, sentidos e treinamento</h4><p>Escolha um Atributo principal, somente um secundário, duas Perícias principais e uma Perícia fraca. Os outros quatro Atributos ficam automaticamente no nível 1.</p></div></div>
            <div className="character-form-grid two-columns compact-form">
              <div className="character-field"><Label htmlFor={`invocation-main-attribute-${invocation.id}`} className="character-label">Atributo principal · {stats.mainAttribute}</Label><NativeSelect id={`invocation-main-attribute-${invocation.id}`} value={invocation.mainAttribute} onChange={(event) => updateInvocation(invocation.id, { mainAttribute: event.target.value, secondaryAttributes: invocation.secondaryAttributes.filter((attribute) => attribute !== event.target.value) })}><NativeSelectOption value="">Escolha</NativeSelectOption>{ATTRIBUTES.map((attribute) => <NativeSelectOption key={attribute} value={attribute}>{attribute}</NativeSelectOption>)}</NativeSelect></div>
              <div className="character-field"><Label htmlFor={`invocation-secondary-${invocation.id}`} className="character-label">Atributo secundário · {stats.secondaryAttribute}</Label><NativeSelect id={`invocation-secondary-${invocation.id}`} value={invocation.secondaryAttributes[0] ?? ""} onChange={(event) => updateInvocation(invocation.id, { secondaryAttributes: event.target.value ? [event.target.value] : [] })}><NativeSelectOption value="">Escolha</NativeSelectOption>{ATTRIBUTES.map((attribute) => <NativeSelectOption key={attribute} value={attribute} disabled={attribute === invocation.mainAttribute}>{attribute}</NativeSelectOption>)}</NativeSelect></div>
              {[0, 1].map((slot) => <div className="character-field" key={slot}><Label htmlFor={`invocation-skill-${slot}-${invocation.id}`} className="character-label">Perícia principal {slot + 1} · nível {stats.mainSkill}</Label><NativeSelect id={`invocation-skill-${slot}-${invocation.id}`} value={invocation.mainSkills[slot] ?? ""} onChange={(event) => { const mainSkills = [...invocation.mainSkills]; mainSkills[slot] = event.target.value; updateInvocation(invocation.id, { mainSkills: mainSkills.filter(Boolean) }); }}><NativeSelectOption value="">Escolha</NativeSelectOption>{ALL_SKILLS.map((skill) => <NativeSelectOption key={skill} value={skill} disabled={skill === invocation.weakSkill || invocation.mainSkills.some((selected, selectedSlot) => selectedSlot !== slot && selected === skill)}>{skill}</NativeSelectOption>)}</NativeSelect></div>)}
              <div className="character-field"><Label htmlFor={`invocation-weak-skill-${invocation.id}`} className="character-label">Perícia fraca · nível 0</Label><NativeSelect id={`invocation-weak-skill-${invocation.id}`} value={invocation.weakSkill} onChange={(event) => updateInvocation(invocation.id, { weakSkill: event.target.value, mainSkills: invocation.mainSkills.filter((skill) => skill !== event.target.value) })}><NativeSelectOption value="">Escolha</NativeSelectOption>{ALL_SKILLS.map((skill) => <NativeSelectOption key={skill} value={skill} disabled={invocation.mainSkills.includes(skill)}>{skill}</NativeSelectOption>)}</NativeSelect></div>
              <div className="character-field"><Label htmlFor={`invocation-movement-${invocation.id}`} className="character-label">Tipo de movimento</Label><Input id={`invocation-movement-${invocation.id}`} maxLength={120} value={invocation.movementType} placeholder="Terrestre, voo, nado…" onChange={(event) => updateInvocation(invocation.id, { movementType: event.target.value })} /></div>
              <InvocationField id={`invocation-senses-${invocation.id}`} label="Sentidos" value={invocation.senses} placeholder="Sentidos relevantes e como se manifestam." onChange={(senses) => updateInvocation(invocation.id, { senses })} />
              <InvocationField id={`invocation-trait-${invocation.id}`} label="Traço sensorial ou estético" value={invocation.trait} placeholder="Não concede dado, CA, dano, imunidade ou ação." onChange={(trait) => updateInvocation(invocation.id, { trait })} />
            </div>
          </div>

          <div className="invocation-subsection invocation-ability-editor">
            <div className="subsection-title"><Ghost aria-hidden="true" /><div><h4>Habilidade da Invocação</h4><p>Uma habilidade de Fonte Invocação. O invocador paga o Karma e o Grau não pode superar o da criatura.</p></div></div>
            <div className="character-form-grid two-columns compact-form">
              <div className="character-field"><Label htmlFor={`invocation-ability-name-${invocation.id}`} className="character-label">Nome da habilidade</Label><Input id={`invocation-ability-name-${invocation.id}`} maxLength={120} value={invocation.ability.name} onChange={(event) => updateInvocation(invocation.id, { ability: { ...invocation.ability, name: event.target.value } })} /></div>
              <div className="character-field"><Label htmlFor={`invocation-ability-grade-${invocation.id}`} className="character-label">Grau da habilidade</Label><NativeSelect id={`invocation-ability-grade-${invocation.id}`} value={invocation.ability.grade} onChange={(event) => updateInvocation(invocation.id, { ability: { ...invocation.ability, grade: event.target.value as InvocationGrade } })}>{INVOCATION_GRADES.filter((grade) => invocationGradeIndex(grade) <= invocationGradeIndex(invocation.grade)).map((grade) => <NativeSelectOption key={grade} value={grade}>Grau {grade}</NativeSelectOption>)}</NativeSelect></div>
              {([['concept', 'Conceito e função'], ['calculation', 'Cálculo de Karma'], ['effect', 'Efeito e resultados'], ['limits', 'Limites e falha']] as const).map(([field, label]) => <InvocationField key={field} id={`invocation-ability-${field}-${invocation.id}`} label={label} value={invocation.ability[field]} wide onChange={(value) => updateInvocation(invocation.id, { ability: { ...invocation.ability, [field]: value } })} />)}
            </div>
          </div>
        </article>;
      })}
    </div>

    {draft.invocations.length ? null : <div className="empty-dynamic-state"><Ghost aria-hidden="true" /><strong>Nenhuma Invocação registrada.</strong><p>Adicione um pacto e preencha apenas os campos que já foram definidos com o Mestre.</p></div>}
    <Button type="button" className="karma-button" disabled={draft.invocations.length >= 10} onClick={() => updateInvocations([...draft.invocations, createInvocation()])}><Plus aria-hidden="true" /> Nova Invocação</Button>
  </section>;
}
