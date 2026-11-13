import {
  CourtDossier,
  type CourtIdentity,
} from "@/components/elven-court-sheets";
import demons from "@/data/demon-ignaria.json";
import ghouls from "@/data/ghoul-ignaria.json";
import lunaviel from "@/data/lunaviel-ignaria.json";
import { costDisclosureHtml } from "@/lib/cost-disclosure";
import {
  Crown,
  Flame,
  HeartPulse,
  Landmark,
  Shield,
  Sparkles,
  Swords,
} from "lucide-react";

export type IgnariaCollection = "demons" | "ghouls" | "lunaviel";
const role = (
  role: string,
  stage: string,
  rank: string,
  Icon: CourtIdentity["Icon"],
  accent: string,
  jewel: string,
): CourtIdentity => ({ role, stage, rank, Icon, accent, jewel });
const collections = {
  demons: {
    data: demons,
    Mark: Flame,
    motto: "“Aprendi a reinar antes de aprender a perdoar.”",
    arsenal: "As nove artes de Aqueronte",
    identities: [
      role("RAINHA DOS DEMÔNIOS", "VII", "SSS", Crown, "#e7c38d", "#b586db"),
      role("HERDEIRA · DUELISTA", "V", "S", Swords, "#ebb58e", "#c77860"),
      role("HERDEIRA · ALQUIMISTA", "V", "S", Sparkles, "#d0b3df", "#8e7dbb"),
      role("HERDEIRA · BARDO", "V", "S", Crown, "#cfc4ed", "#986db4"),
      role(
        "HERDEIRA · ELEMENTALISTA",
        "V",
        "S",
        HeartPulse,
        "#d4c2a3",
        "#a59b78",
      ),
      role("CASA DUCAL AGARES", "VI", "SS", Landmark, "#e6b0aa", "#b56978"),
      role("CASA MARQUESAL ANDRAS", "V", "S", Swords, "#d5c3dd", "#8e6a9e"),
      role("CASA MARQUESAL MARCHOSIAS", "V", "S", Shield, "#e1b69e", "#b57d61"),
    ],
  },
  ghouls: {
    data: ghouls,
    Mark: Shield,
    motto: "“A coroa não sustenta quem a carrega.”",
    arsenal: "O peso de sete golpes",
    identities: [
      role(
        "MATADOR DE RAINHAS · GÊNIO DA LUTA",
        "VII",
        "SSS",
        Shield,
        "#e5d4b2",
        "#b99565",
      ),
      role("PRETENDENTE À REALEZA", "VI", "SS", Swords, "#d8c6a8", "#b98c65"),
      role("PRETENDENTE À REALEZA", "VI", "SS", Sparkles, "#d4d3ad", "#a9a16f"),
      role("PRETENDENTE À REALEZA", "VI", "SS", Flame, "#d6c5a9", "#b89975"),
    ],
  },
  lunaviel: {
    data: lunaviel,
    Mark: Landmark,
    motto: "“Uma casa responde por aqueles que acolhe.”",
    arsenal: "A guarda da casa",
    identities: [
      role(
        "A PATRIARCA · CASA MARQUESAL LUNAVIEL",
        "V",
        "SS",
        Landmark,
        "#d5dbea",
        "#8fa3c5",
      ),
      role(
        "PATRIARCA CONSORTE · PROTETOR",
        "V",
        "S",
        Shield,
        "#d5bc8c",
        "#937b55",
      ),
      role("MORDOMO · PUGILISTA", "V", "S", Shield, "#b6c8d2", "#698b9f"),
    ],
  },
};

export function IgnariaCourtContent({ kind }: { kind: IgnariaCollection }) {
  const { data, identities, Mark, motto, arsenal } = collections[kind];
  return (
    <div
      className={`realm-content vampire-content ignaria-content ${kind}-content`}
    >
      <div
        className="realm-intro"
        dangerouslySetInnerHTML={{ __html: data.introHtml }}
      />
      {data.sections.map((section) => {
        const profiles = data.courtProfiles.filter((p) =>
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
                  const index = data.courtProfiles.findIndex(
                    (p) => p.id === profile.id,
                  );
                  return (
                    <CourtDossier
                      key={profile.id}
                      profile={profile}
                      index={index}
                      identity={identities[index]}
                      motto={motto}
                      arsenal={arsenal}
                      Mark={Mark}
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
