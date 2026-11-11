import { CourtDossier } from "@/components/elven-court-sheets";
import data from "@/data/thalassia.json";
import { Crown, Orbit, Waves } from "lucide-react";
export { ThalassiaArchive } from "@/components/thalassia-archive";
export function ThalassiaContent() {
  return (
    <div className="realm-content thalassia-content">
      <div
        className="realm-intro"
        dangerouslySetInnerHTML={{ __html: data.introHtml }}
      />
      {data.sections.map((section) => (
        <section className="realm-section" id={section.id} key={section.id}>
          <h2>{section.title}</h2>
          <div
            dangerouslySetInnerHTML={{
              __html: section.html.split("<article")[0],
            }}
          />
          {data.courtProfiles
            .filter((p) => section.html.includes(`id="${p.id}"`))
            .map((profile) => {
              const index = data.courtProfiles.findIndex(
                (p) => p.id === profile.id,
              );
              return (
                <CourtDossier
                  className={
                    profile.id === "ummu-hubur"
                      ? "boss-card-transcendental"
                      : ""
                  }
                  key={profile.id}
                  profile={profile}
                  index={index}
                  identity={{
                    role: profile.role,
                    stage: profile.stage,
                    rank:
                      profile.stage === "Kármica"
                        ? "Kármico"
                        : profile.stage === "VII"
                          ? "SSS"
                          : profile.stage === "VI"
                            ? "SS"
                            : profile.stage === "V"
                              ? "S"
                              : "A",
                    Icon: profile.zone === "hubur" ? Orbit : Crown,
                    accent: profile.id === "ummu-hubur" ? "#dce8f6" : "#92bad7",
                    jewel: "#1e3a5f",
                  }}
                  Mark={Waves}
                  showSources
                  solar={false}
                  motto="Uma passagem responde por quem a atravessa."
                  arsenal="Artes de Thalassia"
                />
              );
            })}
        </section>
      ))}
    </div>
  );
}
