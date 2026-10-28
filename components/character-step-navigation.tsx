"use client";

import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const steps = [
  { value: "essencia", label: "Essência" },
  { value: "atributos", label: "Atributos" },
  { value: "pericias", label: "Perícias" },
  { value: "poderes", label: "Poderes" },
  { value: "ficha", label: "Ficha" },
];

export function CharacterStepNavigation({ activeStep, onSelect }: {
  activeStep: string;
  onSelect: (step: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const navigating = useRef(false);
  const index = steps.findIndex(step => step.value === activeStep);

  function select(step: string) {
    navigating.current = true;
    onSelect(step);
    setOpen(false);
  }

  return <Popover open={open} onOpenChange={setOpen}>
    <PopoverTrigger asChild>
      <button type="button" className="character-step-toggle" aria-label={open ? "Fechar etapas da ficha" : "Abrir etapas da ficha"} title="Etapas da ficha">
        {open ? <ChevronLeft aria-hidden="true" /> : <ChevronRight aria-hidden="true" />}
        <span aria-hidden="true">{index + 1}/5</span>
      </button>
    </PopoverTrigger>
    <PopoverContent className="character-step-menu" side="right" align="end" sideOffset={10} collisionPadding={12}
      aria-label="Etapas da criação de personagem"
      onCloseAutoFocus={event => {
        if (!navigating.current) return;
        event.preventDefault();
        navigating.current = false;
        requestAnimationFrame(() => {
          const container = document.getElementById("character-steps");
          container?.scrollIntoView({ block: "start", behavior: "instant" });
          container?.querySelector<HTMLElement>('[role="tab"][aria-selected="true"]')?.focus({ preventScroll: true });
        });
      }}>
      <p className="character-step-menu-title">Etapas da ficha</p>
      <p className="character-step-menu-hint">Etapa {index + 1} de 5 · {steps[index]?.label}</p>
      <nav aria-label="Navegação rápida da ficha">
        {steps.map((step, i) => <button type="button" key={step.value} aria-current={activeStep === step.value ? "step" : undefined} onClick={() => select(step.value)}>
          <span className="character-step-number">{i + 1}</span><span>{step.label}</span><ChevronRight aria-hidden="true" />
        </button>)}
      </nav>
      {index < steps.length - 1 ? <button type="button" className="character-step-next" onClick={() => select(steps[index + 1].value)}>Próximo: {steps[index + 1].label}<ChevronRight aria-hidden="true" /></button> : null}
    </PopoverContent>
  </Popover>;
}
