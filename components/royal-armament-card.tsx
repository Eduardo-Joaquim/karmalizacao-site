import type { RoyalArmament } from "@/lib/royal-armaments";
import { ChevronDown, Swords } from "lucide-react";

function CompleteRules({ title, html }: { title: string; html: string }) {
  return (
    <details className="royal-armament-rules">
      <summary>
        <span>{title}</span>
        <ChevronDown aria-hidden="true" />
      </summary>
      <div
        className="royal-armament-rules-content"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </details>
  );
}

export function RoyalArmamentCard({ armament }: { armament: RoyalArmament }) {
  const { rune } = armament;
  const headingId = `royal-armament-${armament.ownerId}`;

  return (
    <section
      className={`royal-armament royal-armament-${rune.kind}`}
      aria-labelledby={headingId}
    >
      <header className="royal-armament-heading">
        <p className="royal-armament-eyebrow">
          <Swords aria-hidden="true" />
          Arma principal
        </p>
        <h5 id={headingId}>{armament.name}</h5>
        <p className="royal-armament-description">{armament.description}</p>
      </header>

      <dl className="royal-armament-basics" aria-label="Dados da arma">
        <div>
          <dt>Dano-base</dt>
          <dd>{armament.damage}</dd>
        </div>
        <div>
          <dt>Alcance-base</dt>
          <dd>{armament.range}</dd>
        </div>
        <div>
          <dt>Ação</dt>
          <dd>{armament.action}</dd>
        </div>
      </dl>

      <div className="royal-armament-inscription">
        {rune.kind === "conventional" ? (
          <>
            <p className="royal-armament-rune-kind">
              {rune.support === "armor"
                ? "Inscrição na armadura"
                : "Inscrição convencional"}
            </p>
            <h6>{rune.name}</h6>
            <dl className="royal-armament-effects">
              <div>
                <dt>Enquanto armada</dt>
                <dd>{rune.passive}</dd>
              </div>
              <div>
                <dt>Estouro</dt>
                <dd>{rune.burst}</dd>
              </div>
            </dl>
            <p className="royal-armament-note">
              Grau {rune.grade} · {rune.retainedKarma} Karma Retido
              {rune.support === "armor" &&
                ". A inscrição pertence à guarda da armadura; o arco permanece sem runa."}
            </p>
            {rune.apexRequired && (
              <p className="royal-armament-note">
                Passiva de Grau V e Estouro compartilham o único Ápice da cena;
                a inscrição não permite outra técnica de Grau V.
              </p>
            )}
          </>
        ) : (
          <>
            <p className="royal-armament-rune-kind">
              {rune.classification} · {rune.conditionIds.length} condições
            </p>
            <h6>{rune.name}</h6>
            <dl className="royal-armament-effects">
              <div>
                <dt>Despertar</dt>
                <dd>
                  {rune.marks} marcas no mesmo alvo, por acertos de contato com
                  esta arma.
                </dd>
              </div>
              <div>
                <dt>Dano da maldição</dt>
                <dd>{rune.damage} Corrupto</dd>
              </div>
              <div>
                <dt>Efeito</dt>
                <dd>{rune.effect}</dd>
              </div>
              <div>
                <dt>Escape</dt>
                <dd>
                  CD {rune.escapeDC} - {rune.escapeCalculation}.
                </dd>
              </div>
              <div>
                <dt>Forja</dt>
                <dd>
                  Presença + Controle da Corrupção CD {rune.forgeDC}; 1 TE (2
                  horas) para gravar ou alterar.
                </dd>
              </div>
              <div>
                <dt>Fome</dt>
                <dd>
                  1 natural selecionado exige Presença + Controle da Corrupção
                  CD {rune.hungerDC}; falha causa 1d6 Corrupto direto.
                </dd>
              </div>
            </dl>
            {rune.tributeLife !== undefined && (
              <p className="royal-armament-note">
                Dízimo de Carne - exige a portadora já ferida, com Vida atual
                menor que a máxima, e cobra {rune.tributeLife} Vida irreduzíveis
                no despertar.
              </p>
            )}
            <p className="royal-armament-exclusivity">
              Maldição exclusiva desta arma. Inscrições convencionais
              bloqueadas.
            </p>
          </>
        )}
      </div>

      <div className="royal-armament-disclosures">
        <CompleteRules
          title="Regras completas da arma"
          html={armament.weaponDetailsHtml}
        />
        <CompleteRules
          title={
            rune.kind === "cursed" ? "Condições e Fome" : "Inscrição e Estouro"
          }
          html={armament.runeDetailsHtml}
        />
      </div>
    </section>
  );
}
