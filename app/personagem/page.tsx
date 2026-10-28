import { requireChatGPTUser } from "@/app/chatgpt-auth";
import { CharacterBuilder } from "@/components/character-builder";
import { SiteHeader } from "@/components/site-header";

export const dynamic = "force-dynamic";

export default async function CharacterPage() {
  const user = await requireChatGPTUser("/personagem");

  return (
    <div className="site-page character-page">
      <SiteHeader user={user} />
      <CharacterBuilder displayName={user.displayName} />
    </div>
  );
}

