"use client";
import "@/app/inventory.css";
import "@/app/live-combat.css";
import "@/app/table-play.css";

import Link from "next/link";

import { GmCombatWindow } from "@/components/gm-combat-window";
import summons from "@/data/geppeto-summons.json";
import { useNpcCatalog } from "@/hooks/use-npc-catalog";
import { alchemyState } from "@/lib/alchemy";
import { ATTRIBUTES, createBlankCharacter } from "@/lib/character-data";
import type { NpcTemplate } from "@/lib/combat-catalog";
import { combatId } from "@/lib/combat-id";
import { corruptedFormState, corruptionControlDC } from "@/lib/corrupted-form";
import {
  addToForgeLibrary,
  FORGE_LIBRARY_KEY,
  npcTemplateSchema,
  parseForgeLibrary,
} from "@/lib/gm-encounter";
import { quickTechnique, TECH_GRADES, vowJudgement } from "@/lib/gm-rules";
import type { searchRules } from "@/lib/gm-search";
import type { searchItemCatalog } from "@/lib/item-catalog";
import { MATRICES, type TechniqueMatrix } from "@/lib/technique-matrices";
import { lazy, Suspense, useEffect, useState } from "react";
const EncounterDesk = lazy(() =>
  import("@/components/encounter-desk").then((module) => ({
    default: module.EncounterDesk,
  })),
);
const GeppetoSummons = lazy(() =>
  import("@/components/geppeto-summons").then((module) => ({
    default: module.GeppetoSummons,
  })),
);

function num(value: string) {
  return Math.max(0, Math.floor(Number(value) || 0));
}
export function GmPage() {
  const {
    entries: earlyPresets,
    error: presetsError,
    retry: retryPresets,
  } = useNpcCatalog(true, true);
  const [referenceOpen, setReferenceOpen] = useState(false);
  const [rules, setRules] = useState<ReturnType<typeof searchRules>>([]),
    [items, setItems] = useState<ReturnType<typeof searchItemCatalog>>([]),
    [searchError, setSearchError] = useState("");
  const [race, setRace] = useState("Humano");
  const [incoming, setIncoming] = useState<NpcTemplate | null>(null),
    [name, setName] = useState(""),
    [stage, setStage] = useState(1),
    [role, setRole] = useState("Combatente"),
    [life, setLife] = useState(20),
    [karma, setKarma] = useState(8),
    [ca, setCa] = useState(15),
    [attrs, setAttrs] = useState([3, 3, 3, 1, 1, 1]),
    [skills, setSkills] = useState("Luta 1; Reflexos 1"),
    [reactions, setReactions] = useState(1),
    [traits, setTraits] = useState(""),
    [techName, setTechName] = useState(""),
    [grade, setGrade] = useState(0),
    [action, setAction] = useState("Principal"),
    [range, setRange] = useState(0),
    [duration, setDuration] = useState(0),
    [primary, setPrimary] = useState("Ataque"),
    [minor, setMinor] = useState(false),
    [effect, setEffect] = useState(""),
    [roll, setRoll] = useState("2d20 +2"),
    [weight, setWeight] = useState(1),
    [constitution, setConstitution] = useState(4),
    [saturation, setSaturation] = useState(0),
    [charge, setCharge] = useState(0),
    [temporary, setTemporary] = useState(0),
    [control, setControl] = useState(1),
    [query, setQuery] = useState("");
  const [matrix, setMatrix] = useState<TechniqueMatrix>("Kármico");
  const [library, setLibrary] = useState<NpcTemplate[]>([]),
    [libraryReady, setLibraryReady] = useState(false),
    [libraryMessage, setLibraryMessage] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const raw = localStorage.getItem(FORGE_LIBRARY_KEY);
        if (raw) setLibrary(parseForgeLibrary(JSON.parse(raw)));
        setLibraryReady(true);
      } catch {
        setLibraryMessage(
          "Biblioteca local inválida; os dados existentes foram preservados.",
        );
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);
  useEffect(() => {
    const url = new URL(window.location.href);
    const requested = url.searchParams.get("npc");
    if (!requested) return;
    const controller = new AbortController();
    url.searchParams.delete("npc");
    window.history.replaceState(null, "", url);
    void fetch(`/api/mesa/catalogo?id=${encodeURIComponent(requested)}`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw Error("Ficha não encontrada no catálogo.");
        return response.json() as Promise<NpcTemplate>;
      })
      .then((npc) => setIncoming(npc))
      .catch((error) => {
        if (!controller.signal.aborted) setLibraryMessage(error.message);
      });
    return () => controller.abort();
  }, []);
  function persistLibrary(next: NpcTemplate[]) {
    try {
      localStorage.setItem(FORGE_LIBRARY_KEY, JSON.stringify(next));
      setLibrary(next);
      setLibraryMessage("Biblioteca atualizada neste navegador.");
    } catch {
      setLibraryMessage(
        "Não foi possível guardar a biblioteca. Verifique o espaço do navegador.",
      );
    }
  }
  const t = quickTechnique(
      grade,
      (
        { Principal: 0, Movimento: 1, Reação: 1, Livre: 4 } as Record<
          string,
          number
        >
      )[action],
      range,
      duration,
      minor,
      matrix,
    ),
    vow = vowJudgement(weight),
    alch = alchemyState(constitution, saturation),
    maxGrade = stage >= 7 ? 4 : stage >= 5 ? 3 : stage >= 3 ? 2 : 1;
  function forge(save = false) {
    if (!name.trim()) {
      setLibraryMessage("Informe o nome da criatura antes de continuar.");
      return;
    }
    if (!techName.trim()) {
      setLibraryMessage("Informe o nome da técnica principal da criatura.");
      return;
    }
    if (!effect.trim()) {
      setLibraryMessage("Descreva o efeito mecânico da técnica da criatura.");
      return;
    }
    if (grade > maxGrade) {
      setLibraryMessage(
        "O Grau escolhido excede o limite permitido para a Etapa selecionada.",
      );
      return;
    }
    const id = combatId();
    const npc: NpcTemplate = {
      id,
      name: name.trim(),
      source: "Forja do Mestre",
      stage: `Etapa ${["I", "II", "III", "IV", "V", "VI", "VII"][stage - 1]} · ${role}`,
      life,
      karma,
      ca,
      movement: "7 m",
      attributes: attrs,
      skills,
      traits,
      resistance: 0,
      reactions,
      arts: [
        {
          id: "forged",
          name: techName,
          cost: t.cost,
          text: `Matriz ${matrix} · Dano universal ${matrix === "Marcial" ? "Físico" : "Kármico"}. ${primary}: ${effect}. ${primary === "Ataque" ? `Total ${t.damage}; parcial metade do dano, sem efeito menor. Falha: nada.` : "Registre a resolução, o encerramento e a defesa no efeito."} ${minor ? "Inclui apenas um efeito menor descrito." : ""}`,
          roll,
          damage: primary === "Ataque" ? t.damage : "",
          attack: primary === "Ataque",
          action,
          calculation: t.calculation,
        },
      ],
    };
    try {
      npcTemplateSchema.parse(npc);
      if (save) {
        if (!libraryReady) throw Error("Biblioteca indisponível.");
        persistLibrary(addToForgeLibrary(library, npc));
      } else {
        setIncoming(npc);
        setLibraryMessage(
          `"${npc.name}" foi enviado para a Janela de Combate!`,
        );
        document
          .querySelector(".gm-combat")
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    } catch (e) {
      setLibraryMessage((e as Error).message);
    }
  }
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      if (query.trim().length < 2) {
        setRules([]);
        setItems([]);
        setSearchError("");
        return;
      }
      try {
        const response = await fetch(
          `/api/mesa/busca?q=${encodeURIComponent(query)}`,
          { signal: controller.signal },
        );
        if (!response.ok) throw Error("Busca indisponível. Tente novamente.");
        const data = (await response.json()) as {
          rules: ReturnType<typeof searchRules>;
          items: ReturnType<typeof searchItemCatalog>;
        };
        setRules(data.rules);
        setItems(data.items);
        setSearchError("");
      } catch (error) {
        if (!controller.signal.aborted) {
          setRules([]);
          setItems([]);
          setSearchError(
            error instanceof Error ? error.message : "Busca indisponível.",
          );
        }
      }
    }, 220);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);
  const corruptionDraft = createBlankCharacter();
  corruptionDraft.race = race;
  corruptionDraft.stage = `Etapa ${["I", "II", "III", "IV", "V", "VI", "VII"][stage - 1]}`;
  corruptionDraft.corruption = {
    ...corruptionDraft.corruption,
    enabled: true,
    charge,
  };
  corruptionDraft.combat = {
    life: 0,
    karma: 0,
    shield: 0,
    temporaryCharges: temporary,
    round: 1,
    domainRounds: {},
  };
  const form = corruptedFormState(corruptionDraft, control);
  return (
    <main className="site-shell gm-page live-ui">
      <header className="gm-heading">
        <small>ESCUDO DO MESTRE</small>
        <h1>O mundo responde à mesa.</h1>
        <p>
          Conduza encontros, conecte jogadores e consulte as regras sem
          abandonar a sessão.
        </p>
        <nav>
          <a href="#gm-combat-title">Combate</a>
          <a href="#gm-forge">Forja de Ameaças</a>
          <a href="#gm-tools">Juiz de Regras</a>
          <a href="#gm-reference">Dossiês e Teatro</a>
        </nav>
      </header>
      <GmCombatWindow incoming={incoming} />
      <details id="gm-forge" className="gm-tool" open>
        <summary>Forja Rápida de Ameaças</summary>
        <h2>Doze presets de Etapas I–IV</h2>
        {presetsError && (
          <p role="alert">
            {presetsError}
            <button onClick={retryPresets}>Tentar novamente</button>
          </p>
        )}
        <div className="gm-presets">
          {earlyPresets.map((p) => (
            <article key={p.id}>
              <h3>{p.name}</h3>
              <p>
                {p.stage} · PV {p.life} · Karma {p.karma} · CA {p.ca}
              </p>
              <button onClick={() => setIncoming(structuredClone(p))}>
                Enviar para o Combate
              </button>
            </article>
          ))}
        </div>
        <h2>Criar criatura</h2>
        <div className="live-controls">
          <label>
            Nome
            <input
              maxLength={80}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <label>
            Etapa
            <select
              value={stage}
              onChange={(e) => {
                const n = Number(e.target.value);
                setStage(n);
                setGrade((g) =>
                  Math.min(g, n >= 7 ? 4 : n >= 5 ? 3 : n >= 3 ? 2 : 1),
                );
              }}
            >
              {["I", "II", "III", "IV", "V", "VI", "VII"].map((s, i) => (
                <option key={s} value={i + 1}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label>
            Papel Tático
            <select value={role} onChange={(e) => setRole(e.target.value)}>
              {[
                "Combatente",
                "Controlador",
                "Tanque",
                "Artilheiro",
                "Suporte",
                "Batedor",
              ].map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </label>
          {[
            ["Vida", life, setLife],
            ["Karma", karma, setKarma],
            ["CA", ca, setCa],
            ["Reações", reactions, setReactions],
          ].map(([n, v, set]) => (
            <label key={String(n)}>
              {String(n)}
              <input
                type="number"
                min={0}
                max={99999}
                value={Number(v)}
                onChange={(e) =>
                  (set as (n: number) => void)(num(e.target.value))
                }
              />
            </label>
          ))}
          <p>
            CA {ca} · parcial {Math.floor(ca / 2)}–{ca - 1} · total {ca}+
          </p>
        </div>
        <div className="live-attributes">
          {ATTRIBUTES.map((n, i) => (
            <label key={n}>
              {n}
              <input
                type="number"
                min={0}
                max={20}
                value={attrs[i]}
                onChange={(e) =>
                  setAttrs(
                    attrs.map((v, j) =>
                      i === j ? Math.min(20, num(e.target.value)) : v,
                    ),
                  )
                }
              />
            </label>
          ))}
        </div>
        <label>
          Perícias
          <input
            value={skills}
            onChange={(e) => setSkills(e.target.value)}
            placeholder="Luta 1; Reflexos 1"
          />
        </label>
        <label>
          Traços e limites
          <textarea
            maxLength={4000}
            value={traits}
            onChange={(e) => setTraits(e.target.value)}
          />
        </label>
        <h3>Criar técnica</h3>
        <p>
          Uma função primária e, opcionalmente, um efeito menor. Área e funções
          secundárias exigem construção completa no Capítulo 10.
        </p>
        <div className="live-controls">
          <label>
            Nome da técnica
            <input
              maxLength={100}
              value={techName}
              onChange={(e) => setTechName(e.target.value)}
            />
          </label>
          <label>
            Matriz
            <select
              value={matrix}
              onChange={(e) => setMatrix(e.target.value as TechniqueMatrix)}
            >
              {MATRICES.map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </label>
          <label>
            Grau
            <select
              value={grade}
              onChange={(e) => setGrade(Number(e.target.value))}
            >
              {TECH_GRADES.map((g, i) => (
                <option key={g} value={i} disabled={i > maxGrade}>
                  {g}
                </option>
              ))}
            </select>
          </label>
          <label>
            Função primária
            <select
              value={primary}
              onChange={(e) => setPrimary(e.target.value)}
            >
              {[
                "Ataque",
                "Defesa",
                "Restauração",
                "Controle",
                "Movimento",
                "Informação",
                "Transformação",
              ].map((n) => (
                <option key={n}>{n}</option>
              ))}
            </select>
          </label>
          <label>
            Ação
            <select value={action} onChange={(e) => setAction(e.target.value)}>
              <option value="Principal">Principal · incluída</option>
              <option value="Movimento">Movimento · +1</option>
              <option value="Reação">Reação · +1</option>
              <option value="Livre">Livre · +4</option>
            </select>
          </label>
          <label>
            Alcance
            <select
              value={range}
              onChange={(e) => setRange(Number(e.target.value))}
            >
              <option value={0}>Até 5 m</option>
              <option value={2}>6–15 m · +2</option>
              <option value={4}>16–30 m · +4</option>
            </select>
          </label>
          <label>
            Duração
            <select
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
            >
              <option value={0}>Instantânea / próximo turno</option>
              <option value={1}>2 rodadas · +1</option>
              <option value={2}>3 rodadas · +2</option>
              <option value={4}>Cena · +4</option>
            </select>
          </label>
          <label>
            <input
              type="checkbox"
              checked={minor}
              onChange={(e) => setMinor(e.target.checked)}
            />
            Um efeito menor · +1
          </label>
          <label>
            Rolagem de ataque
            <input
              value={roll}
              onChange={(e) => setRoll(e.target.value)}
              placeholder="3d20 +5"
            />
          </label>
        </div>
        <label>
          Efeito total e limites
          <textarea
            maxLength={2000}
            value={effect}
            onChange={(e) => setEffect(e.target.value)}
            placeholder="Descreva tipo de dano, trajetória, alvo e o efeito menor, se comprado."
          />
        </label>
        <p>
          {primary === "Ataque"
            ? t.damage
            : primary === "Defesa" || primary === "Restauração"
              ? ["1d4", "1d8", "2d6", "2d10", "3d10"][grade]
              : "Efeito definido pelo Grau"}{" "}
          · {t.cost} Karma · {t.calculation}. Requer Perícia{" "}
          {grade >= 4 ? 3 : grade >= 3 ? 2 : 1} na fonte.
        </p>
        <button onClick={() => forge()}>Enviar para o Combate</button>
        <button
          disabled={!libraryReady || library.length >= 30}
          onClick={() => forge(true)}
        >
          Salvar na Biblioteca
        </button>
        <p role="status" className="combat-warning">
          {libraryMessage}
        </p>
        {!libraryReady && (
          <div>
            <button
              type="button"
              onClick={() => {
                try {
                  const raw = localStorage.getItem(FORGE_LIBRARY_KEY) ?? "[]";
                  const url = URL.createObjectURL(
                    new Blob([raw], { type: "application/json" }),
                  );
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = "biblioteca-recuperacao.json";
                  a.click();
                  setTimeout(() => URL.revokeObjectURL(url), 1000);
                } catch {
                  setLibraryMessage("Não foi possível exportar a biblioteca.");
                }
              }}
            >
              Exportar biblioteca para recuperação
            </button>
            <button
              type="button"
              onClick={() => {
                if (
                  confirm(
                    "Reiniciar a biblioteca local? Exporte uma cópia antes.",
                  )
                ) {
                  try {
                    localStorage.setItem(FORGE_LIBRARY_KEY, "[]");
                    setLibrary([]);
                    setLibraryReady(true);
                  } catch {
                    setLibraryMessage("Armazenamento bloqueado.");
                  }
                }
              }}
            >
              Reiniciar biblioteca
            </button>
          </div>
        )}
        <h2>Minhas Criaturas Salvas · {library.length}/30</h2>
        <div className="gm-presets">
          {library.map((npc) => (
            <article key={npc.id}>
              <h3>{npc.name}</h3>
              <p>
                {npc.stage} · Vida {npc.life} · Karma {npc.karma} · CA {npc.ca}
              </p>
              <button onClick={() => setIncoming(structuredClone(npc))}>
                Enviar para o Combate
              </button>
              <button
                onClick={() => {
                  if (confirm(`Remover ${npc.name} da biblioteca local?`))
                    persistLibrary(library.filter((n) => n.id !== npc.id));
                }}
              >
                Remover
              </button>
            </article>
          ))}
        </div>
        {!library.length && (
          <p>
            Salve uma criatura da Forja para reutilizá-la em outras sessões
            neste navegador.
          </p>
        )}
      </details>
      <section className="gm-tool" id="gm-tools">
        <h2>Juiz de Regras</h2>
        <div className="gm-calculators">
          <article>
            <h3>Votos Vinculativos</h3>
            <label>
              Peso
              <select
                value={weight}
                onChange={(e) => setWeight(Number(e.target.value))}
              >
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n}>{n}</option>
                ))}
              </select>
            </label>
            <p>
              Potência {vow.potency} · CD {vow.dc} · {vow.karma} Karma ·{" "}
              {vow.slots} espaços
            </p>
            <Link href="/regras/16-votos-vinculativos">
              Consultar o Capítulo 16
            </Link>
          </article>
          <article>
            <h3>Saturação Alquímica</h3>
            <label>
              Constituição
              <input
                type="number"
                min={0}
                value={constitution}
                onChange={(e) => setConstitution(num(e.target.value))}
              />
            </label>
            <label>
              Saturação atual
              <input
                type="number"
                min={0}
                value={saturation}
                onChange={(e) => setSaturation(num(e.target.value))}
              />
            </label>
            <p>
              Limiar {alch.tolerance} · excesso {alch.excess} · {alch.label}
              {alch.dc ? ` · CD ${alch.dc}` : ""}
            </p>
            <small>
              CD 14 + Saturação total. Descanso longo seguro e purgadores seguem
              o Capítulo 17.
            </small>
          </article>
          <article>
            <h3>Corrupção e Ruptura</h3>
            <label>
              Linhagem
              <select value={race} onChange={(e) => setRace(e.target.value)}>
                <option>Humano</option>
                <option>Demônio</option>
              </select>
            </label>
            <label>
              Carga efetiva
              <input
                type="number"
                min={0}
                max={10}
                value={charge}
                onChange={(e) => setCharge(Math.min(10, num(e.target.value)))}
              />
            </label>
            <label>
              Cargas temporárias
              <input
                type="number"
                min={0}
                max={10}
                value={temporary}
                onChange={(e) =>
                  setTemporary(Math.min(10, num(e.target.value)))
                }
              />
            </label>
            <label>
              Controle
              <input
                type="number"
                min={0}
                max={3}
                value={control}
                onChange={(e) => setControl(Math.min(3, num(e.target.value)))}
              />
            </label>
            <label>
              Etapa de referência
              <select
                value={stage}
                onChange={(e) => setStage(Number(e.target.value))}
              >
                {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                  <option key={n}>{n}</option>
                ))}
              </select>
            </label>
            <p>
              Controle da Forma CD {corruptionControlDC(corruptionDraft)}.
              Técnicas corruptas CD {corruptionControlDC(corruptionDraft, 16)}.
              Rede: {form.grafts} enxertos. Mutações:{" "}
              {control < 1 ? 0 : form.slots} espaços se houver 7–9 Cargas.
            </p>
            {charge === 10 && (
              <strong className="combat-warning">
                Ruptura: CD 24. Ao terminar: Carga 7, Exausto e Forma bloqueada
                até descanso longo seguro.
              </strong>
            )}
          </article>
        </div>
        <h3>Busca rápida · regras e catálogo</h3>
        <input
          aria-label="Pesquisar regras e itens"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Digite pelo menos duas letras"
        />
        {searchError && <p role="alert">{searchError}</p>}
        <div className="gm-search-results">
          {items.slice(0, 12).map((i) => (
            <article key={i.id}>
              <strong>{i.name}</strong>
              <span>
                {i.spaces} espaços · {i.price}
              </span>
              <p>{i.notes}</p>
            </article>
          ))}
          {rules.slice(0, 12).map((r, i) => (
            <article key={i}>
              <a href={`/regras/${r.chapterSlug}#${r.id}`}>{r.heading}</a>
              <p>{r.text.slice(0, 240)}</p>
            </article>
          ))}
        </div>
      </section>
      <details
        id="gm-reference"
        className="gm-tool"
        onToggle={(event) => setReferenceOpen(event.currentTarget.open)}
      >
        <summary>Consulta de Fichas</summary>
        {referenceOpen && (
          <Suspense fallback={<p role="status">Abrindo consulta…</p>}>
            <EncounterDesk />
            <GeppetoSummons summons={summons} />
          </Suspense>
        )}
      </details>
    </main>
  );
}
