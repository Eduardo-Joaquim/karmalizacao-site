import { thalassiaZones } from "@/data/navigation-index.json";
import { Waves } from "lucide-react";
export function ThalassiaArchive() {
  return (
    <div className="gaeria-category-grid thalassia-directory">
      {thalassiaZones.map(([id, title, text]) => (
        <a
          className="gaeria-entry gaeria-entry-royal"
          key={id}
          href={`/mundo/thalassia#thalassia-${id}`}
        >
          <Waves aria-hidden="true" />
          <h3>{title}</h3>
          <p>{text}</p>
          <span>Histórias e fichas completas →</span>
        </a>
      ))}
    </div>
  );
}
