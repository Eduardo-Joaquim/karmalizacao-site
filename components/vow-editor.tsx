"use client";

import { Plus, ScrollText, Trash2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { ALL_SKILLS, type BindingVow, type CharacterPayload } from "@/lib/character-data";
import { calculateAutomaticBonuses, getFinalSkill, getSkillTest, getVowCapacity, getVowErrors, VOW_WEIGHTS, type AutomaticBonuses } from "@/lib/character-rules";

function newVow(sacrifice: boolean): BindingVow {
  return {
    id: crypto.randomUUID(), name: sacrifice ? "Memória de uma única obra" : "", kind: sacrifice ? "sacrifice" : "personal", weight: sacrifice ? 3 : 1,
    restriction: sacrifice ? "Suspendo quatro pontos-base de quatro Perícias até cumprir o marco objetivo registrado na duração." : "",
    benefit: sacrifice ? "Um único teste de uma Perícia nível 2 recebe +10 em vez de +5 de treinamento. O nível e os requisitos permanecem em 2." : "",
    trigger: "", duration: sacrifice ? "Descreva o marco objetivo de missão que restituirá os pontos." : "",
    breach: sacrifice ? "Falha consome o uso; pontos e espaços permanecem suspensos até o marco. Registre as consequências da quebra com o Mestre." : "",
    approved: false, status: "draft", targetSkill: "", sacrifices: [],
  };
}

export function VowEditor({ draft, automatic, onChange }: { draft: CharacterPayload; automatic: AutomaticBonuses; onChange: (draft: CharacterPayload) => void }) {
  const occupied = draft.vows.filter((vow) => (vow.status === "sealed" || (vow.kind === "sacrifice" && ["spent", "broken"].includes(vow.status)))).reduce((sum, vow) => sum + VOW_WEIGHTS[vow.weight - 1].slots, 0);
  const errors = getVowErrors(draft, automatic);

  function update(id: string, patch: Partial<BindingVow>) {
    onChange({ ...draft, vows: draft.vows.map((vow) => vow.id === id ? { ...vow, ...patch } : vow) });
  }

  function seal(vow: BindingVow) {
    const next: CharacterPayload = { ...draft, vows: draft.vows.map((item) => item.id === vow.id ? { ...item, status: "sealed" } : item) };
    const problems = getVowErrors(next, calculateAutomaticBonuses(next));
    if (problems.length) { toast.error(problems[0]); return; }
    if (!window.confirm("Selar este Voto? As cláusulas ficam bloqueadas. No sacrifício, os quatro pontos ficam suspensos até o marco, mesmo se o uso falhar. Salve a ficha para gravar a decisão.")) return;
    onChange(next);
  }

  return <section className="power-section" id="poder-votos">
    <header className="power-section-heading">
      <span className="power-section-icon" aria-hidden="true"><ScrollText /></span>
      <div><small>Promessa · preço · consequência</small><h2>Votos Vinculativos</h2><p>Quanto maior a renúncia real, maior o poder permitido. A aprovação e a selagem são resolvidas com o Mestre; a ficha registra o resultado.</p></div>
    </header>
    <div className="vow-intro">
      <strong>Vínculos ocupados: {occupied}/{getVowCapacity(draft, automatic)}</strong>
      <p><b>Peso mede o que o personagem perde.</b> Potência mede somente o teto do que ele pode receber. Escolha o Peso pela renúncia; a Potência vem automaticamente e nunca é somada aos dados, ao dano ou à CA.</p>
      <p>Memória suspende quatro pontos-base de Perícias distintas até um marco de missão. Um único teste recebe +10 em vez de +5; a Perícia permanece nível 2.</p>
      <Link href="/regras/16-votos-vinculativos">Consultar regras completas dos Votos</Link>
    </div>
    <section className="vow-creation-guide" aria-labelledby="vow-creation-guide-title">
      <header>
        <small>Faça nesta ordem</small>
        <h3 id="vow-creation-guide-title">Crie o Voto em sete passos</h3>
      </header>
      <ol>
        <li><span>1</span><div><strong>Desejo</strong><p>Escreva em uma frase o momento que o Voto pretende criar.</p></div></li>
        <li><span>2</span><div><strong>Renúncia</strong><p>Defina a liberdade real que o personagem perderá, antes de escolher o prêmio.</p></div></li>
        <li><span>3</span><div><strong>Peso</strong><p>Compare somente a renúncia com a tabela. Não escolha pelo benefício desejado.</p></div></li>
        <li><span>4</span><div><strong>Benefício</strong><p>Escolha um único pacote da linha do Peso ou de uma linha inferior.</p></div></li>
        <li><span>5</span><div><strong>Cláusulas</strong><p>Preencha partes, gatilho, duração, encerramento, quebra e reparação.</p></div></li>
        <li><span>6</span><div><strong>Conferência</strong><p>Compare separadamente a renúncia e o benefício para confirmar a equivalência.</p></div></li>
        <li><span>7</span><div><strong>Selagem</strong><p>Após aprovação do Mestre, pague o Karma, faça o teste e só então sele na ficha.</p></div></li>
      </ol>
      <Table className="vow-weight-table">
        <TableCaption>Escolha o Peso pela renúncia. Potência é apenas o teto do pacote de benefício.</TableCaption>
        <TableHeader><TableRow><TableHead>Peso</TableHead><TableHead>Renúncia mínima</TableHead><TableHead>Potência</TableHead><TableHead>Benefício máximo de referência</TableHead><TableHead>Selagem</TableHead></TableRow></TableHeader>
        <TableBody>{VOW_WEIGHTS.map((weight) => <TableRow key={weight.weight}>
          <TableCell><strong>{weight.weight} · {weight.name}</strong></TableCell>
          <TableCell>{weight.restriction}</TableCell>
          <TableCell><strong>{weight.potency}</strong></TableCell>
          <TableCell>{weight.ceiling}</TableCell>
          <TableCell>CD {weight.dc}<br />{weight.karma} Karma<br />{weight.slots} espaço(s)</TableCell>
        </TableRow>)}</TableBody>
      </Table>
      <p className="vow-guide-rule"><strong>Regra de ouro:</strong> Potência não é uma moeda. Você não soma pacotes até “gastar” o número. Escolha um pacote completo; qualquer Potência não utilizada desaparece.</p>
    </section>
    {errors.length ? <div className="vow-errors" role="alert">{errors.map((error) => <p key={error}>{error}</p>)}</div> : null}
    <div className="vow-list">
      {draft.vows.map((vow, index) => {
        const locked = vow.status !== "draft";
        const rule = VOW_WEIGHTS[vow.weight - 1];
        const special = vow.kind === "sacrifice";
        const preview = special && vow.status === "sealed" ? getSkillTest(draft, automatic, vow.targetSkill, undefined, vow.id) : null;
        return <article className="system-activation-card vow-card" key={vow.id} data-enabled={locked}>
          <div className="toggle-heading"><h3>{vow.name || `Voto ${index + 1}`}</h3><span>{({ draft: "Rascunho", sealed: "Selado", spent: "Uso consumido; marco pendente", broken: "Quebrado", completed: "Marco concluído" })[vow.status]}</span></div>
          <fieldset disabled={locked} className="character-form-grid two-columns compact-form">
            <legend className="sr-only">Cláusulas do voto {index + 1}</legend>
            <div className="character-field"><Label htmlFor={`vow-name-${vow.id}`}>Nome</Label><Input id={`vow-name-${vow.id}`} maxLength={120} value={vow.name} onChange={(event) => update(vow.id, { name: event.target.value })} /></div>
            <div className="character-field"><Label htmlFor={`vow-kind-${vow.id}`}>Tipo</Label><NativeSelect id={`vow-kind-${vow.id}`} value={vow.kind} disabled={special} onChange={(event) => update(vow.id, { kind: event.target.value as BindingVow["kind"] })}>
              <NativeSelectOption value="personal">Limitação pessoal</NativeSelectOption><NativeSelectOption value="mutual">Entre pessoas</NativeSelectOption>{special ? <NativeSelectOption value="sacrifice">Sacrifício de 4 pontos</NativeSelectOption> : null}
            </NativeSelect></div>
            <div className="character-field"><Label htmlFor={`vow-weight-${vow.id}`}>Peso da renúncia</Label><NativeSelect id={`vow-weight-${vow.id}`} value={vow.weight} disabled={special} onChange={(event) => update(vow.id, { weight: Number(event.target.value) })}>{VOW_WEIGHTS.map((weight) => <NativeSelectOption key={weight.weight} value={weight.weight}>Peso {weight.weight} · {weight.name} — Potência {weight.potency}</NativeSelectOption>)}</NativeSelect></div>
            <p className="vow-cost">Selagem: CD {rule.dc} · {rule.karma} Karma · {rule.slots} espaço(s). Canalização usa Espírito; somente Conjuração Vincular, Comunhão Divina e Controle da Corrupção exigem Presença.</p>
            <div className="vow-selected-weight field-full"><strong>Para usar Peso {rule.weight}:</strong><p>{rule.restriction}</p><strong>Teto de benefício:</strong><p>{rule.ceiling}</p><small>Escolha um único pacote desta linha ou de uma linha inferior. O Mestre confirma a equivalência antes da selagem.</small></div>
            {([ ["restriction", "Restrição e partes envolvidas"], ["benefit", "Benefício aprovado e teto"], ["trigger", "Gatilho verificável"], ["duration", "Duração e encerramento"], ["breach", "Quebra, consequência e reparação"] ] as const).map(([key, label]) => <div className={`character-field${key === "breach" ? " field-full" : ""}`} key={key}><Label htmlFor={`vow-${key}-${vow.id}`}>{label}</Label><Textarea id={`vow-${key}-${vow.id}`} rows={3} maxLength={key === "duration" ? 500 : key === "trigger" ? 1000 : 1500} value={vow[key]} onChange={(event) => update(vow.id, { [key]: event.target.value })} /></div>)}
            {special ? <>
              <div className="character-field field-full"><Label htmlFor={`vow-target-${vow.id}`}>Perícia existente que terá o uso evolutivo</Label><NativeSelect id={`vow-target-${vow.id}`} value={vow.targetSkill} onChange={(event) => update(vow.id, { targetSkill: event.target.value })}><NativeSelectOption value="">Escolha uma perícia no nível 2</NativeSelectOption>{ALL_SKILLS.map((skill) => <NativeSelectOption key={skill} value={skill} disabled={!locked && getFinalSkill(draft, automatic, skill) !== 2}>{skill}</NativeSelectOption>)}</NativeSelect></div>
              <div className="vow-donors field-full"><strong>Pontos-base sacrificados: {vow.sacrifices.reduce((sum, entry) => sum + entry.points, 0)}/4</strong><p>Selecione pontos realmente distribuídos. Bônus raciais, de classe, ajustes e progressão não financiam este voto.</p>
                {ALL_SKILLS.filter((skill) => draft.skills[skill].base > 0).map((skill) => <div className="vow-donor" key={skill}><Label htmlFor={`vow-donor-${vow.id}-${skill}`}>{skill} ({draft.skills[skill].base} base)</Label><NativeSelect id={`vow-donor-${vow.id}-${skill}`} value={vow.sacrifices.find((entry) => entry.skill === skill)?.points ?? 0} disabled={skill === vow.targetSkill} onChange={(event) => { const points = Number(event.target.value); update(vow.id, { sacrifices: [...vow.sacrifices.filter((entry) => entry.skill !== skill), ...(points ? [{ skill, points }] : [])] }); }}>
                  {[0, 1, 2].filter((points) => points <= draft.skills[skill].base).map((points) => <NativeSelectOption value={points} key={points}>{points}</NativeSelectOption>)}
                </NativeSelect></div>)}
              </div>
            </> : null}
            <Label className="vow-approval field-full" htmlFor={`vow-approval-${vow.id}`}><Checkbox id={`vow-approval-${vow.id}`} checked={vow.approved} onCheckedChange={(checked) => update(vow.id, { approved: checked === true })} />O Mestre aprovou as cláusulas; o teste de selagem e o pagamento foram resolvidos na mesa.</Label>
          </fieldset>
          {preview?.oneUse ? <p className="vow-preview">Uso disponível: {preview.attribute} {preview.value} · {preview.dice}d20, escolha o {preview.selection}, +{preview.bonus} (treinamento +10; nível 2; análise +{preview.analyticBonus}). Declare antes de rolar.</p> : null}
          <div className="vow-actions">
            {!locked ? <><Button type="button" onClick={() => seal(vow)}>Selar Voto</Button><Button type="button" variant="ghost" onClick={() => onChange({ ...draft, vows: draft.vows.filter((entry) => entry.id !== vow.id) })}><Trash2 aria-hidden="true" />Remover rascunho</Button></> : null}
            {vow.status === "sealed" ? <><Button type="button" variant="outline" onClick={() => { if (window.confirm(special ? "Consumir o uso antes de rolar? O resultado, mesmo em falha, não permite repetir. Salve em seguida." : "Encerrar o Voto cumprido? Salve em seguida.")) update(vow.id, { status: "spent" }); }}>{special ? "Consumir uso antes de rolar" : "Encerrar Voto cumprido"}</Button><Button type="button" variant="ghost" onClick={() => { if (window.confirm("Registrar a quebra? Aplique as consequências na mesa. Os pontos permanecem suspensos até o marco.")) update(vow.id, { status: "broken" }); }}>Registrar quebra</Button></> : null}
            {special && ["sealed", "spent", "broken"].includes(vow.status) ? <Button type="button" variant="outline" onClick={() => { if(window.confirm("O Mestre confirmou o marco? Restituir os pontos e liberar os espaços?")) update(vow.id,{status:"completed"}); }}>Concluir marco e restituir pontos</Button> : null}
          </div>
          {locked ? <p className="vow-footnote">Cláusulas bloqueadas. O estado será persistido ao salvar a ficha. A aprovação registrada não substitui a decisão do Mestre.</p> : null}
        </article>;
      })}
    </div>
    <div className="vow-actions">
      <Button type="button" variant="outline" disabled={draft.vows.length >= 20} onClick={() => onChange({ ...draft, vows: [...draft.vows, newVow(false)] })}><Plus aria-hidden="true" />Adicionar Voto</Button>
      <Button type="button" variant="outline" disabled={draft.vows.length >= 20 || draft.vows.some((vow) => vow.kind === "sacrifice" && vow.status !== "completed")} onClick={() => onChange({ ...draft, vows: [...draft.vows, newVow(true)] })}>Sacrifício: 4 pontos → 1 uso</Button>
    </div>
  </section>;
}
