"use client";

import { useEffect, useMemo, useState } from "react";
import { buildRuleToc, filterRuleToc, type TocSection } from "@/lib/rule-toc";

export function RuleToc({ sections }: { sections: readonly TocSection[] }) {
  const groups = useMemo(() => buildRuleToc(sections), [sections]);
  const [active, setActive] = useState("");
  const [progress, setProgress] = useState(0);
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set());
  const parent = groups.find(
    (group) =>
      group.id === active ||
      group.children.some((child) => child.id === active),
  )?.id;
  const visible = filterRuleToc(groups, query);
  const searchable =
    groups.reduce((count, group) => count + 1 + group.children.length, 0) > 12;

  const [collapsedFor, setCollapsedFor] = useState<string>();
  useEffect(() => {
    const article = document.querySelector<HTMLElement>(".rule-article");
    if (!article) return;
    const nodes = groups
      .flatMap((group) => [group, ...group.children])
      .map((section) => document.getElementById(section.id))
      .filter((node): node is HTMLElement => Boolean(node));
    let frame = 0;
    const update = () => {
      frame = 0;
      const top = article.getBoundingClientRect().top + window.scrollY;
      const distance = article.offsetHeight - window.innerHeight;
      setProgress(
        Math.round(
          Math.max(
            0,
            Math.min(
              100,
              distance > 0 ? ((window.scrollY - top) / distance) * 100 : 100,
            ),
          ),
        ),
      );
      let current = "";
      for (const node of nodes) {
        if (!node.getClientRects().length) continue;
        if (node.getBoundingClientRect().top <= 130) current = node.id;
        else break;
      }
      setActive(current);
    };
    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    const observer =
      typeof IntersectionObserver !== "undefined"
        ? new IntersectionObserver(schedule, {
            rootMargin: "-15% 0px -60% 0px",
            threshold: [0, 1],
          })
        : undefined;
    nodes.forEach((node) => observer?.observe(node));
    const resize =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(schedule)
        : undefined;
    resize?.observe(article);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    window.addEventListener("hashchange", schedule);
    update();
    return () => {
      observer?.disconnect();
      resize?.disconnect();
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("hashchange", schedule);
    };
  }, [groups]);

  return (
    <aside className="rule-toc" aria-label="Nesta página">
      <p>Nesta página</p>
      <div
        className="rule-toc-progress"
        role="progressbar"
        aria-label="Progresso de leitura"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progress}
      >
        <span style={{ width: `${progress}%` }} />
      </div>
      <small className="rule-toc-percent">{progress}% lido</small>
      {searchable && (
        <label className="rule-toc-filter">
          Filtrar tópicos
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar neste capítulo"
          />
        </label>
      )}
      <ol>
        {visible.map((group) => {
          const open =
            Boolean(query.trim()) ||
            expanded.has(group.id) ||
            (parent === group.id &&
              !(collapsedFor === parent && collapsed.has(group.id)));
          const number = groups.findIndex((item) => item.id === group.id) + 1;
          return (
            <li key={group.id} className="rule-toc-group">
              <div className="rule-toc-parent">
                <a
                  href={`#${group.id}`}
                  aria-current={parent === group.id ? "location" : undefined}
                >
                  <span className="rule-toc-number">
                    {String(number).padStart(2, "0")}
                  </span>
                  {group.title}
                </a>
                {group.children.length > 0 && (
                  <button
                    type="button"
                    aria-label={`${open ? "Recolher" : "Expandir"} ${group.title}`}
                    aria-expanded={open}
                    aria-controls={`toc-children-${group.id}`}
                    onClick={() => {
                      setCollapsedFor(parent);
                      setExpanded((previous) => {
                        const next = new Set(previous);
                        if (open) next.delete(group.id);
                        else next.add(group.id);
                        return next;
                      });
                      setCollapsed((previous) => {
                        const next = new Set(previous);
                        if (open) next.add(group.id);
                        else next.delete(group.id);
                        return next;
                      });
                    }}
                  >
                    {open ? "−" : "+"}
                  </button>
                )}
              </div>
              {group.children.length > 0 && (
                <ol
                  id={`toc-children-${group.id}`}
                  hidden={!open}
                  className="rule-toc-children"
                >
                  {group.children.map((child) => (
                    <li key={child.id}>
                      <a
                        href={`#${child.id}`}
                        aria-current={
                          active === child.id ? "location" : undefined
                        }
                      >
                        {child.title}
                      </a>
                    </li>
                  ))}
                </ol>
              )}
            </li>
          );
        })}
      </ol>
      {!visible.length && (
        <p className="rule-toc-empty">
          {query ? (
            "Nenhum tópico encontrado."
          ) : (
            <a href="#topo">Início do capítulo</a>
          )}
        </p>
      )}
      <a href="#topo" className="back-to-top">
        Voltar ao topo ↑
      </a>
    </aside>
  );
}
