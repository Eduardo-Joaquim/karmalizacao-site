import { getChatGPTUser } from "@/app/chatgpt-auth";
import { CharacterBuilder } from "@/components/character-builder";
import { SiteHeader } from "@/components/site-header";

export const dynamic = "force-dynamic";

export default async function CharacterPage({
  searchParams,
}: {
  searchParams: Promise<{ bencao?: string; poder?: string }>;
}) {
  const params = await searchParams;
  const user = await getChatGPTUser();

  return (
    <div className="site-page character-page">
      <SiteHeader user={user} />
      <CharacterBuilder
        storageScope={user?.email ?? "guest"}
        displayName={user?.displayName ?? "Visitante"}
        authenticated={Boolean(user)}
        initialBlessing={Number(params.bencao) || undefined}
        openPowers={params.poder === "divino" || Boolean(params.bencao)}
      />
    </div>
  );
}
