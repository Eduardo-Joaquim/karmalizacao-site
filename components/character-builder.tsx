"use client";
import "@/app/corrupted-form.css";
import "@/app/divine.css";
import "@/app/inventory.css";
import "@/app/live-combat.css";
import "@/app/pantheon-portal.css";
import "@/app/table-play.css";

import {
  AllocationPanel,
  FieldLabel,
  PointStepper,
  SelectField,
  selectionsComplete,
} from "@/components/character-fields";
import { useCharacterRecovery } from "@/hooks/use-character-recovery";
import { playerBlessingCatalog as blessingsCatalog } from "@/lib/blessings-filter";
import { PANTHEONS } from "@/lib/character-rules";
import {
  blessingGrants,
  catalogBlessingGrant,
  divineBlessingError,
  withBlessings,
} from "@/lib/divine-blessings";

import {
  CheckCircle2,
  CircleAlert,
  Copy,
  Heart,
  Link2,
  Loader2,
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
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { CharacterCombatShell } from "@/components/character-combat-shell";
import { CharacterPowerEditor } from "@/components/character-power-editor";
import {
  CharacterSheetView,
  type DerivedStats,
} from "@/components/character-sheet-view";
import { CharacterStepNavigation } from "@/components/character-step-navigation";
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
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
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
  calculateAutomaticBonuses,
  calculateDerivedStats,
  canAllocateSkillPoint,
  getClassAbilityLimit,
  getClassAmplificationLimit,
  getClassDefinition,
  getFinalAttribute,
  getFinalSkill,
  getProgressionRewards,
  getSacrificedPoints,
  getSkillLevelBreakdown,
  getSkillTest,
  getVowErrors,
  SIZE_RULES,
  sizeFromHeight,
  skillBonusExplanation,
  type BonusChoiceSlot,
  type SkillTier,
} from "@/lib/character-rules";

async function fetchOwnedCharacter(
  id: string,
  signal?: AbortSignal,
): Promise<SavedCharacter> {
  const response = await fetch(
    `/api/personagens?id=${encodeURIComponent(id)}`,
    { signal },
  );
  const data = (await response.json()) as {
    character?: SavedCharacter;
    error?: string;
  };
  if (!response.ok || !data.character)
    throw new Error(data.error ?? "Não foi possível abrir a ficha.");
  return {
    ...data.character,
    payload: normalizeCharacterPayload(data.character.payload),
  };
}

export function CharacterBuilder({
  displayName,
  authenticated = true,
  initialBlessing,
  openPowers = false,
  storageScope = displayName,
}: {
  displayName: string;
  storageScope?: string;
  authenticated?: boolean;
  initialBlessing?: number;
  openPowers?: boolean;
}) {
  const [characters, setCharacters] = useState<SavedCharacter[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draft, setDraft] = useState<CharacterPayload>(() =>
    createBlankCharacter(),
  );
  const [activeTab, setActiveTab] = useState(
    openPowers ? "poderes" : "essencia",
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<SavedCharacter | null>(
    null,
  );
  const [guestReady, setGuestReady] = useState(false);
  const [openingId, setOpeningId] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const editRevision = useRef(0);
  const opening = useRef<AbortController | null>(null);
  const recovery = useCharacterRecovery(
    storageScope,
    activeId,
    draft,
    dirty,
    authenticated && !loading,
  );
  function exportDraft() {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(draft, null, 2)], { type: "application/json" }),
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "karmalizacao-ficha.json";
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  async function loadMore() {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const response = await fetch(
        `/api/personagens?cursor=${encodeURIComponent(nextCursor)}`,
        { cache: "no-store" },
      );
      const data = (await response.json()) as {
        characters: SavedCharacter[];
        nextCursor?: string | null;
        error?: string;
      };
      if (!response.ok)
        throw Error(data.error ?? "Não foi possível abrir outras fichas.");
      setCharacters((current) => [
        ...current,
        ...data.characters
          .filter(
            (entry: SavedCharacter) =>
              !current.some((old) => old.id === entry.id),
          )
          .map((entry: SavedCharacter) => ({
            ...entry,
            payload: normalizeCharacterPayload(entry.payload),
          })),
      ]);
      setNextCursor(data.nextCursor ?? null);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível carregar as fichas.",
      );
    } finally {
      setLoadingMore(false);
    }
  }
  useEffect(() => () => opening.current?.abort(), []);

  useEffect(() => {
    if (!authenticated) {
      const timer = setTimeout(() => {
        try {
          const value = localStorage.getItem("karmalizacao-guest-draft-v1");
          if (value) setDraft(normalizeCharacterPayload(JSON.parse(value)));
        } catch {
          toast.error("Não foi possível recuperar o rascunho deste navegador.");
        }
        setGuestReady(true);
        setLoading(false);
      }, 0);
      return () => clearTimeout(timer);
    }
    const controller = new AbortController();

    async function loadCharacters() {
      try {
        const response = await fetch("/api/personagens", {
          signal: controller.signal,
        });
        const data = (await response.json()) as {
          nextCursor?: string | null;
          characters?: SavedCharacter[];
          error?: string;
        };
        if (!response.ok)
          throw new Error(data.error ?? "Não foi possível abrir as fichas.");
        const loaded = (data.characters ?? []).map((character) => ({
          ...character,
          payload: normalizeCharacterPayload(character.payload),
        }));
        setCharacters(loaded);
        setNextCursor(data.nextCursor ?? null);
        if (loaded[0]) {
          setActiveId(loaded[0].id);
          try {
            const complete = await fetchOwnedCharacter(
              loaded[0].id,
              controller.signal,
            );
            setDraft(complete.payload);
            setCharacters((current) =>
              current.map((character) =>
                character.id === complete.id ? complete : character,
              ),
            );
          } catch (error) {
            if (error instanceof DOMException && error.name === "AbortError")
              throw error;
            setActiveId(null);
            setDraft(createBlankCharacter());
            toast.error(
              error instanceof Error
                ? error.message
                : "Não foi possível abrir a ficha completa.",
            );
          }
        }
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          toast.error(
            error instanceof Error ? error.message : "Erro ao abrir fichas.",
          );
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void loadCharacters();
    return () => controller.abort();
  }, [authenticated]);

  useEffect(() => {
    if (authenticated || !guestReady) return;
    try {
      localStorage.setItem(
        "karmalizacao-guest-draft-v1",
        JSON.stringify({ ...draft, sharing: { enabled: false, token: "" } }),
      );
    } catch {
      toast.error(
        "O navegador não conseguiu guardar o rascunho. Exporte a ficha para não perder alterações.",
      );
    }
  }, [draft, authenticated, guestReady]);

  const automatic = useMemo(() => calculateAutomaticBonuses(draft), [draft]);
  const classDefinition = useMemo(
    () => getClassDefinition(draft.className),
    [draft.className],
  );
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
    () =>
      ATTRIBUTES.reduce(
        (total, name) => total + draft.attributes[name].base,
        0,
      ),
    [draft.attributes],
  );
  const baseSkillPoints = useMemo(
    () =>
      ALL_SKILLS.reduce(
        (total, name) => total + (draft.skills[name]?.base ?? 0),
        0,
      ),
    [draft.skills],
  );

  const derived: DerivedStats = calculateDerivedStats(draft, automatic);

  const allocationChecks = [
    selectionsComplete(
      automatic.raceAttributeSlots,
      draft.allocations.raceAttributes,
    ),
    skillSelectionsComplete(
      "common",
      automatic.raceSkillSlots,
      draft.allocations.raceSkills,
    ),
    selectionsComplete(
      automatic.classAttributeSlots,
      draft.allocations.classAttributes,
    ),
    skillSelectionsComplete(
      "common",
      automatic.classSkillSlots,
      draft.allocations.classSkills,
    ),
    selectionsComplete(
      automatic.stageAttributeSlots,
      draft.allocations.stageAttributes,
    ),
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
    editRevision.current += 1;
    setDraft(next);
    setDirty(true);
  }

  function updateDraft<K extends keyof CharacterPayload>(
    field: K,
    value: CharacterPayload[K],
  ) {
    commitDraft({ ...draft, [field]: value });
  }

  function updateIdentity(
    field: "race" | "className" | "path" | "stage",
    value: string,
  ) {
    editRevision.current += 1;
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
            humanTraining: undefined,
            humanSignature: undefined,
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
          classAmplifications: next.classAmplifications.slice(
            0,
            amplificationLimit,
          ),
          allocations: {
            ...next.allocations,
            stageAttributes: next.allocations.stageAttributes.slice(
              0,
              stageBonuses.stageAttributeSlots.length,
            ),
            progressionCommonSkills:
              next.allocations.progressionCommonSkills.slice(0, rewards.common),
            progressionEvolutiveSkills:
              next.allocations.progressionEvolutiveSkills.slice(
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
            progressionCommonSkills:
              next.allocations.progressionCommonSkills.slice(0, rewards.common),
            progressionEvolutiveSkills:
              next.allocations.progressionEvolutiveSkills.slice(
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
        [skill]: {
          ...(draft.skills[skill] ?? { base: 0, bonus: 0 }),
          [kind]: value,
        },
      },
    });
  }

  async function openCharacter(character: SavedCharacter) {
    if (saving) {
      toast.info("Aguarde o salvamento antes de abrir outra ficha.");
      return;
    }
    opening.current?.abort();
    if (
      dirty &&
      !window.confirm("Abrir outra ficha e descartar alterações não salvas?")
    ) {
      return;
    }
    const controller = new AbortController();
    opening.current = controller;
    setOpeningId(character.id);
    try {
      const complete = await fetchOwnedCharacter(
        character.id,
        controller.signal,
      );
      if (controller.signal.aborted) return;
      setActiveId(complete.id);
      setDraft(complete.payload);
      setCharacters((current) =>
        current.map((entry) => (entry.id === complete.id ? complete : entry)),
      );
      setDirty(false);
      setActiveTab("essencia");
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError"))
        toast.error(
          error instanceof Error
            ? error.message
            : "Não foi possível abrir a ficha.",
        );
    } finally {
      if (!controller.signal.aborted) setOpeningId(null);
    }
  }

  function newCharacter() {
    if (saving) {
      toast.info("Aguarde o salvamento antes de criar outra ficha.");
      return;
    }
    opening.current?.abort();
    setOpeningId(null);
    if (
      dirty &&
      !window.confirm("Criar outra ficha e descartar alterações não salvas?")
    ) {
      return;
    }
    setActiveId(null);
    setDraft(createBlankCharacter());
    setDirty(false);
    setActiveTab("essencia");
  }

  async function saveCharacter(
    characterToSave: CharacterPayload = draft,
  ): Promise<SavedCharacter | null> {
    if (!characterToSave.name.trim()) {
      setActiveTab("essencia");
      toast.error("Dê um nome ao personagem antes de salvar.");
      return null;
    }

    const blessingError = divineBlessingError(characterToSave.divine);
    if (blessingError) {
      toast.error(blessingError);
      setActiveTab("poderes");
      return null;
    }

    const vowErrors = getVowErrors(
      characterToSave,
      calculateAutomaticBonuses(characterToSave),
    );
    if (vowErrors.length) {
      toast.error(vowErrors[0]);
      setActiveTab("poderes");
      return null;
    }

    if (!authenticated) {
      try {
        localStorage.setItem(
          "karmalizacao-guest-draft-v1",
          JSON.stringify({
            ...characterToSave,
            sharing: { enabled: false, token: "" },
          }),
        );
        setDirty(false);
        toast.success(
          "Rascunho salvo neste navegador. Entre para salvar na nuvem ou compartilhar.",
        );
      } catch {
        toast.error("Não foi possível salvar o rascunho neste navegador.");
      }
      return null;
    }
    if (saving || openingId) return null;
    const sentRevision = editRevision.current;
    setSaving(true);
    const id = activeId ?? crypto.randomUUID();
    try {
      const response = await fetch("/api/personagens", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          id,
          name: characterToSave.name.trim(),
          payload: characterToSave,
          baseRevision: characters.find(
            (character) => character.id === activeId,
          )?.revision,
        }),
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
      if (editRevision.current === sentRevision) {
        setDraft(saved.payload);
        setDirty(false);
        recovery.clear();
      }
      setCharacters((current) => [
        saved,
        ...current.filter((character) => character.id !== saved.id),
      ]);
      toast.success("Ficha gravada no arquivo.");
      return saved;
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao salvar ficha.",
      );
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
    if (!authenticated) {
      toast.error(
        "Entre na conta para compartilhar sua ficha. O rascunho permanece neste navegador.",
      );
      return;
    }
    if (!draft.name.trim()) {
      setActiveTab("essencia");
      toast.error("Dê um nome ao personagem antes de criar o link.");
      return;
    }
    if (
      regenerate &&
      !window.confirm(
        "Gerar um novo link? O endereço anterior deixará de funcionar depois que a ficha for salva.",
      )
    )
      return;
    const token =
      regenerate || !draft.sharing.token
        ? crypto.randomUUID()
        : draft.sharing.token;
    const saved = await saveCharacter({
      ...draft,
      sharing: { enabled: true, token },
    });
    if (saved) await copyShareLink(saved.id, token);
  }

  async function disableSharing() {
    if (
      !draft.sharing.enabled ||
      !window.confirm(
        "Desativar o link público? Quem tiver o endereço não conseguirá mais abrir a ficha.",
      )
    )
      return;
    const saved = await saveCharacter({
      ...draft,
      sharing: { ...draft.sharing, enabled: false },
    });
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
      if (!response.ok)
        throw new Error(data.error ?? "Não foi possível excluir a ficha.");

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
      toast.error(
        error instanceof Error ? error.message : "Erro ao excluir ficha.",
      );
    } finally {
      setPendingDelete(null);
    }
  }

  const requestedBlessing = blessingsCatalog
    .flatMap((p) =>
      p.deities.flatMap((god) =>
        god.blessings.map((blessing) => ({
          blessing,
          god,
          pantheon: PANTHEONS[p.id - 1],
        })),
      ),
    )
    .find((entry) => entry.blessing.id === initialBlessing);
  const [dismissedBlessing, dismissBlessing] = useState(false);
  function acceptCatalogBlessing() {
    if (!requestedBlessing) return;
    const grants = blessingGrants(draft.divine);
    const grant = catalogBlessingGrant(
      requestedBlessing.blessing,
      requestedBlessing.god,
      requestedBlessing.pantheon,
    );
    if (grants.some((value) => value.id === grant.id)) {
      dismissBlessing(true);
      return;
    }
    if (grants.length >= 8) {
      toast.error("A ficha aceita até oito Bênçãos.");
      return;
    }
    const expression =
      draft.divine.expression === "Comunhão Divina"
        ? "Bênção + Comunhão Divina"
        : draft.divine.expression;
    commitDraft({
      ...draft,
      divine: withBlessings({ ...draft.divine, enabled: true, expression }, [
        ...grants,
        grant,
      ]),
    });
    dismissBlessing(true);
  }
  const widePage = activeTab === "poderes" || activeTab === "ficha";

  return (
    <main className="site-shell character-main">
      <CharacterCombatShell
        draft={draft}
        onChange={setDraft}
        id={activeId}
        onShare={() => void enableOrCopySharing()}
      >
        {(send) => (
          <>
            {authenticated && (
              <aside className="guest-notice">
                <button type="button" onClick={exportDraft}>
                  Exportar cópia da ficha
                </button>
                {recovery.available && (
                  <button
                    type="button"
                    onClick={() => {
                      if (
                        dirty &&
                        !confirm(
                          "Substituir este rascunho pela cópia recuperada?",
                        )
                      )
                        return;
                      const restored = recovery.recover();
                      if (restored) commitDraft(restored);
                    }}
                  >
                    Recuperar alterações deste navegador
                  </button>
                )}
                {recovery.error && <p role="alert">{recovery.error}</p>}
              </aside>
            )}
            {!authenticated && (
              <aside className="guest-notice">
                <strong>Modo visitante</strong>
                <p>
                  Experimente a criação completa. Seu rascunho fica somente
                  neste navegador.
                </p>
                <a
                  href="/signin-with-chatgpt?return_to=%2Fpersonagem"
                  target="_top"
                >
                  Entrar para salvar na nuvem
                </a>
                <button
                  type="button"
                  onClick={() => {
                    const blob = new Blob([JSON.stringify(draft, null, 2)], {
                      type: "application/json",
                    });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = "karmalizacao-ficha.json";
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                >
                  Exportar rascunho
                </button>
              </aside>
            )}
            <CharacterStepNavigation
              activeStep={activeTab}
              onSelect={setActiveTab}
            />
            <header className="character-page-heading">
              <div>
                <Badge variant="outline" className="eyebrow-badge">
                  <UserCircle2 aria-hidden="true" /> oficina de identidade
                </Badge>
                <p className="hero-kicker">
                  Ficha de {displayName.split(/\s|@/)[0]}
                </p>
                <h1>Criação de personagem</h1>
                <p>
                  Cinco etapas conectadas às regras. Raça, classe e progressão
                  alimentam os valores automaticamente; a última página
                  consolida a ficha para uso em jogo.
                </p>
              </div>
              <div className="character-heading-actions">
                {authenticated && !activeId && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      let raw: string | null;
                      try {
                        raw = localStorage.getItem(
                          "karmalizacao-guest-draft-v1",
                        );
                      } catch {
                        toast.error(
                          "O navegador bloqueou o acesso ao rascunho.",
                        );
                        return;
                      }
                      if (!raw) {
                        toast.error(
                          "Nenhum rascunho de visitante encontrado neste navegador.",
                        );
                        return;
                      }
                      if (
                        dirty &&
                        !window.confirm(
                          "Abrir o rascunho de visitante e descartar alterações não salvas?",
                        )
                      )
                        return;
                      try {
                        const restored = normalizeCharacterPayload(
                          JSON.parse(raw),
                        );
                        setActiveId(null);
                        commitDraft({
                          ...restored,
                          sharing: { enabled: false, token: "" },
                        });
                        setActiveTab("ficha");
                      } catch {
                        toast.error("O rascunho não pôde ser aberto.");
                      }
                    }}
                  >
                    Recuperar rascunho visitante
                  </Button>
                )}
                <Button type="button" variant="outline" onClick={newCharacter}>
                  <Plus aria-hidden="true" /> Nova ficha
                </Button>
                <Button
                  type="button"
                  className="karma-button"
                  onClick={() => void saveCharacter()}
                  disabled={saving}
                >
                  {saving ? (
                    <Loader2 className="animate-spin" aria-hidden="true" />
                  ) : (
                    <Save aria-hidden="true" />
                  )}
                  {saving
                    ? "Salvando…"
                    : dirty
                      ? "Salvar alterações"
                      : "Salvar ficha"}
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
                    <Loader2 className="animate-spin" aria-hidden="true" />{" "}
                    Abrindo arquivo…
                  </div>
                ) : characters.length ? (
                  <div className="saved-character-list">
                    {characters.map((character) => (
                      <div
                        className="saved-character-row"
                        data-active={character.id === activeId}
                        key={character.id}
                      >
                        <button
                          type="button"
                          disabled={
                            Boolean(openingId) || saving || character.invalid
                          }
                          onClick={() => void openCharacter(character)}
                        >
                          {character.payload.portraitImage ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              className="saved-character-portrait"
                              src={character.payload.portraitImage}
                              alt=""
                            />
                          ) : (
                            <span
                              className="saved-character-monogram"
                              aria-hidden="true"
                            >
                              {character.name.slice(0, 1).toUpperCase()}
                            </span>
                          )}
                          <span>
                            <strong>{character.name}</strong>
                            <small>
                              {[
                                character.payload.race,
                                character.payload.className,
                              ]
                                .filter(Boolean)
                                .join(" · ") || "Conceito em construção"}
                            </small>
                          </span>
                          {openingId === character.id ? (
                            <Loader2
                              className="saved-character-spinner animate-spin"
                              aria-label="Abrindo ficha"
                            />
                          ) : null}
                        </button>
                        {character.invalid && (
                          <a
                            href={`/api/personagens?id=${encodeURIComponent(character.id)}&export=raw`}
                          >
                            Exportar ficha para recuperação
                          </a>
                        )}
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => setPendingDelete(character)}
                          disabled={saving}
                          aria-label={`Excluir ficha de ${character.name}`}
                        >
                          <Trash2 aria-hidden="true" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="character-library-empty">
                    <Sparkles aria-hidden="true" />
                    <strong>Seu arquivo está vazio.</strong>
                    <p>
                      Preencha esta primeira ficha e salve quando estiver
                      pronta.
                    </p>
                  </div>
                )}
                {nextCursor && (
                  <Button
                    type="button"
                    disabled={loadingMore}
                    onClick={() => void loadMore()}
                  >
                    {loadingMore ? "Carregando…" : "Carregar mais fichas"}
                  </Button>
                )}
              </aside>

              <section className="character-editor">
                <Tabs
                  id="character-steps"
                  value={activeTab}
                  onValueChange={setActiveTab}
                >
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
                        <p>
                          As escolhas feitas aqui alimentam os bônus e recursos
                          das próximas páginas.
                        </p>
                      </div>
                    </div>

                    <div className="character-form-grid two-columns">
                      <div className="character-field field-wide">
                        <FieldLabel htmlFor="character-name">Nome</FieldLabel>
                        <Input
                          id="character-name"
                          value={draft.name}
                          maxLength={80}
                          placeholder="Nome do personagem"
                          onChange={(event) =>
                            updateDraft("name", event.target.value)
                          }
                        />
                      </div>
                      <div className="character-field">
                        <FieldLabel htmlFor="character-pronouns" optional>
                          Pronomes
                        </FieldLabel>
                        <Input
                          id="character-pronouns"
                          value={draft.pronouns}
                          maxLength={120}
                          placeholder="ela/dela"
                          onChange={(event) =>
                            updateDraft("pronouns", event.target.value)
                          }
                        />
                      </div>
                      <div className="character-field field-full">
                        <FieldLabel htmlFor="character-concept">
                          Conceito
                        </FieldLabel>
                        <Textarea
                          id="character-concept"
                          value={draft.concept}
                          maxLength={600}
                          placeholder="Uma frase clara: desejo, conflito e imagem central do personagem."
                          onChange={(event) =>
                            updateDraft("concept", event.target.value)
                          }
                        />
                      </div>
                      <div className="field-full">
                        <ImageUploader
                          id="character-portrait"
                          label="Imagem do personagem"
                          value={draft.portraitImage}
                          alt={
                            draft.name
                              ? `Retrato de ${draft.name}`
                              : "Retrato do personagem"
                          }
                          help="PNG, JPG ou WebP. A imagem é reduzida e armazenada junto da ficha; ela aparecerá também no link compartilhado."
                          onChange={(portraitImage) =>
                            updateDraft("portraitImage", portraitImage)
                          }
                        />
                      </div>
                      <div className="character-field">
                        <FieldLabel htmlFor="character-height" optional>
                          Altura em centímetros
                        </FieldLabel>
                        <Input
                          id="character-height"
                          type="number"
                          min={30}
                          max={1000}
                          step={1}
                          value={draft.heightCm ?? ""}
                          placeholder="Ex.: 175"
                          onChange={(event) => {
                            const heightCm =
                              event.target.value === ""
                                ? null
                                : Number(event.target.value);
                            if (heightCm !== null && !Number.isFinite(heightCm))
                              return;
                            commitDraft({
                              ...draft,
                              heightCm,
                              size:
                                heightCm === null
                                  ? draft.size
                                  : sizeFromHeight(heightCm),
                            });
                          }}
                        />
                      </div>
                      <div className="character-field">
                        <FieldLabel htmlFor="character-size">
                          Tamanho
                        </FieldLabel>
                        <NativeSelect
                          id="character-size"
                          value={draft.size}
                          disabled={draft.heightCm !== null}
                          onChange={(event) =>
                            updateDraft(
                              "size",
                              event.target.value as CharacterPayload["size"],
                            )
                          }
                        >
                          {CHARACTER_SIZES.map((size) => (
                            <NativeSelectOption value={size} key={size}>
                              {size} · {SIZE_RULES[size].height}
                            </NativeSelectOption>
                          ))}
                        </NativeSelect>
                        <small>
                          Vida base {SIZE_RULES[draft.size].life}; movimento{" "}
                          {SIZE_RULES[draft.size].movement > 0 ? "+" : ""}
                          {SIZE_RULES[draft.size].movement} m; CA +
                          {SIZE_RULES[draft.size].armor}. Altura preenchida
                          determina a categoria.
                        </small>
                      </div>
                      <p className="field-full rule-copy">
                        Fichas antigas sem tamanho usam Médio até revisão com o
                        Mestre. O tamanho mecânico só muda em criação ou
                        transformação aprovada, nunca por roupa, postura ou
                        edição cosmética.
                      </p>
                    </div>

                    <div className="form-divider" />
                    <div className="character-form-grid three-columns">
                      <SelectField
                        id="character-origin"
                        label="Origem"
                        value={draft.origin}
                        options={ORIGINS}
                        placeholder="Escolha a origem"
                        onChange={(value) => updateDraft("origin", value)}
                      />
                      <SelectField
                        id="character-race"
                        label="Raça"
                        value={draft.race}
                        options={RACES}
                        placeholder="Escolha a raça"
                        onChange={(value) => updateIdentity("race", value)}
                      />
                      <SelectField
                        id="character-class"
                        label="Classe primordial"
                        value={draft.className}
                        options={CLASSES}
                        placeholder="Escolha a classe"
                        onChange={(value) => updateIdentity("className", value)}
                      />
                      <SelectField
                        id="character-path"
                        label="Caminho de progressão"
                        value={draft.path}
                        options={PATHS}
                        onChange={(value) => updateIdentity("path", value)}
                      />
                      <SelectField
                        id="character-stage"
                        label="Etapa atual"
                        value={draft.stage}
                        options={STAGES}
                        onChange={(value) => updateIdentity("stage", value)}
                      />
                      <div className="character-field">
                        <FieldLabel htmlFor="character-language">
                          Idioma comum
                        </FieldLabel>
                        <Input
                          id="character-language"
                          value={draft.commonLanguage}
                          maxLength={120}
                          placeholder="Além do idioma de criação"
                          onChange={(event) =>
                            updateDraft("commonLanguage", event.target.value)
                          }
                        />
                      </div>
                      <div className="character-field field-full">
                        <FieldLabel htmlFor="character-bond">
                          Vínculo
                        </FieldLabel>
                        <Textarea
                          id="character-bond"
                          value={draft.bond}
                          maxLength={500}
                          placeholder="Pessoa, comunidade, guilda, culto, casa ou dívida que pode aparecer em jogo."
                          onChange={(event) =>
                            updateDraft("bond", event.target.value)
                          }
                        />
                      </div>
                    </div>

                    {automatic.sources.length ? (
                      <section className="bonus-source-ledger">
                        <div>
                          <Sparkles aria-hidden="true" />
                          <span>
                            <strong>Bônus conectados</strong>O cálculo será
                            atualizado imediatamente nas próximas etapas.
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

                  <TabsContent
                    value="atributos"
                    className="character-tab-panel"
                  >
                    <div className="form-section-heading">
                      <span>02</span>
                      <div>
                        <h2>Atributos</h2>
                        <p>
                          Distribua 10 pontos-base; bônus de raça, classe e
                          etapa são somados à parte.
                        </p>
                      </div>
                      <div
                        className="point-budget"
                        data-complete={baseAttributePoints === 10}
                      >
                        <strong>{10 - baseAttributePoints}</strong>
                        <small>pontos restantes</small>
                      </div>
                    </div>

                    <div className="budget-progress">
                      <Progress
                        value={Math.min(100, baseAttributePoints * 10)}
                      />
                      <span>{baseAttributePoints}/10 distribuídos</span>
                    </div>

                    <AllocationPanel
                      title="Raça"
                      description="Escolha onde aplicar os bônus flexíveis da raça."
                      slots={automatic.raceAttributeSlots}
                      selections={draft.allocations.raceAttributes}
                      onChange={(selections) =>
                        updateAllocation("raceAttributes", selections)
                      }
                    />
                    <AllocationPanel
                      title="Classe"
                      description="A formação inicial da classe define estes bônus."
                      slots={automatic.classAttributeSlots}
                      selections={draft.allocations.classAttributes}
                      onChange={(selections) =>
                        updateAllocation("classAttributes", selections)
                      }
                    />
                    <AllocationPanel
                      title="Etapas da classe"
                      description={`Bônus acumulados até ${draft.stage}.`}
                      slots={automatic.stageAttributeSlots}
                      selections={draft.allocations.stageAttributes}
                      onChange={(selections) =>
                        updateAllocation("stageAttributes", selections)
                      }
                    />

                    <div className="attribute-grid">
                      {ATTRIBUTES.map((attribute) => {
                        const points = draft.attributes[attribute];
                        const automaticBonus = automatic.attributes[attribute];
                        const total = getFinalAttribute(
                          draft,
                          automatic,
                          attribute,
                        );
                        return (
                          <article className="attribute-card" key={attribute}>
                            <div>
                              <span>{attribute.slice(0, 3).toUpperCase()}</span>
                              <h3>{attribute}</h3>
                              <div className="attribute-result">
                                <strong>{total}</strong>
                                <span>
                                  {total <= 0
                                    ? "1d20 − 4"
                                    : `${Math.ceil(total / 2)}d20`}
                                </span>
                              </div>
                              <small>
                                {automaticBonus
                                  ? `+${automaticBonus} de bônus`
                                  : ""}
                              </small>
                            </div>
                            <div className="attribute-controls">
                              <div>
                                <label>Base</label>
                                <PointStepper
                                  label={`${attribute}, pontos-base`}
                                  value={points.base}
                                  min={0}
                                  max={5}
                                  disableIncrease={baseAttributePoints >= 10}
                                  onChange={(value) =>
                                    updateAttribute(attribute, "base", value)
                                  }
                                />
                              </div>
                              <div>
                                <label htmlFor={`attribute-bonus-${attribute}`}>
                                  Ajuste manual
                                </label>
                                <Input
                                  id={`attribute-bonus-${attribute}`}
                                  type="number"
                                  inputMode="numeric"
                                  min={0}
                                  max={20}
                                  value={points.bonus}
                                  onChange={(event) =>
                                    updateAttribute(
                                      attribute,
                                      "bonus",
                                      Math.max(
                                        0,
                                        Math.min(
                                          20,
                                          Number(event.target.value) || 0,
                                        ),
                                      ),
                                    )
                                  }
                                />
                              </div>
                            </div>
                          </article>
                        );
                      })}
                    </div>

                    <aside className="rule-reminder">
                      <CircleAlert aria-hidden="true" />
                      <p>
                        “Ajuste manual” serve apenas para concessões específicas
                        do mestre. Os bônus conhecidos de raça, classe, grau e
                        Domínio já entram no total automaticamente.
                      </p>
                    </aside>
                  </TabsContent>

                  <TabsContent value="pericias" className="character-tab-panel">
                    <div className="form-section-heading">
                      <span>03</span>
                      <div>
                        <h2>Perícias</h2>
                        <p>
                          Distribua {BASE_SKILL_POINT_BUDGET} pontos-base;
                          recompensas e formações são contabilizadas
                          separadamente.
                        </p>
                      </div>
                      <div
                        className="point-budget"
                        data-complete={
                          baseSkillPoints === BASE_SKILL_POINT_BUDGET
                        }
                      >
                        <strong>
                          {Math.max(
                            0,
                            BASE_SKILL_POINT_BUDGET - baseSkillPoints,
                          )}
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

                    <div className="skill-allocation-grid">
                      <AllocationPanel
                        title="Raça"
                        description="Bônus Comum: complete nível 1, sem ultrapassar esse teto."
                        slots={automatic.raceSkillSlots}
                        selections={draft.allocations.raceSkills}
                        onChange={(selections) =>
                          updateAllocation("raceSkills", selections)
                        }
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
                        onChange={(selections) =>
                          updateAllocation("classSkills", selections)
                        }
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
                        description={`Caminho ${draft.path} · ${automatic.progressionRewards.common} até ${draft.stage}. Use cada recompensa para completar o nível 1 de uma Perícia Comum.`}
                        slots={progressionCommonSlots}
                        selections={draft.allocations.progressionCommonSkills}
                        onChange={(selections) =>
                          updateAllocation(
                            "progressionCommonSkills",
                            selections,
                          )
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
                        description={`Seu caminho concede ${automatic.progressionRewards.evolutive}. Use cada recompensa para elevar uma Perícia Comum do nível 1 ao nível 2.`}
                        slots={progressionEvolutiveSlots}
                        selections={
                          draft.allocations.progressionEvolutiveSkills
                        }
                        onChange={(selections) =>
                          updateAllocation(
                            "progressionEvolutiveSkills",
                            selections,
                          )
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
                        selections={
                          draft.allocations.progressionTranscendentalSkills
                        }
                        onChange={(selections) =>
                          updateAllocation(
                            "progressionTranscendentalSkills",
                            selections,
                          )
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
                          Pontos-base, bônus de raça, bônus de classe, ajustes e
                          recompensas Comuns compartilham o teto do nível 1.
                          Somente pontos Evolutivos compram os nível 2; o ponto
                          Transcendental compra o nível 3. Opções que violariam
                          essa sequência ficam bloqueadas. O bônus Analítico não
                          eleva níveis: vale apenas com Intelecto em perícia
                          mental/social treinada. Prévias sociais com Intelecto
                          pressupõem abordagem racional aprovada, não carisma
                          automático.
                        </p>
                      </aside>
                    </div>
                    <div className="skill-groups">
                      {SKILL_GROUPS.map((group) => (
                        <section className="skill-group" key={group.name}>
                          <h3>{group.name}</h3>
                          <div>
                            {group.skills.map((skill) => {
                              const points = draft.skills[skill] ?? {
                                base: 0,
                                bonus: 0,
                              };
                              const breakdown = getSkillLevelBreakdown(
                                draft,
                                automatic,
                                skill,
                              );
                              const total = getFinalSkill(
                                draft,
                                automatic,
                                skill,
                              );
                              const test = getSkillTest(
                                draft,
                                automatic,
                                skill,
                              );
                              const baseLimit = Math.max(
                                0,
                                1 - points.bonus - breakdown.automaticCommon,
                              );
                              const manualLimit = Math.max(
                                0,
                                1 -
                                  breakdown.baseCommon -
                                  breakdown.automaticCommon,
                              );
                              return (
                                <div
                                  className="skill-row"
                                  data-invalid={breakdown.hasInvalidPoints}
                                  key={skill}
                                >
                                  <div className="skill-row-head">
                                    <strong>{skill}</strong>
                                    <small
                                      className="skill-row-training"
                                      data-trained={total > 0}
                                    >
                                      {
                                        [
                                          "Destreinado",
                                          "Treinado +2",
                                          "Veterano +5",
                                          "Transcendental +10",
                                        ][total]
                                      }
                                    </small>
                                  </div>
                                  <small
                                    className="skill-test-preview"
                                    title={skillBonusExplanation(test)}
                                  >
                                    {test.attribute} ·{" "}
                                    <span>
                                      {test.selection === "menor"
                                        ? "menor de "
                                        : ""}
                                      {test.dice}d20{" "}
                                      {test.bonus < 0 ? "−" : "+"}{" "}
                                      {Math.abs(test.bonus)}
                                    </span>
                                  </small>
                                  {test.value === 0 && (
                                    <small className="skill-row-notice">
                                      Atributo 0: −4, mesmo com treinamento.
                                    </small>
                                  )}
                                  {(breakdown.hasInvalidPoints ||
                                    breakdown.sacrificedCommon > 0) && (
                                    <small className="skill-row-notice">
                                      {[
                                        breakdown.hasInvalidPoints &&
                                          "Revise os pontos",
                                        breakdown.sacrificedCommon > 0 &&
                                          `${breakdown.sacrificedCommon} ponto(s) suspenso(s)`,
                                      ]
                                        .filter(Boolean)
                                        .join(" · ")}
                                    </small>
                                  )}
                                  <div className="skill-row-inputs">
                                    <div className="skill-input-field">
                                      <span>Pontos-base</span>
                                      <PointStepper
                                        label={`${skill}, pontos-base`}
                                        value={points.base}
                                        min={getSacrificedPoints(draft, skill)}
                                        max={baseLimit}
                                        disableIncrease={
                                          baseSkillPoints >=
                                          BASE_SKILL_POINT_BUDGET
                                        }
                                        onChange={(value) =>
                                          updateSkill(skill, "base", value)
                                        }
                                      />
                                    </div>
                                    <div className="skill-input-field skill-bonus">
                                      <label htmlFor={`skill-bonus-${skill}`}>
                                        Ajuste
                                      </label>
                                      <NativeSelect
                                        id={`skill-bonus-${skill}`}
                                        aria-label={`Ajuste de ${skill}`}
                                        value={String(
                                          Math.min(points.bonus, manualLimit),
                                        )}
                                        onChange={(event) =>
                                          updateSkill(
                                            skill,
                                            "bonus",
                                            Number(event.target.value),
                                          )
                                        }
                                      >
                                        {Array.from(
                                          { length: manualLimit + 1 },
                                          (_, value) => (
                                            <NativeSelectOption
                                              value={String(value)}
                                              key={value}
                                            >
                                              +{value}
                                            </NativeSelectOption>
                                          ),
                                        )}
                                      </NativeSelect>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </section>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent
                    value="poderes"
                    className="character-tab-panel power-tab-panel"
                  >
                    <div className="form-section-heading power-page-heading">
                      <span>04</span>
                      <div>
                        <h2>Poderes e escolhas personalizáveis</h2>
                        <p>
                          Configure as fontes de poder da personagem e use o
                          índice para ir direto a cada seção.
                        </p>
                      </div>
                    </div>
                    {requestedBlessing && !dismissedBlessing && (
                      <div className="guest-notice">
                        <strong>{requestedBlessing.blessing.title}</strong>
                        <p>
                          Outorga de {requestedBlessing.god.name}. Adicione ao
                          rascunho aberto e escolha seu atributo regente.
                        </p>
                        <button
                          type="button"
                          disabled={loading}
                          onClick={acceptCatalogBlessing}
                        >
                          Adicionar Bênção à ficha
                        </button>
                      </div>
                    )}
                    <CharacterPowerEditor
                      draft={draft}
                      automatic={automatic}
                      onChange={commitDraft}
                    />
                  </TabsContent>

                  <TabsContent
                    value="ficha"
                    className="character-tab-panel sheet-tab-panel"
                  >
                    <div className="form-section-heading sheet-page-heading">
                      <span>05</span>
                      <div>
                        <h2>Ficha completa</h2>
                        <p>
                          Visualização consolidada. Ajuste os recursos de
                          combate e o inventário aqui; edite as demais escolhas
                          nas etapas anteriores.
                        </p>
                      </div>
                    </div>
                    <section
                      className="character-share-panel"
                      data-enabled={draft.sharing.enabled}
                    >
                      <div className="character-share-heading">
                        <span aria-hidden="true">
                          <Share2 />
                        </span>
                        <div>
                          <small>
                            Modo Jogo · Recursos e Inventário Editáveis ·
                            Criação Protegida
                          </small>
                          <h3>Compartilhar esta ficha</h3>
                          <p>
                            Quem possui o link pode consultar a ficha, ajustar
                            recursos e usar itens do inventário. A criação
                            permanece protegida e o e-mail da conta não é
                            exibido. Revogue ou renove o link para encerrar o
                            acesso.
                          </p>
                        </div>
                      </div>
                      {draft.sharing.enabled &&
                      activeId &&
                      draft.sharing.token ? (
                        <>
                          <div className="character-share-link">
                            <Link2 aria-hidden="true" />
                            <Input
                              aria-label="Caminho público da ficha"
                              readOnly
                              value={`/ficha/${activeId}/${draft.sharing.token}`}
                            />
                          </div>
                          <div className="character-share-actions">
                            <Button
                              type="button"
                              onClick={() => void enableOrCopySharing(false)}
                              disabled={saving}
                            >
                              <Copy aria-hidden="true" /> Salvar e copiar link
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => void enableOrCopySharing(true)}
                              disabled={saving}
                            >
                              Gerar novo link
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              onClick={() => void disableSharing()}
                              disabled={saving}
                            >
                              <Unlink aria-hidden="true" /> Desativar
                            </Button>
                          </div>
                        </>
                      ) : (
                        <Button
                          type="button"
                          className="karma-button"
                          onClick={() => void enableOrCopySharing(false)}
                          disabled={saving}
                        >
                          <Link2 aria-hidden="true" /> Criar e copiar link
                          público
                        </Button>
                      )}
                    </section>
                    <CharacterSheetView
                      draft={draft}
                      automatic={automatic}
                      derived={derived}
                      onChange={commitDraft}
                      onCombatAction={send}
                    />
                  </TabsContent>
                </Tabs>
              </section>

              {!widePage ? (
                <aside
                  className="character-summary"
                  aria-label="Resumo da ficha"
                >
                  <div className="summary-nameplate">
                    <span className="summary-monogram" aria-hidden="true">
                      {(draft.name || "K").slice(0, 1).toUpperCase()}
                    </span>
                    <div>
                      <strong>{draft.name || "Personagem sem nome"}</strong>
                      <small>
                        {[draft.race, draft.className]
                          .filter(Boolean)
                          .join(" · ") || "Escolhas em construção"}
                      </small>
                    </div>
                  </div>

                  <div className="summary-progress">
                    <span>
                      <strong>{completion}%</strong> da criação essencial
                    </span>
                    <Progress value={completion} />
                  </div>

                  <div className="derived-stat-grid">
                    <div className="derived-stat stat-life">
                      <Heart aria-hidden="true" />
                      <span>Vida</span>
                      <strong>{derived.life}</strong>
                    </div>
                    <div className="derived-stat stat-karma">
                      <Sparkles aria-hidden="true" />
                      <span>Karma</span>
                      <strong>{derived.karma}</strong>
                    </div>
                    <div className="derived-stat stat-armor">
                      <Shield aria-hidden="true" />
                      <span>CA</span>
                      <strong>{derived.armor}</strong>
                    </div>
                    <div className="derived-stat stat-move">
                      <RotateCcw aria-hidden="true" />
                      <span>Movimento</span>
                      <strong>{derived.movement}m</strong>
                    </div>
                    <div className="derived-stat stat-load">
                      <Package aria-hidden="true" />
                      <span>Carga</span>
                      <strong>{derived.load}</strong>
                    </div>
                    <div className="derived-stat">
                      <Shield aria-hidden="true" />
                      <span>Resistência</span>
                      <strong>{derived.resistance}</strong>
                    </div>
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
                        {complete ? (
                          <CheckCircle2 aria-hidden="true" />
                        ) : (
                          <span aria-hidden="true" />
                        )}
                        {label}
                      </div>
                    ))}
                  </div>

                  <p className="derived-note">
                    Vida, Karma, CA, Movimento e Resistência já incluem bônus
                    fixos e escolhas válidas de raça, classe, etapa, tamanho e
                    Domínios despertados. CA sem armadura; equipamento e efeitos
                    temporários precisam ser aplicados em jogo.
                  </p>
                </aside>
              ) : null}
            </div>

            <AlertDialog
              open={Boolean(pendingDelete)}
              onOpenChange={(open) => {
                if (!open) setPendingDelete(null);
              }}
            >
              <AlertDialogContent className="character-delete-dialog">
                <AlertDialogHeader>
                  <AlertDialogTitle>Excluir esta ficha?</AlertDialogTitle>
                  <AlertDialogDescription>
                    “{pendingDelete?.name}” será removida permanentemente do seu
                    arquivo. Esta ação não pode ser desfeita.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={deleteCharacter}
                    variant="destructive"
                  >
                    Excluir ficha
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        )}
      </CharacterCombatShell>
    </main>
  );
}
