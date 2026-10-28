// Convert authored cost explanations into native, keyboard-accessible disclosures.
// Only the explicit composition marker is moved; ability effects stay visible.
export function costDisclosureHtml(html: string): string {
  const marker = /<strong>Composição de\s+Karma:\s*<\/strong>/i;
  const disclose = (body: string) => {
    const match = marker.exec(body);
    if (!match) return body;
    const before = body.slice(0, match.index);
    const explanation = body.slice(match.index + match[0].length);
    return `${before.trim() ? `<p>${before}</p>` : ""}<details class="technique-construction"><summary>Composição do custo</summary><div>${explanation}</div></details>`;
  };
  let result = html.replace(/<p(?:\s[^>]*)?>([\s\S]*?)<\/p>/gi, (paragraph, body: string) => marker.test(body) ? disclose(body) : paragraph);
  if (marker.test(result)) result = disclose(result);
  return result;
}
