import {
  CourtDossier,
  type CourtIdentity,
} from "@/components/elven-court-sheets";
import vampires from "@/data/vampire-ignaria.json";
import { costDisclosureHtml } from "@/lib/cost-disclosure";
import {
  Cross,
  Crown,
  Droplets,
  KeyRound,
  Shield,
  Swords,
  Wheat,
} from "lucide-react";

const identities: CourtIdentity[] = [
  {
    role: "SEXTA RAINHA DOS VAMPIROS",
    stage: "VII",
    rank: "SSS",
    Icon: Crown,
    accent: "#efc38b",
    jewel: "#c3485b",
  },
  {
    role: "PRIMEIRA PRINCESA · SANGUE REAL",
    stage: "VI",
    rank: "SS",
    Icon: Droplets,
    accent: "#eda6af",
    jewel: "#ad324b",
  },
  {
    role: "SEGUNDA PRINCESA · CURANDEIRA",
    stage: "IV",
    rank: "A",
    Icon: Cross,
    accent: "#e8d4be",
    jewel: "#b97783",
  },
  {
    role: "CASA MARQUESAL DORNE",
    stage: "IV",
    rank: "A",
    Icon: Shield,
    accent: "#d4b5a5",
    jewel: "#9c5e62",
  },
  {
    role: "CASA MARQUESAL KESSEL",
    stage: "IV",
    rank: "A",
    Icon: Swords,
    accent: "#e4bd91",
    jewel: "#b4644f",
  },
  {
    role: "CASA CONDAL SENN",
    stage: "III",
    rank: "B",
    Icon: Wheat,
    accent: "#e4cba4",
    jewel: "#ac7885",
  },
  {
    role: "CASA VISCONDAL KOST",
    stage: "III",
    rank: "B",
    Icon: KeyRound,
    accent: "#cfb5cc",
    jewel: "#8f617f",
  },
];

export function VampireCourtContent() {
  return (
    <div className="realm-content vampire-content">
      <div
        className="realm-intro"
        dangerouslySetInnerHTML={{ __html: vampires.introHtml }}
      />
      {vampires.sections.map((section) => {
        const profiles = vampires.courtProfiles.filter((p) =>
          section.html.includes(`id="${p.id}"`),
        );
        return (
          <section className="realm-section" id={section.id} key={section.id}>
            <h2>{section.title}</h2>
            {profiles.length ? (
              <>
                <div
                  dangerouslySetInnerHTML={{
                    __html: section.html.split("<article")[0],
                  }}
                />
                {profiles.map((profile) => {
                  const index = vampires.courtProfiles.indexOf(profile);
                  return (
                    <CourtDossier
                      key={profile.id}
                      profile={profile}
                      index={index}
                      identity={identities[index]}
                      motto="“Nenhum nome voltará a ser propriedade de outro.”"
                      arsenal="Água, Sangue, Karma e lança"
                      Mark={Droplets}
                      solar={false}
                      showSources
                    />
                  );
                })}
              </>
            ) : (
              <div
                dangerouslySetInnerHTML={{
                  __html: costDisclosureHtml(section.html),
                }}
              />
            )}
          </section>
        );
      })}
    </div>
  );
}
