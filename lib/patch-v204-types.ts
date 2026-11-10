import type { CategoriaAcessoBencao } from "@/lib/blessings-filter";

export type NaturezaBencao =
  | "Dobra Elemental Anômala"
  | "Runa Kármica Primordial"
  | "Técnica Divina / Fenômeno"
  | "Método de Luta Exclusivo";

export interface ExtensaoBencao {
  nome: string;
  acaoECusto: string;
  efeito: string;
}

// The catalogue number is also the stable ID used by existing character links.
export interface BencaoItem {
  id: number;
  categoriaAcesso: CategoriaAcessoBencao;
  disponivelParaPlayer: boolean;
  portadorOuLinhagemExclusiva?: string;
  title: string;
  facet: string;
  nature: NaturezaBencao;
  phenomenon: string;
  extensions: [string, string];
  harvest: string;
}

export interface DeusPanteao {
  name: string;
  epithet: string;
  blessings: [BencaoItem, BencaoItem, BencaoItem];
}

export interface PanteaoCardData {
  id: number;
  name: string;
  wing: string;
  deities: DeusPanteao[];
}

export function lerExtensaoBencao(texto: string): ExtensaoBencao {
  const partes = texto.match(/^(.*?)\s+\(([^()]+)\):\s*([\s\S]+)$/);
  return partes
    ? { nome: partes[1], acaoECusto: partes[2], efeito: partes[3] }
    : { nome: "Extensão", acaoECusto: "", efeito: texto };
}
