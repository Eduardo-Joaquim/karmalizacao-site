import { TechniqueCost } from "@/components/technique-cost";
import { costDisclosureHtml } from "@/lib/cost-disclosure";
import { Crown } from "lucide-react";
import type { ReactNode } from "react";

type SignatureField = { label: string; html: string };

export type RoyalSignatureCardProps = {
  id: string;
  name: string;
  grade: string;
  cost: string | number;
  action: string;
  source?: string;
  damageType?: string;
  showSource?: boolean;
  fields: SignatureField[];
  children?: ReactNode;
};

const labelText = (label: string) => label.replace(/\s+/g, " ").trim();
const compactField = (label: string) =>
  /^(Uso|Ativação|Preparo|Preparação|Requisito|Alcance e alvos|Teste|Teste e limiares)$/.test(
    labelText(label),
  );

function SignatureFields({
  fields,
  id,
}: {
  fields: SignatureField[];
  id: string;
}) {
  return (
    <div className="royal-signature-fields">
      {fields.map((field, index) => (
        <div
          className={
            "royal-signature-field" +
            (compactField(field.label)
              ? " royal-signature-field-compact"
              : "") +
            (/limite|fronteira/i.test(field.label)
              ? " royal-signature-field-limit"
              : "")
          }
          key={index}
        >
          {field.label && (
            <h6 id={`${id}-regra-${index + 1}`}>{labelText(field.label)}</h6>
          )}
          <div
            className="royal-signature-copy"
            dangerouslySetInnerHTML={{
              __html: costDisclosureHtml(field.html),
            }}
          />
        </div>
      ))}
    </div>
  );
}

export function RoyalSignatureCard({
  id,
  name,
  grade,
  cost,
  action,
  source,
  damageType,
  showSource = false,
  fields,
  children,
}: RoyalSignatureCardProps) {
  const description = fields.filter((field) => /^Descrição$/.test(field.label));
  const mechanics = fields.filter(
    (field) =>
      !/^(Fonte e Grau|Grau|Descrição|Composição de Karma)$/.test(
        labelText(field.label),
      ),
  );
  const composition = fields.filter(
    (field) => labelText(field.label) === "Composição de Karma",
  );
  const displayCost = /^\d+(?:[,.]\d+)?$/.test(String(cost))
    ? `${cost} Karma`
    : cost;
  const numericGrade = /^(?:I|II|III|IV|V|VI|VII)$/.test(grade);
  const sourceText = showSource && source ? source : damageType;

  return (
    <section
      className="elven-ability elven-signature royal-signature"
      id={id}
      aria-labelledby={`${id}-titulo`}
    >
      <header className="royal-signature-header">
        <div className="royal-signature-seal" aria-hidden="true">
          <Crown />
        </div>
        <div className="royal-signature-heading">
          <p>ASSINATURA</p>
          <h5 id={`${id}-titulo`}>{name}</h5>
          {sourceText && <span>{sourceText}</span>}
        </div>
      </header>

      <dl className="royal-signature-meta" aria-label="Dados da assinatura">
        <div>
          <dt>Custo</dt>
          <dd>{displayCost}</dd>
        </div>
        <div>
          <dt>Ação</dt>
          <dd>{action}</dd>
        </div>
        {grade && (
          <div>
            <dt>{numericGrade ? "Grau" : "Natureza"}</dt>
            <dd>{grade}</dd>
          </div>
        )}
      </dl>

      {description.length > 0 && (
        <div className="royal-signature-description">
          {description.map((field, index) => (
            <div key={index} dangerouslySetInnerHTML={{ __html: field.html }} />
          ))}
        </div>
      )}

      <SignatureFields fields={mechanics} id={id} />

      {children && <div className="royal-signature-tools">{children}</div>}

      {composition.length > 0 && (
        <div className="royal-signature-cost">
          {composition.map((field, index) => (
            <TechniqueCost key={index} html={field.html} />
          ))}
        </div>
      )}
    </section>
  );
}
