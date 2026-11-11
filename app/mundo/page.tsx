import { AeriaArchive } from "@/components/aeria-archive";
import { ContinentalMonstersSection } from "@/components/continental-monsters-section";
import { GaeriaArchive } from "@/components/gaeria-archive";
import { IgnariaArchive } from "@/components/ignaria-archive";
import { ThalassiaArchive } from "@/components/thalassia-archive";
export default function World() {
  return (
    <main className="site-shell">
      <h1>Atlas do Mundo</h1>
      <GaeriaArchive />
      <IgnariaArchive />
      <AeriaArchive />
      <section>
        <h2>Thalassia · Os três tronos do oceano</h2>
        <ThalassiaArchive />
      </section>
      <ContinentalMonstersSection region="torre" />
    </main>
  );
}
