"use client";

import { useEffect, useRef, useState } from "react";
import { History, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { LATEST_PATCH, PATCH_NOTES, shouldShowPatch, getPatchVersion } from "@/lib/patch-notes";

const DISMISSAL_KEY = "karmalizacao:patch-dismissed";

export function PatchNotes() {
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(LATEST_PATCH.id);
  const trigger = useRef<HTMLButtonElement>(null);
  const selected = PATCH_NOTES.find((patch) => patch.id === selectedId) ?? LATEST_PATCH;

  useEffect(() => {
    // Device-local dismissal only; character data stays in the account database.
    let dismissed: string | null = null;
    try { dismissed = sessionStorage.getItem(DISMISSAL_KEY); } catch { /* Storage may be blocked. */ }
    if (shouldShowPatch(dismissed)) {
      const timer = window.setTimeout(() => setOpen(true), 0);
      return () => window.clearTimeout(timer);
    }
  }, []);

  function changeOpen(next: boolean) {
    setOpen(next);
    if (next) setSelectedId(LATEST_PATCH.id);
    else {
      try { sessionStorage.setItem(DISMISSAL_KEY, LATEST_PATCH.id); } catch { /* Closing still works. */ }
    }
  }

  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogTrigger asChild>
        <Button ref={trigger} type="button" variant="outline" className="patch-trigger" aria-label="Abrir histórico de atualizações">
          <History aria-hidden="true" /><span>Atualizações</span><small>{getPatchVersion(LATEST_PATCH) ? `v${getPatchVersion(LATEST_PATCH)}` : "Histórico"}</small>
        </Button>
      </DialogTrigger>
      <DialogContent className="patch-modal" showCloseButton={false} onCloseAutoFocus={(event) => { event.preventDefault(); trigger.current?.focus(); }}>
        <header className="patch-modal-header">
          <span className="eyebrow"><Sparkles aria-hidden="true" /> ARQUIVO DE ATUALIZAÇÕES</span>
          <DialogTitle>Karmalização · Patch notes</DialogTitle>
          <DialogDescription>O que mudou no site, nas regras, nas fichas e no Bestiário.</DialogDescription>
          <DialogClose asChild><Button type="button" variant="ghost" size="icon" className="patch-close" aria-label="Fechar atualizações"><X aria-hidden="true" /></Button></DialogClose>
        </header>
        <div className="patch-modal-body">
          <nav className="patch-history" aria-label="Escolher atualização">
            {PATCH_NOTES.map((patch) => (
              <button type="button" key={patch.id} aria-pressed={selected.id === patch.id} aria-controls="patch-details" onClick={() => setSelectedId(patch.id)}>
                <small>{patch.id === LATEST_PATCH.id ? "MAIS RECENTE" : "HISTÓRICO"}</small>
                <strong>{patch.label}</strong>
              </button>
            ))}
          </nav>
          <section id="patch-details" className="patch-details" aria-live="polite" aria-atomic="true">
            <span className="patch-version">{selected.label}</span>
            <h2>{selected.title}</h2>
            <ul>{selected.highlights.map((highlight) => <li key={highlight}>{highlight}</li>)}</ul>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
