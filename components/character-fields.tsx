"use client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import type { BonusChoiceSlot } from "@/lib/character-rules";
import { Minus, Plus } from "lucide-react";
export function FieldLabel({
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

export function PointStepper({
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

export function SelectField({
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
      <NativeSelect
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {placeholder ? (
          <NativeSelectOption value="">{placeholder}</NativeSelectOption>
        ) : null}
        {options.map((option) => (
          <NativeSelectOption value={option} key={option}>
            {option}
          </NativeSelectOption>
        ))}
      </NativeSelect>
    </div>
  );
}

export function AllocationPanel({
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
              <Label
                htmlFor={`allocation-${title}-${index}`}
                className="character-label"
              >
                <span>{slot.label}</span>
                <small>+{slot.value}</small>
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
                <NativeSelectOption value="">
                  Distribuir bônus
                </NativeSelectOption>
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

export function selectionsComplete(
  slots: BonusChoiceSlot[],
  selections: string[],
) {
  return slots.every((_, index) => Boolean(selections[index]));
}
