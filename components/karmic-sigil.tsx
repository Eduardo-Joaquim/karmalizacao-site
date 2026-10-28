import { cn } from "@/lib/utils";

export function KarmicSigil({ className }: { className?: string }) {
  return (
    <div className={cn("karmic-sigil", className)} aria-hidden="true">
      <span className="sigil-orbit sigil-orbit-one" />
      <span className="sigil-orbit sigil-orbit-two" />
      <span className="sigil-axis sigil-axis-one" />
      <span className="sigil-axis sigil-axis-two" />
      <span className="sigil-core">
        <span>K</span>
      </span>
      <span className="sigil-word sigil-word-karma">KARMA</span>
      <span className="sigil-word sigil-word-marca">MARCA</span>
      <span className="sigil-word sigil-word-voto">VOTO</span>
      <span className="sigil-word sigil-word-caminho">CAMINHO</span>
    </div>
  );
}

