import { GmPage } from '@/components/gm-page';
import { SiteHeader } from '@/components/site-header';
import { getChatGPTUser } from '@/app/chatgpt-auth';
export const dynamic='force-dynamic';
export const metadata={title:'Escudo do Mestre · Combate em Tempo Real',description:'Encontros, fichas vinculadas, Forja de Ameaças e consulta às regras de Karmalização.'};
export default async function Page(){const user=await getChatGPTUser();return <div className="site-page"><SiteHeader user={user}/><GmPage/></div>;}
