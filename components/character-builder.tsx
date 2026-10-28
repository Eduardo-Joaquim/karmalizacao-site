"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  CircleAlert,
  Copy,
  Heart,
  Link2,
  Loader2,
  Minus,
  Package,
  Plus,
  RotateCcw,
  Save,
  Share2,
  Shield,
  Sparkles,
  Trash2,
  Unlink,
  UserCircle2,
} from "lucide-react";
import { toast } from "sonner";

import { CharacterStepNavigation } from "@/components/character-step-navigation";
import { CharacterPowerEditor } from "@/components/character-power-editor";
import { CharacterSheetView, type DerivedStats } from "@/components/character-sheet-view";
import { ImageUploader } from "@/components/image-uploader";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  ALL_SKILLS,
  ATTRIBUTES,
  BASE_SKILL_POINT_BUDGET,
  CHARACTER_SIZES,
  CLASSES,
  createBlankCharacter,
  normalizeCharacterPayload,
  ORIGINS,
  PATHS,
  RACES,
  SKILL_GROUPS,
  STAGES,
  type AttributeName,
  type CharacterPayload,
  type PointValue,
  type SavedCharacter,
} from "@/lib/character-data";
import {
  canAllocateSkillPoint,
  calculateAutomaticBonuses,
  calculateDerivedStats,
  getSkillTest,
  getSacrificedPoints,
  getVowErrors,
  SIZE_RULES,
  sizeFromHeight,
  getClassAbilityLimit,
  getClassAmplificationLimit,
  getClassDefinition,
  getFinalAttribute,
  getFinalSkill,
  getProgressionRewards,
  getSkillLevelBreakdown,
  type BonusChoiceSlot,
  type SkillTier,
} from "@/lib/character-rules";

function FieldLabel({
  htmlFor,
  children,
  optional,
}: {
  htmlFor: string;
  children: React.ReactNode;
  optional?: boolean;
}) {
  return (
    <Label htmlFor={htmlFor} className="character-label">
      {children}
      {optional ? <small>opcional</small> : null}
    </Label>
  );
}

function PointStepper({
  label,
  value,
  min,
  max,
  onChange,
  disableIncrease,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  disableIncrease?: boolean;
}) {
  return (
    <div className="point-stepper" aria-label={label}>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        aria-label={`Diminuir ${label}`}
      >
        <Minus aria-hidden="true" />
      </Button>
      <output aria-label={`${label}: ${value}`}>{value}</output>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max || disableIncrease}
        aria-label={`Aumentar ${label}`}
      >
        <Plus aria-hidden="true" />
      </Button>
    </div>
  );
}

function SelectField({
  id,
  label,
  value,
  options,
  placeholder,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  options: readonly string[];
  placeholder?: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="character-field">
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <NativeSelect id={id} value={value} onChange={(event) => onChange(event.target.value)}>
        {placeholder ? <NativeSelectOption value="">{placeholder}</NativeSelectOption> : null}
        {options.map((option) => (
          <NativeSelectOption value={option} key={option}>
            {option}
          </NativeSelectOption>
        ))}
      </NativeSelect>
    </div>
  );
}

function AllocationPanel({
  title,
  description,
  slots,
  selections,
  onChange,
  isOptionDisabled,
}: {
  title: string;
  description: string;
  slots: BonusChoiceSlot[];
  selections: string[];
  onChange: (next: string[]) => void;
  isOptionDisabled?: (option: string, slotIndex: number) => boolean;
}) {
  if (!slots.length) return null;

  return (
    <section className="bonus-allocation-panel">
      <div>
        <span>Bônus automático</span>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
      <div className="bonus-allocation-grid">
        {slots.map((slot, index) => {
          const value = selections[index] ?? "";
          return (
            <div className="character-field" key={`${slot.label}-${index}`}>
              <Label htmlFor={`allocation-${title}-${index}`} className="character-label">
                {slot.label} <small>+{slot.value}</small>
              </Label>
              <NativeSelect
                id={`allocation-${title}-${index}`}
                value={value}
                onChange={(event) => {
                  const next = [...selections];
                  next[index] = event.target.value;
                  onChange(next);
                }}
              >
                <NativeSelectOption value="">Distribuir bônus</NativeSelectOption>
                {slot.options.map((option) => (
                  <NativeSelectOption
                    value={option}
                    key={option}
                    disabled={
                      (!slot.allowRepeat &&
                        selections.some(
                          (selection, selectionIndex) =>
                            selectionIndex !== index && selection === option,
                        )) ||
                      Boolean(isOptionDisabled?.(option, index))
                    }
                  >
                    {option}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function selectionsComplete(slots: BonusChoiceSlot[], selections: string[]) {
  return slots.every((_, index) => Boolean(selections[index]));
}

async function fetchOwnedCharacter(id: string, signal?: AbortSignal): Promise<SavedCharacter> {
  const response = await fetch(`/api/personagens?id=${encodeURIComponent(id)}`, { signal });
  const data = (await response.json()) as { character?: SavedCharacter; error?: string };
  if (!response.ok || !data.character) throw new Error(data.error ?? "Não foi possível abrir a ficha.");
  return { ...data.character, payload: normalizeCharacterPayload(data.character.payload) };
}

export function CharacterBuilder({ displayName }: { displayName: string }) {
  const [characters, setCharacters] = useState<SavedCharacter[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draft, setDraft] = useState<CharacterPayload>(() => createBlankCharacter());
  const [activeTab, setActiveTab] = useState("essencia");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<SavedCharacter | null>(null);
  const [openingId, setOpeningId] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadCharacters() {
      try {
        const response = await fetch("/api/personagens", { signal: controller.signal });
        const data = (await response.json()) as {
          characters?: SavedCharacter[];
          error?: string;
        };
        if (!response.ok) throw new Error(data.error ?? "Não foi possível abrir as fichas.");
        const loaded = (data.characters ?? []).map((character) => ({
          ...character,
          payload: normalizeCharacterPayload(character.payload),
        }));
        setCharacters(loaded);
        if (loaded[0]) {
          setActiveId(loaded[0].id);
          try {
            const complete = await fetchOwnedCharacter(loaded[0].id, controller.signal);
            setDraft(complete.payload);
            setCharacters((current) => current.map((character) => character.id === complete.id ? complete : character));
          } catch (error) {
            if (error instanceof DOMException && error.name === "AbortError") throw error;
            setActiveId(null);
            setDraft(createBlankCharacter());
            toast.error(error instanceof Error ? error.message : "Não foi possível abrir a ficha completa.");
          }
        }
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          toast.error(error instanceof Error ? error.message : "Erro ao abrir fichas.");
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void loadCharacters();
    return () => controller.abort();
  }, []);

  const automatic = useMemo(() => calculateAutomaticBonuses(draft), [draft]);
  const classDefinition = useMemo(() => getClassDefinition(draft.className), [draft.className]);
  const progressionCommonSlots: BonusChoiceSlot[] = Array.from(
    { length: automatic.progressionRewards.common },
    (_, index) => ({
      label: `Perícia Comum ${index + 1}`,
      options: ALL_SKILLS,
      value: 1,
      allowRepeat: true,
    }),
  );
  const progressionEvolutiveSlots: BonusChoiceSlot[] = Array.from(
    { length: automatic.progressionRewards.evolutive },
    (_, index) => ({
      label: `Perícia Evolutiva ${index + 1}`,
      options: ALL_SKILLS,
      value: 1,
      allowRepeat: true,
    }),
  );
  const progressionTranscendentalSlots: BonusChoiceSlot[] = Array.from(
    { length: automatic.progressionRewards.transcendental },
    () => ({
      label: "Perícia Transcendental",
      options: ALL_SKILLS,
      value: 1,
      allowRepeat: true,
    }),
  );

  function skillOptionIsDisabled(
    tier: SkillTier,
    slots: BonusChoiceSlot[],
    selections: string[],
    option: string,
    slotIndex: number,
  ) {
    const slot = slots[slotIndex];
    return !canAllocateSkillPoint(
      draft,
      automatic,
      option,
      tier,
      slot?.value ?? 1,
      selections[slotIndex] === option,
    );
  }

  function skillSelectionsComplete(
    tier: SkillTier,
    slots: BonusChoiceSlot[],
    selections: string[],
  ) {
    return slots.every((slot, index) => {
      const selected = selections[index];
      return Boolean(
        selected &&
          slot.options.includes(selected) &&
          canAllocateSkillPoint(
            draft,
            automatic,
            selected,
            tier,
            slot.value,
            true,
          ),
      );
    });
  }

  const baseAttributePoints = useMemo(
    () => ATTRIBUTES.reduce((total, name) => total + draft.attributes[name].base, 0),
    [draft.attributes],
  );
  const baseSkillPoints = useMemo(
    () => ALL_SKILLS.reduce((total, name) => total + (draft.skills[name]?.base ?? 0), 0),
    [draft.skills],
  );

  const derived: DerivedStats = calculateDerivedStats(draft, automatic);

  const allocationChecks = [
    selectionsComplete(automatic.raceAttributeSlots, draft.allocations.raceAttributes),
    skillSelectionsComplete(
      "common",
      automatic.raceSkillSlots,
      draft.allocations.raceSkills,
    ),
    selectionsComplete(automatic.classAttributeSlots, draft.allocations.classAttributes),
    skillSelectionsComplete(
      "common",
      automatic.classSkillSlots,
      draft.allocations.classSkills,
    ),
    selectionsComplete(automatic.stageAttributeSlots, draft.allocations.stageAttributes),
    skillSelectionsComplete(
      "common",
      progressionCommonSlots,
      draft.allocations.progressionCommonSkills,
    ),
    skillSelectionsComplete(
      "evolutive",
      progressionEvolutiveSlots,
      draft.allocations.progressionEvolutiveSkills,
    ),
    skillSelectionsComplete(
      "transcendental",
      progressionTranscendentalSlots,
      draft.allocations.progressionTranscendentalSkills,
    ),
  ];
  const allAllocationsComplete = allocationChecks.every(Boolean);
  const classAbilitiesComplete = classDefinition
    ? draft.classAbilities.length === getClassAbilityLimit(draft.stage)
    : false;

  const completionChecks = [
    Boolean(draft.name.trim() && draft.concept.trim()),
    baseAttributePoints === 10,
    Boolean(draft.origin && draft.race),
    Boolean(draft.className),
    baseSkillPoints === BASE_SKILL_POINT_BUDGET,
    Boolean(draft.affinity && draft.commonLanguage.trim() && draft.bond.trim()),
    allAllocationsComplete,
    classAbilitiesComplete,
  ];
  const completion = Math.round(
    (completionChecks.filter(Boolean).length / completionChecks.length) * 100,
  );

  function commitDraft(next: CharacterPayload) {
    setDraft(next);
    setDirty(true);
  }

  function updateDraft<K extends keyof CharacterPayload>(
    field: K,
    value: CharacterPayload[K],
  ) {
    commitDraft({ ...draft, [field]: value });
  }

  function updateIdentity(field: "race" | "className" | "path" | "stage", value: string) {
    setDraft((current) => {
      let next: CharacterPayload = { ...current, [field]: value };

      if (field === "race") {
        next = {
          ...next,
          racialCustomization: "",
          allocations: {
            ...next.allocations,
            raceAttributes: [],
            raceSkills: [],
          },
        };
      }

      if (field === "className") {
        next = {
          ...next,
          classAbilities: [],
          classAmplifications: [],
          allocations: {
            ...next.allocations,
            classAttributes: [],
            classSkills: [],
            stageAttributes: [],
          },
        };
      }

      if (field === "stage") {
        const abilityLimit = getClassAbilityLimit(value);
        const amplificationLimit = getClassAmplificationLimit(value);
        const stageBonuses = calculateAutomaticBonuses(next);
        const rewards = getProgressionRewards(next.path, value);
        next = {
          ...next,
          classAbilities: next.classAbilities.slice(0, abilityLimit),
          classAmplifications: next.classAmplifications.slice(0, amplificationLimit),
          allocations: {
            ...next.allocations,
            stageAttributes: next.allocations.stageAttributes.slice(
              0,
              stageBonuses.stageAttributeSlots.length,
            ),
            progressionCommonSkills: next.allocations.progressionCommonSkills.slice(
              0,
              rewards.common,
            ),
            progressionEvolutiveSkills: next.allocations.progressionEvolutiveSkills.slice(
              0,
              rewards.evolutive,
            ),
            progressionTranscendentalSkills:
              next.allocations.progressionTranscendentalSkills.slice(
                0,
                rewards.transcendental,
              ),
          },
        };
      }

      if (field === "path") {
        const rewards = getProgressionRewards(value, next.stage);
        next = {
          ...next,
          allocations: {
            ...next.allocations,
            progressionCommonSkills: next.allocations.progressionCommonSkills.slice(
              0,
              rewards.common,
            ),
            progressionEvolutiveSkills: next.allocations.progressionEvolutiveSkills.slice(
              0,
              rewards.evolutive,
            ),
            progressionTranscendentalSkills:
              next.allocations.progressionTranscendentalSkills.slice(
                0,
                rewards.transcendental,
              ),
          },
        };
      }

      return next;
    });
    setDirty(true);
  }

  function updateAllocation(
    field: keyof CharacterPayload["allocations"],
    selections: string[],
  ) {
    commitDraft({
      ...draft,
      allocations: { ...draft.allocations, [field]: selections },
    });
  }

  function updateAttribute(
    attribute: AttributeName,
    kind: keyof PointValue,
    value: number,
  ) {
    commitDraft({
      ...draft,
      attributes: {
        ...draft.attributes,
        [attribute]: { ...draft.attributes[attribute], [kind]: value },
      },
    });
  }

  function updateSkill(skill: string, kind: keyof PointValue, value: number) {
    commitDraft({
      ...draft,
      skills: {
        ...draft.skills,
        [skill]: { ...(draft.skills[skill] ?? { base: 0, bonus: 0 }), [kind]: value },
      },
    });
  }

  async function openCharacter(character: SavedCharacter) {
    if (dirty && !window.confirm("Abrir outra ficha e descartar alterações não salvas?")) {
      return;
    }
    setOpeningId(character.id);
    try {
      const complete = await fetchOwnedCharacter(character.id);
      setActiveId(complete.id);
      setDraft(complete.payload);
      setCharacters((current) => current.map((entry) => entry.id === complete.id ? complete : entry));
      setDirty(false);
      setActiveTab("essencia");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível abrir a ficha.");
    } finally {
      setOpeningId(null);
    }
  }

  function newCharacter() {
    if (dirty && !window.confirm("Criar outra ficha e descartar alterações não salvas?")) {
      return;
    }
    setActiveId(null);
    setDraft(createBlankCharacter());
    setDirty(false);
    setActiveTab("essencia");
  }

  async function saveCharacter(characterToSave: CharacterPayload = draft): Promise<SavedCharacter | null> {
    if (!characterToSave.name.trim()) {
      setActiveTab("essencia");
      toast.error("Dê um nome ao personagem antes de salvar.");
      return null;
    }

    const vowErrors = getVowErrors(characterToSave, calculateAutomaticBonuses(characterToSave));
    if (vowErrors.length) {
      toast.error(vowErrors[0]);
      setActiveTab("poderes");
      return null;
    }

    setSaving(true);
    const id = activeId ?? crypto.randomUUID();
    try {
      const response = await fetch("/api/personagens", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id, name: characterToSave.name.trim(), payload: characterToSave }),
      });
      const data = (await response.json()) as {
        character?: SavedCharacter;
        error?: string;
      };
      if (!response.ok || !data.character) {
        throw new Error(data.error ?? "Não foi possível salvar a ficha.");
      }

      const saved = {
        ...data.character,
        payload: normalizeCharacterPayload(data.character.payload),
      };
      setActiveId(saved.id);
      setDraft(saved.payload);
      setCharacters((current) => [
        saved,
        ...current.filter((character) => character.id !== saved.id),
      ]);
      setDirty(false);
      toast.success("Ficha gravada no arquivo.");
      return saved;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao salvar ficha.");
      return null;
    } finally {
      setSaving(false);
    }
  }

  async function copyShareLink(id: string, token: string) {
    const url = `${window.location.origin}/ficha/${encodeURIComponent(id)}/${encodeURIComponent(token)}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link público copiado.");
    } catch {
      window.prompt("Copie o link público da ficha:", url);
    }
  }

  async function enableOrCopySharing(regenerate = false) {
    if (!draft.name.trim()) {
      setActiveTab("essencia");
      toast.error("Dê um nome ao personagem antes de criar o link.");
      return;
    }
    if (regenerate && !window.confirm("Gerar um novo link? O endereço anterior deixará de funcionar depois que a ficha for salva.")) return;
    const token = regenerate || !draft.sharing.token ? crypto.randomUUID() : draft.sharing.token;
    const saved = await saveCharacter({ ...draft, sharing: { enabled: true, token } });
    if (saved) await copyShareLink(saved.id, token);
  }

  async function disableSharing() {
    if (!draft.sharing.enabled || !window.confirm("Desativar o link público? Quem tiver o endereço não conseguirá mais abrir a ficha.")) return;
    const saved = await saveCharacter({ ...draft, sharing: { ...draft.sharing, enabled: false } });
    if (saved) toast.success("Compartilhamento desativado.");
  }

  async function deleteCharacter() {
    if (!pendingDelete) return;
    try {
      const response = await fetch(
        `/api/personagens?id=${encodeURIComponent(pendingDelete.id)}`,
        { method: "DELETE" },
      );
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Não foi possível excluir a ficha.");

      setCharacters((current) =>
        current.filter((character) => character.id !== pendingDelete.id),
      );
      if (activeId === pendingDelete.id) {
        setActiveId(null);
        setDraft(createBlankCharacter());
        setDirty(false);
      }
      toast.success("Ficha removida do arquivo.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao excluir ficha.");
    } finally {
      setPendingDelete(null);
    }
  }

  const widePage = activeTab === "poderes" || activeTab === "ficha";

  return (
    <main className="site-shell character-main">
      <CharacterStepNavigation activeStep={activeTab} onSelect={setActiveTab} />
      <header className="character-page-heading">
        <div>
          <Badge variant="outline" className="eyebrow-badge">
            <UserCircle2 aria-hidden="true" /> oficina de identidade
          </Badge>
          <p className="hero-kicker">Ficha de {displayName.split(/\s|@/)[0]}</p>
          <h1>Criação de personagem</h1>
          <p>
            Cinco etapas conectadas às regras. Raça, classe e progressão alimentam os
            valores automaticamente; a última página consolida a ficha para uso em jogo.
          </p>
        </div>
        <div className="character-heading-actions">
          <Button type="button" variant="outline" onClick={newCharacter}>
            <Plus aria-hidden="true" /> Nova ficha
          </Button>
          <Button
            type="button"
            className="karma-button"
            onClick={() => void saveCharacter()}
            disabled={saving}
          >
            {saving ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Save aria-hidden="true" />}
            {saving ? "Salvando…" : dirty ? "Salvar alterações" : "Salvar ficha"}
          </Button>
        </div>
      </header>

      <div className="character-workspace" data-wide={widePage}>
        <aside className="character-library" aria-label="Fichas salvas">
          <div className="character-library-heading">
            <span>Minhas fichas</span>
            <Badge variant="outline">{characters.length}</Badge>
          </div>
          {loading ? (
            <div className="character-library-loading">
              <Loader2 className="animate-spin" aria-hidden="true" /> Abrindo arquivo…
            </div>
          ) : characters.length ? (
            <div className="saved-character-list">
              {characters.map((character) => (
                <div className="saved-character-row" data-active={character.id === activeId} key={character.id}>
                  <button type="button" disabled={openingId === character.id} onClick={() => void openCharacter(character)}>
                    {character.payload.portraitImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img className="saved-character-portrait" src={character.payload.portraitImage} alt="" />
                    ) : <span className="saved-character-monogram" aria-hidden="true">{character.name.slice(0, 1).toUpperCase()}</span>}
                    <span>
                      <strong>{character.name}</strong>
                      <small>
                        {[character.payload.race, character.payload.className].filter(Boolean).join(" · ") ||
                          "Conceito em construção"}
                      </small>
                    </span>
                    {openingId === character.id ? <Loader2 className="saved-character-spinner animate-spin" aria-label="Abrindo ficha" /> : null}
                  </button>
                  <Button type="button" variant="ghost" size="icon-sm" onClick={() => setPendingDelete(character)} aria-label={`Excluir ficha de ${character.name}`}>
                    <Trash2 aria-hidden="true" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="character-library-empty">
              <Sparkles aria-hidden="true" />
              <strong>Seu arquivo está vazio.</strong>
              <p>Preencha esta primeira ficha e salve quando estiver pronta.</p>
            </div>
          )}
        </aside>

        <section className="character-editor">
          <Tabs id="character-steps" value={activeTab} onValueChange={setActiveTab}>
            <TabsList variant="line" className="character-tabs-list">
              <TabsTrigger value="essencia">1. Essência</TabsTrigger>
              <TabsTrigger value="atributos">2. Atributos</TabsTrigger>
              <TabsTrigger value="pericias">3. Perícias</TabsTrigger>
              <TabsTrigger value="poderes">4. Poderes</TabsTrigger>
              <TabsTrigger value="ficha">5. Ficha</TabsTrigger>
            </TabsList>

            <TabsContent value="essencia" className="character-tab-panel">
              <div className="form-section-heading">
                <span>01</span>
                <div>
                  <h2>Conceito e identidade</h2>
                  <p>As escolhas feitas aqui alimentam os bônus e recursos das próximas páginas.</p>
                </div>
              </div>

              <div className="character-form-grid two-columns">
                <div className="character-field field-wide">
                  <FieldLabel htmlFor="character-name">Nome</FieldLabel>
                  <Input id="character-name" value={draft.name} maxLength={80} placeholder="Nome do personagem" onChange={(event) => updateDraft("name", event.target.value)} />
                </div>
                <div className="character-field">
                  <FieldLabel htmlFor="character-pronouns" optional>Pronomes</FieldLabel>
                  <Input id="character-pronouns" value={draft.pronouns} maxLength={120} placeholder="ela/dela" onChange={(event) => updateDraft("pronouns", event.target.value)} />
                </div>
                <div className="character-field field-full">
                  <FieldLabel htmlFor="character-concept">Conceito</FieldLabel>
                  <Textarea id="character-concept" value={draft.concept} maxLength={600} placeholder="Uma frase clara: desejo, conflito e imagem central do personagem." onChange={(event) => updateDraft("concept", event.target.value)} />
                </div>
                <div className="field-full">
                  <ImageUploader
                    id="character-portrait"
                    label="Imagem do personagem"
                    value={draft.portraitImage}
                    alt={draft.name ? `Retrato de ${draft.name}` : "Retrato do personagem"}
                    help="PNG, JPG ou WebP. A imagem é reduzida e armazenada junto da ficha; ela aparecerá também no link compartilhado."
                    onChange={(portraitImage) => updateDraft("portraitImage", portraitImage)}
                  />
                </div>
                <div className="character-field">
                  <FieldLabel htmlFor="character-height" optional>Altura em centímetros</FieldLabel>
                  <Input id="character-height" type="number" min={30} max={1000} step={1} value={draft.heightCm ?? ""} placeholder="Ex.: 175" onChange={(event) => {
                    const heightCm = event.target.value === "" ? null : Number(event.target.value);
                    if (heightCm !== null && !Number.isFinite(heightCm)) return;
                    commitDraft({ ...draft, heightCm, size: heightCm === null ? draft.size : sizeFromHeight(heightCm) });
                  }} />
                </div>
                <div className="character-field">
                  <FieldLabel htmlFor="character-size">Tamanho</FieldLabel>
                  <NativeSelect id="character-size" value={draft.size} disabled={draft.heightCm !== null} onChange={(event) => updateDraft("size", event.target.value as CharacterPayload["size"])}>
                    {CHARACTER_SIZES.map((size) => <NativeSelectOption value={size} key={size}>{size} · {SIZE_RULES[size].height}</NativeSelectOption>)}
                  </NativeSelect>
                  <small>Vida base {SIZE_RULES[draft.size].life}; movimento {SIZE_RULES[draft.size].movement > 0 ? "+" : ""}{SIZE_RULES[draft.size].movement} m; CA +{SIZE_RULES[draft.size].armor}. Altura preenchida determina a categoria.</small>
                </div>
                <p className="field-full rule-copy">Fichas antigas sem tamanho usam Médio até revisão com o Mestre. O tamanho mecânico só muda em criação ou transformação aprovada, nunca por roupa, postura ou edição cosmética.</p>
              </div>

              <div className="form-divider" />
              <div className="character-form-grid three-columns">
                <SelectField id="character-origin" label="Origem" value={draft.origin} options={ORIGINS} placeholder="Escolha a origem" onChange={(value) => updateDraft("origin", value)} />
                <SelectField id="character-race" label="Raça" value={draft.race} options={RACES} placeholder="Escolha a raça" onChange={(value) => updateIdentity("race", value)} />
                <SelectField id="character-class" label="Classe primordial" value={draft.className} options={CLASSES} placeholder="Escolha a classe" onChange={(value) => updateIdentity("className", value)} />
                <SelectField id="character-path" label="Caminho de progressão" value={draft.path} options={PATHS} onChange={(value) => updateIdentity("path", value)} />
                <SelectField id="character-stage" label="Etapa atual" value={draft.stage} options={STAGES} onChange={(value) => updateIdentity("stage", value)} />
                <div className="character-field">
                  <FieldLabel htmlFor="character-language">Idioma comum</FieldLabel>
                  <Input id="character-language" value={draft.commonLanguage} maxLength={120} placeholder="Além do idioma de criação" onChange={(event) => updateDraft("commonLanguage", event.target.value)} />
                </div>
                <div className="character-field field-full">
                  <FieldLabel htmlFor="character-bond">Vínculo</FieldLabel>
                  <Textarea id="character-bond" value={draft.bond} maxLength={500} placeholder="Pessoa, comunidade, guilda, culto, casa ou dívida que pode aparecer em jogo." onChange={(event) => updateDraft("bond", event.target.value)} />
                </div>
              </div>

              {automatic.sources.length ? (
                <section className="bonus-source-ledger">
                  <div>
                    <Sparkles aria-hidden="true" />
                    <span>
                      <strong>Bônus conectados</strong>
                      O cálculo será atualizado imediatamente nas próximas etapas.
                    </span>
                  </div>
                  <ul>
                    {automatic.sources.map((source) => (
                      <li key={`${source.label}-${source.detail}`}>
                        <strong>{source.label}</strong>
                        <span>{source.detail}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}
            </TabsContent>

            <TabsContent value="atributos" className="character-tab-panel">
              <div className="form-section-heading">
                <span>02</span>
                <div>
                  <h2>Atributos</h2>
                  <p>Distribua 10 pontos-base; bônus de raça, classe e etapa são somados à parte.</p>
                </div>
                <div className="point-budget" data-complete={baseAttributePoints === 10}>
                  <strong>{10 - baseAttributePoints}</strong>
                  <small>pontos restantes</small>
                </div>
              </div>

              <div className="budget-progress">
                <Progress value={Math.min(100, baseAttributePoints * 10)} />
                <span>{baseAttributePoints}/10 distribuídos</span>
              </div>

              <AllocationPanel title="Raça" description="Escolha onde aplicar os bônus flexíveis da raça." slots={automatic.raceAttributeSlots} selections={draft.allocations.raceAttributes} onChange={(selections) => updateAllocation("raceAttributes", selections)} />
              <AllocationPanel title="Classe" description="A formação inicial da classe define estes bônus." slots={automatic.classAttributeSlots} selections={draft.allocations.classAttributes} onChange={(selections) => updateAllocation("classAttributes", selections)} />
              <AllocationPanel title="Etapas da classe" description={`Bônus acumulados até ${draft.stage}.`} slots={automatic.stageAttributeSlots} selections={draft.allocations.stageAttributes} onChange={(selections) => updateAllocation("stageAttributes", selections)} />

              <div className="attribute-grid">
                {ATTRIBUTES.map((attribute) => {
                  const points = draft.attributes[attribute];
                  const automaticBonus = automatic.attributes[attribute];
                  const total = getFinalAttribute(draft, automatic, attribute);
                  return (
                    <article className="attribute-card" key={attribute}>
                      <div>
                        <span>{attribute.slice(0, 3).toUpperCase()}</span>
                        <h3>{attribute}</h3>
                        <small>
                          Total {total}
                          {automaticBonus ? ` · +${automaticBonus} automático` : ""}
                        </small>
                      </div>
                      <div className="attribute-controls">
                        <div>
                          <label>Base</label>
                          <PointStepper label={`${attribute}, pontos-base`} value={points.base} min={0} max={5} disableIncrease={baseAttributePoints >= 10} onChange={(value) => updateAttribute(attribute, "base", value)} />
                        </div>
                        <div>
                          <label htmlFor={`attribute-bonus-${attribute}`}>Ajuste manual</label>
                          <Input id={`attribute-bonus-${attribute}`} type="number" inputMode="numeric" min={0} max={20} value={points.bonus} onChange={(event) => updateAttribute(attribute, "bonus", Math.max(0, Math.min(20, Number(event.target.value) || 0)))} />
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>

              <aside className="rule-reminder">
                <CircleAlert aria-hidden="true" />
                <p>
                  “Ajuste manual” serve apenas para concessões específicas do mestre. Os bônus
                  conhecidos de raça, classe, grau e Domínio já entram no total automaticamente.
                </p>
              </aside>
            </TabsContent>

            <TabsContent value="pericias" className="character-tab-panel">
              <div className="form-section-heading">
                <span>03</span>
                <div>
                  <h2>Perícias</h2>
                  <p>
                    Distribua {BASE_SKILL_POINT_BUDGET} pontos-base; recompensas e
                    formações são contabilizadas separadamente.
                  </p>
                </div>
                <div
                  className="point-budget"
                  data-complete={baseSkillPoints === BASE_SKILL_POINT_BUDGET}
                >
                  <strong>
                    {Math.max(0, BASE_SKILL_POINT_BUDGET - baseSkillPoints)}
                  </strong>
                  <small>pontos restantes</small>
                </div>
              </div>

              <div className="budget-progress">
                <Progress
                  value={Math.min(
                    100,
                    (baseSkillPoints / BASE_SKILL_POINT_BUDGET) * 100,
                  )}
                />
                <span>
                  {baseSkillPoints}/{BASE_SKILL_POINT_BUDGET} distribuídos
                </span>
              </div>

              <AllocationPanel
                title="Raça"
                description="Bônus Comum: complete nível 1, sem ultrapassar esse teto."
                slots={automatic.raceSkillSlots}
                selections={draft.allocations.raceSkills}
                onChange={(selections) => updateAllocation("raceSkills", selections)}
                isOptionDisabled={(option, index) =>
                  skillOptionIsDisabled(
                    "common",
                    automatic.raceSkillSlots,
                    draft.allocations.raceSkills,
                    option,
                    index,
                  )
                }
              />
              <AllocationPanel
                title="Classe"
                description="Treinamento Comum: complete nível 1, sem ultrapassar esse teto."
                slots={automatic.classSkillSlots}
                selections={draft.allocations.classSkills}
                onChange={(selections) => updateAllocation("classSkills", selections)}
                isOptionDisabled={(option, index) =>
                  skillOptionIsDisabled(
                    "common",
                    automatic.classSkillSlots,
                    draft.allocations.classSkills,
                    option,
                    index,
                  )
                }
              />
              <AllocationPanel
                title="Recompensas Comuns"
                description={`Seu ${draft.path} concede ${automatic.progressionRewards.common} recompensa(s) Comum(ns) até ${draft.stage}. Elas só compram os nível 1.`}
                slots={progressionCommonSlots}
                selections={draft.allocations.progressionCommonSkills}
                onChange={(selections) =>
                  updateAllocation("progressionCommonSkills", selections)
                }
                isOptionDisabled={(option, index) =>
                  skillOptionIsDisabled(
                    "common",
                    progressionCommonSlots,
                    draft.allocations.progressionCommonSkills,
                    option,
                    index,
                  )
                }
              />
              <AllocationPanel
                title="Recompensas Evolutivas"
                description={`Seu caminho concede ${automatic.progressionRewards.evolutive} recompensa(s) Evolutiva(s). Elas só compram os nível 2 de uma Perícia Comum completa.`}
                slots={progressionEvolutiveSlots}
                selections={draft.allocations.progressionEvolutiveSkills}
                onChange={(selections) =>
                  updateAllocation("progressionEvolutiveSkills", selections)
                }
                isOptionDisabled={(option, index) =>
                  skillOptionIsDisabled(
                    "evolutive",
                    progressionEvolutiveSlots,
                    draft.allocations.progressionEvolutiveSkills,
                    option,
                    index,
                  )
                }
              />
              <AllocationPanel
                title="Recompensa Transcendental"
                description="Conquista da Etapa VII: compra somente o nível 3 de uma Perícia no nível 2."
                slots={progressionTranscendentalSlots}
                selections={draft.allocations.progressionTranscendentalSkills}
                onChange={(selections) =>
                  updateAllocation("progressionTranscendentalSkills", selections)
                }
                isOptionDisabled={(option, index) =>
                  skillOptionIsDisabled(
                    "transcendental",
                    progressionTranscendentalSlots,
                    draft.allocations.progressionTranscendentalSkills,
                    option,
                    index,
                  )
                }
              />

              <aside className="rule-reminder">
                <CircleAlert aria-hidden="true" />
                <p>
                  Pontos-base, bônus de raça, bônus de classe, ajustes e recompensas
                  Comuns compartilham o teto do nível 1. Somente pontos Evolutivos
                  compram os nível 2; o ponto Transcendental compra o nível 3.
                  Opções que violariam essa sequência ficam bloqueadas.
                  O bônus Analítico não eleva níveis: vale apenas com Intelecto em
                  perícia mental/social treinada. Prévias sociais com Intelecto
                  pressupõem abordagem racional aprovada, não carisma automático.
                </p>
              </aside>

              <div className="skill-groups">
                {SKILL_GROUPS.map((group) => (
                  <section className="skill-group" key={group.name}>
                    <h3>{group.name}</h3>
                    <div>
                      {group.skills.map((skill) => {
                        const points = draft.skills[skill] ?? { base: 0, bonus: 0 };
                        const breakdown = getSkillLevelBreakdown(draft, automatic, skill);
                        const total = getFinalSkill(draft, automatic, skill);
                        const test = getSkillTest(draft, automatic, skill);
                        const baseLimit = Math.max(
                          0,
                          1 - points.bonus - breakdown.automaticCommon,
                        );
                        const manualLimit = Math.max(
                          0,
                          1 - breakdown.baseCommon - breakdown.automaticCommon,
                        );
                        return (
                          <div
                            className="skill-row"
                            data-invalid={breakdown.hasInvalidPoints}
                            key={skill}
                          >
                            <span>
                              <strong>{skill}</strong>
                              <small>
                                Nível {total} · bônus +{([0, 2, 5, 10][total] ?? 0)}
                                {test.analyticBonus ? ` · análise +${test.analyticBonus}` : ""}
                                {breakdown.sacrificedCommon ? ` · ${breakdown.sacrificedCommon} ponto(s) sacrificado(s)` : ""}
                                {breakdown.automaticCommon
                                  ? ` · +${breakdown.automaticCommon} Comum automático`
                                  : ""}
                                {breakdown.evolutive
                                  ? ` · +${breakdown.evolutive} Evolutivo`
                                  : ""}
                                {breakdown.transcendental
                                  ? ` · +${breakdown.transcendental} Transcendental`
                                  : ""}
                                {breakdown.hasInvalidPoints
                                  ? " · redistribua os pontos incompatíveis"
                                  : ""}
                              </small>
                              {group.name === "Mentais" || group.name === "Sociais" || ["Conjuração", "Comunhão Divina", "Controle da Corrupção"].includes(skill) ? <small className="skill-test-preview">{test.attribute} {test.value}: {test.dice}d20, {test.selection}, +{test.bonus}{group.name === "Sociais" && test.attribute === "Intelecto" ? " · abordagem racional" : ""}{skill === "Conjuração" ? " · contenção comum; uso Vincular exige Presença" : ""}</small> : null}
                            </span>
                            <PointStepper
                              label={`${skill}, pontos-base`}
                              value={points.base}
                              min={getSacrificedPoints(draft, skill)}
                              max={baseLimit}
                              disableIncrease={
                                baseSkillPoints >= BASE_SKILL_POINT_BUDGET
                              }
                              onChange={(value) => updateSkill(skill, "base", value)}
                            />
                            <div className="skill-bonus">
                              <label htmlFor={`skill-bonus-${skill}`}>Ajuste comum</label>
                              <NativeSelect
                                id={`skill-bonus-${skill}`}
                                value={String(Math.min(points.bonus, manualLimit))}
                                onChange={(event) =>
                                  updateSkill(skill, "bonus", Number(event.target.value))
                                }
                              >
                                {Array.from({ length: manualLimit + 1 }, (_, value) => value).map((value) => (
                                  <NativeSelectOption value={String(value)} key={value}>+{value}</NativeSelectOption>
                                ))}
                              </NativeSelect>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="poderes" className="character-tab-panel power-tab-panel">
              <div className="form-section-heading power-page-heading">
                <span>04</span>
                <div>
                  <h2>Poderes e escolhas personalizáveis</h2>
                  <p>Configure todas as fontes da personagem e use os tópicos à direita para navegar.</p>
                </div>
              </div>
              <CharacterPowerEditor draft={draft} automatic={automatic} onChange={commitDraft} />
            </TabsContent>

            <TabsContent value="ficha" className="character-tab-panel sheet-tab-panel">
              <div className="form-section-heading sheet-page-heading">
                <span>05</span>
                <div>
                  <h2>Ficha completa</h2>
                  <p>Visualização consolidada. Volte às etapas anteriores para editar; aqui, somente o inventário está aberto.</p>
                </div>
              </div>
              <section className="character-share-panel" data-enabled={draft.sharing.enabled}>
                <div className="character-share-heading">
                  <span aria-hidden="true"><Share2 /></span>
                  <div><small>Somente visualização</small><h3>Compartilhar esta ficha</h3><p>Qualquer pessoa com o link poderá consultar a ficha, as imagens e o inventário. Ninguém poderá editar ou descobrir o e-mail da conta.</p></div>
                </div>
                {draft.sharing.enabled && activeId && draft.sharing.token ? <>
                  <div className="character-share-link"><Link2 aria-hidden="true" /><Input aria-label="Caminho público da ficha" readOnly value={`/ficha/${activeId}/${draft.sharing.token}`} /></div>
                  <div className="character-share-actions"><Button type="button" onClick={() => void enableOrCopySharing(false)} disabled={saving}><Copy aria-hidden="true" /> Salvar e copiar link</Button><Button type="button" variant="outline" onClick={() => void enableOrCopySharing(true)} disabled={saving}>Gerar novo link</Button><Button type="button" variant="ghost" onClick={() => void disableSharing()} disabled={saving}><Unlink aria-hidden="true" /> Desativar</Button></div>
                </> : <Button type="button" className="karma-button" onClick={() => void enableOrCopySharing(false)} disabled={saving}><Link2 aria-hidden="true" /> Criar e copiar link público</Button>}
              </section>
              <CharacterSheetView draft={draft} automatic={automatic} derived={derived} onChange={commitDraft} />
            </TabsContent>
          </Tabs>
        </section>

        {!widePage ? (
          <aside className="character-summary" aria-label="Resumo da ficha">
            <div className="summary-nameplate">
              <span className="summary-monogram" aria-hidden="true">{(draft.name || "K").slice(0, 1).toUpperCase()}</span>
              <div>
                <strong>{draft.name || "Personagem sem nome"}</strong>
                <small>{[draft.race, draft.className].filter(Boolean).join(" · ") || "Escolhas em construção"}</small>
              </div>
            </div>

            <div className="summary-progress">
              <span><strong>{completion}%</strong> da criação essencial</span>
              <Progress value={completion} />
            </div>

            <div className="derived-stat-grid">
              <div className="derived-stat stat-life"><Heart aria-hidden="true" /><span>Vida</span><strong>{derived.life}</strong></div>
              <div className="derived-stat stat-karma"><Sparkles aria-hidden="true" /><span>Karma</span><strong>{derived.karma}</strong></div>
              <div className="derived-stat stat-armor"><Shield aria-hidden="true" /><span>CA</span><strong>{derived.armor}</strong></div>
              <div className="derived-stat stat-move"><RotateCcw aria-hidden="true" /><span>Movimento</span><strong>{derived.movement}m</strong></div>
              <div className="derived-stat stat-load"><Package aria-hidden="true" /><span>Carga</span><strong>{derived.load}</strong></div>
              <div className="derived-stat"><Shield aria-hidden="true" /><span>Resistência</span><strong>{derived.resistance}</strong></div>
            </div>

            <div className="summary-checklist">
              <h3>Rito de criação</h3>
              {[
                [completionChecks[0], "Conceito e nome"],
                [completionChecks[1], "10 pontos de Atributo"],
                [completionChecks[2], "Origem e raça"],
                [completionChecks[3], "Classe primordial"],
                [
                  completionChecks[4],
                  `${BASE_SKILL_POINT_BUDGET} pontos de Perícia`,
                ],
                [completionChecks[5], "Afinidade, idioma e vínculo"],
                [completionChecks[6], "Bônus distribuídos"],
                [completionChecks[7], "Habilidades de classe"],
              ].map(([complete, label]) => (
                <div data-complete={complete} key={String(label)}>
                  {complete ? <CheckCircle2 aria-hidden="true" /> : <span aria-hidden="true" />}
                  {label}
                </div>
              ))}
            </div>

            <p className="derived-note">
              Vida, Karma, CA, Movimento e Resistência já incluem bônus fixos e escolhas
              válidas de raça, classe, etapa, tamanho e Domínios despertados. CA sem armadura;
              equipamento e efeitos temporários precisam ser aplicados em jogo.
            </p>
          </aside>
        ) : null}
      </div>

      <AlertDialog open={Boolean(pendingDelete)} onOpenChange={(open) => { if (!open) setPendingDelete(null); }}>
        <AlertDialogContent className="character-delete-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir esta ficha?</AlertDialogTitle>
            <AlertDialogDescription>
              “{pendingDelete?.name}” será removida permanentemente do seu arquivo. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={deleteCharacter} variant="destructive">Excluir ficha</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
