import type { ReactNode } from "react";

export function TechniqueCost({ children, html }: { children?: ReactNode; html?: string }) {
  return <details className="technique-construction"><summary>Composição do custo</summary>{html !== undefined ? <div dangerouslySetInnerHTML={{ __html: html }} /> : <div>{children}</div>}</details>;
}
