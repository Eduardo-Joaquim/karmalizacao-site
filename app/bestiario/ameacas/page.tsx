import { EarlyThreats } from "@/components/early-threats";
import { SiteHeader } from "@/components/site-header";
export const metadata = { title: "Monstros e ameaças · Etapas I–IV" };
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ regiao?: string }>;
}) {
  const { regiao } = await searchParams;
  return (
    <div className="site-page">
      <SiteHeader />
      <EarlyThreats
        initialRegion={
          regiao && ["gaeria", "ignaria", "aeria", "torre"].includes(regiao)
            ? regiao
            : "all"
        }
      />
    </div>
  );
}
